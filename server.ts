import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing. Server cannot start securely.');
  process.exit(1);
}

// Interfaces for in-memory socket state
interface PublicProfile {
  nickname: string;
  gender: string;
  country: string;
  languages: string[];
  interests: string[];
}

interface MatchFilters {
  gender: string;
  country: string;
  language: string;
  commonInterests: boolean;
  globalSearch: boolean;
  mode: 'text' | 'video';
}

interface QueueUser {
  socketId: string;
  profile: PublicProfile;
  filters: MatchFilters;
  joinedAt: number;
}

interface ActiveRoom {
  roomId: string;
  userA: string; // socketId
  userB: string; // socketId
  mode: 'text' | 'video';
  createdAt: number;
}

// JSON Disk Persistence Setup (No DB)
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const BANS_FILE = path.join(DATA_DIR, 'bans.json');

interface ReportEntry {
  id: string;
  roomId: string;
  reason: string;
  details?: string;
  timestamp: number;
}

interface BanEntry {
  hashedIp: string;
  reason: string;
  bannedAt: number;
}

function loadReportsFromDisk(): ReportEntry[] {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading reports.json:', err);
  }
  return [];
}

function saveReportToDisk(report: ReportEntry): void {
  reportsLog.push(report);
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reportsLog, null, 2));
  } catch (err) {
    console.error('Error writing reports.json:', err);
  }
}

function loadBansFromDisk(): BanEntry[] {
  try {
    if (fs.existsSync(BANS_FILE)) {
      return JSON.parse(fs.readFileSync(BANS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading bans.json:', err);
  }
  return [];
}

const reportsLog: ReportEntry[] = loadReportsFromDisk();
const bansList: BanEntry[] = loadBansFromDisk();

function hashIpAddress(rawIp: string): string {
  const cleanIp = (rawIp || '127.0.0.1').replace(/^.*:/, '');
  return crypto.createHmac('sha256', JWT_SECRET).update(cleanIp).digest('hex');
}

function addBan(rawIp: string, reason: string): void {
  const hashedIp = hashIpAddress(rawIp);
  if (!bansList.some((b) => b.hashedIp === hashedIp)) {
    bansList.push({ hashedIp, reason, bannedAt: Date.now() });
    try {
      fs.writeFileSync(BANS_FILE, JSON.stringify(bansList, null, 2));
    } catch (err) {
      console.error('Error writing bans.json:', err);
    }
  }
}

function isIpBanned(rawIp: string): boolean {
  const hashedIp = hashIpAddress(rawIp);
  return bansList.some((b) => b.hashedIp === hashedIp);
}

// IN-MEMORY SOCKET & MATCHING STATE
const connectedUsers = new Map<string, { socketId: string; profile?: PublicProfile; ip?: string }>();
let waitingQueue: QueueUser[] = [];
const activeRooms = new Map<string, ActiveRoom>();
const blockedPairs = new Set<string>(); // "socketA_socketB"
const socketRateLimits = new Map<string, { count: number; lastReset: number }>();

async function startServer() {
  const app = express();
  app.use(express.json());

  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 25000,
  });

  // SEO & Monetization Endpoints
  const handleAdsTxt = (req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send('google.com, pub-8087434803774295, DIRECT, f08c47fec0942fa0\n');
  };

  app.get('/ads.txt', handleAdsTxt);
  app.get('/ADS.TXT', handleAdsTxt);

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /adminpanel\nDisallow: /api/admin/\n\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`);
  });

  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${req.get('host')}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  });

  // REST API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      onlineUsers: connectedUsers.size,
      activeRooms: activeRooms.size,
      queueSize: waitingQueue.length,
    });
  });

  // Short-Lived TURN Credential Generation Endpoint (Coturn REST API convention + ExpressTurn fallback)
  app.post('/api/turn-credentials', (req, res) => {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '';
    
    if (isIpBanned(rawIp)) {
      return res.status(403).json({ success: false, message: 'Banned IP' });
    }

    const TURN_STATIC_SECRET = process.env.TURN_STATIC_SECRET || '';
    const TURN_HOST = process.env.TURN_HOST || '';
    const EXPRESSTURN_USERNAME = process.env.EXPRESSTURN_USERNAME || '';
    const EXPRESSTURN_CREDENTIAL = process.env.EXPRESSTURN_CREDENTIAL || '';
    const EXPRESSTURN_URLS = process.env.EXPRESSTURN_URLS ? process.env.EXPRESSTURN_URLS.split(',').map((u) => u.trim()) : [];

    let coturnData: { urls: string[]; username: string; credential: string } | null = null;

    if (TURN_STATIC_SECRET && TURN_HOST) {
      const ttl = 3600; // 1 hour TTL
      const username = `${Math.floor(Date.now() / 1000) + ttl}:vibestream`;
      const credential = crypto.createHmac('sha1', TURN_STATIC_SECRET).update(username).digest('base64');
      coturnData = {
        urls: [
          `turn:${TURN_HOST}:3478`,
          `turns:${TURN_HOST}:5349?transport=tcp`,
        ],
        username,
        credential,
      };
    }

    let expressTurnData: { urls: string[]; username: string; credential: string } | null = null;
    if (EXPRESSTURN_URLS.length > 0 && EXPRESSTURN_USERNAME && EXPRESSTURN_CREDENTIAL) {
      expressTurnData = {
        urls: EXPRESSTURN_URLS,
        username: EXPRESSTURN_USERNAME,
        credential: EXPRESSTURN_CREDENTIAL,
      };
    }

    res.json({
      success: true,
      coturn: coturnData,
      expressTurn: expressTurnData,
    });
  });

  // Extended Admin Stats API & Password Auth
  const initialAdminPassword = process.env.ADMIN_PASSWORD || 'Admin';
  let adminPasswordHash = bcrypt.hashSync(initialAdminPassword, 10);

  app.post('/api/admin/auth', (req, res) => {
    const { password } = req.body;
    if (password && bcrypt.compareSync(password, adminPasswordHash)) {
      res.json({ success: true, token: 'admin_authenticated_session' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid Admin Password' });
    }
  });

  app.post('/api/admin/reset-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !bcrypt.compareSync(currentPassword, adminPasswordHash)) {
      return res.status(401).json({ success: false, message: 'Current admin password is incorrect' });
    }
    if (!newPassword || newPassword.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'New password must be at least 3 characters long' });
    }
    adminPasswordHash = bcrypt.hashSync(newPassword.trim(), 10);
    res.json({ success: true, message: 'Admin password reset successfully' });
  });

  app.get('/api/admin/stats', (req, res) => {
    const memory = process.memoryUsage();
    let textRooms = 0;
    let videoRooms = 0;

    activeRooms.forEach((room) => {
      if (room.mode === 'video') videoRooms++;
      else textRooms++;
    });

    res.json({
      status: 'healthy',
      uptime: Math.floor(process.uptime()),
      onlineUsers: connectedUsers.size,
      activeRooms: activeRooms.size,
      textRooms,
      videoRooms,
      queueSize: waitingQueue.length,
      blockedPairsCount: blockedPairs.size / 2, // Pairs stored bi-directionally
      rateLimitedSockets: socketRateLimits.size,
      recentReports: reportsLog.slice(-10).reverse(),
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: PORT,
        hasGoogleAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        hasJwtSecret: Boolean(process.env.JWT_SECRET),
      },
      memory: {
        rssMb: (memory.rss / (1024 * 1024)).toFixed(1),
        heapUsedMb: (memory.heapUsed / (1024 * 1024)).toFixed(1),
        heapTotalMb: (memory.heapTotal / (1024 * 1024)).toFixed(1),
      },
    });
  });

  // Google Auth Endpoint (Verifies real Google ID Token)
  app.post('/api/auth/google', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID Token is required' });
    }

    try {
      const googleAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await googleAuthClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ success: false, message: 'Invalid Google ID token payload' });
      }

      const userPayload = {
        id: `google_${payload.sub}`,
        name: payload.name || 'Google User',
        picture: payload.picture || '',
        email: payload.email || '',
      };

      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, user: userPayload });
    } catch (err: any) {
      console.error('Google token verification failed:', err.message || err);
      return res.status(401).json({ success: false, message: 'Google ID Token verification failed' });
    }
  });

  // Helper for Rate Limiting
  const checkRateLimit = (socketId: string): boolean => {
    const now = Date.now();
    const limit = socketRateLimits.get(socketId) || { count: 0, lastReset: now };

    if (now - limit.lastReset > 5000) {
      limit.count = 1;
      limit.lastReset = now;
      socketRateLimits.set(socketId, limit);
      return true;
    }

    limit.count++;
    socketRateLimits.set(socketId, limit);
    return limit.count <= 25; // max 25 events per 5s
  };

  // Matchmaker Logic
  const tryMatchUser = (candidate: QueueUser) => {
    const candidateSocket = io.sockets.sockets.get(candidate.socketId);
    if (!candidateSocket) return;

    for (let i = 0; i < waitingQueue.length; i++) {
      const other = waitingQueue[i];
      if (other.socketId === candidate.socketId) continue;

      // Mode match (text with text, video with video)
      if (other.filters.mode !== candidate.filters.mode) continue;

      // Check blocked pair
      const pair1 = `${candidate.socketId}_${other.socketId}`;
      const pair2 = `${other.socketId}_${candidate.socketId}`;
      if (blockedPairs.has(pair1) || blockedPairs.has(pair2)) continue;

      const now = Date.now();
      const waitingTime = Math.max(now - candidate.joinedAt, now - other.joinedAt);

      // Gender filter compatibility check
      const genderMatch =
        (candidate.filters.gender === 'any' || candidate.filters.gender === other.profile.gender) &&
        (other.filters.gender === 'any' || other.filters.gender === candidate.profile.gender);

      // Country filter compatibility check
      const countryMatch =
        candidate.filters.country === 'any' ||
        (candidate.filters.country === 'same' && candidate.profile.country === other.profile.country) ||
        candidate.filters.country === other.profile.country;

      // Language filter compatibility check
      const langMatch =
        candidate.filters.language === 'any' ||
        candidate.profile.languages.some((l) => other.profile.languages.includes(l));

      // Common interests check
      const hasInterestOverlap =
        !candidate.filters.commonInterests ||
        candidate.profile.interests.some((i) => other.profile.interests.includes(i));

      // Priority criteria OR random fallback after 5s wait time
      const isMatch = (genderMatch && countryMatch && langMatch && hasInterestOverlap) || (waitingTime > 5000 && candidate.filters.globalSearch);

      if (isMatch) {
        // Remove both from waiting queue
        waitingQueue = waitingQueue.filter(
          (u) => u.socketId !== candidate.socketId && u.socketId !== other.socketId
        );

        const roomId = `room_${Math.random().toString(36).substring(2, 9)}`;
        const roomState: ActiveRoom = {
          roomId,
          userA: candidate.socketId,
          userB: other.socketId,
          mode: candidate.filters.mode,
          createdAt: Date.now(),
        };

        activeRooms.set(roomId, roomState);

        const socketA = candidateSocket;
        const socketB = io.sockets.sockets.get(other.socketId);

        if (socketA && socketB) {
          socketA.join(roomId);
          socketB.join(roomId);

          socketA.emit('match_found', {
            roomId,
            partnerProfile: other.profile,
            isInitiator: true,
            mode: candidate.filters.mode,
          });

          socketB.emit('match_found', {
            roomId,
            partnerProfile: candidate.profile,
            isInitiator: false,
            mode: candidate.filters.mode,
          });

          console.log(`Matched ${candidate.socketId} with ${other.socketId} in ${roomId}`);
          return;
        }
      }
    }
  };

  // Periodic Matchmaker Loop for queued strangers
  setInterval(() => {
    for (const user of [...waitingQueue]) {
      tryMatchUser(user);
    }
  }, 1500);

  // Broadcast Online User Counter
  setInterval(() => {
    io.emit('online_count', connectedUsers.size);
  }, 3000);

  // Socket.IO Handlers
  io.on('connection', (socket: Socket) => {
    const rawIp = (socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      socket.request.socket.remoteAddress ||
      socket.handshake.address ||
      '';

    if (isIpBanned(rawIp)) {
      console.log(`[Ban Enforcement] Rejecting connection from banned IP: ${socket.id}`);
      socket.emit('banned_user', { message: 'Your IP address has been banned due to terms violation.' });
      socket.disconnect(true);
      return;
    }

    connectedUsers.set(socket.id, { socketId: socket.id, ip: rawIp });
    io.emit('online_count', connectedUsers.size);

    // Join Matchmaking Queue
    socket.on('join_queue', (data: { profile: PublicProfile; filters: MatchFilters }) => {
      if (!checkRateLimit(socket.id)) return;

      // Remove from queue if already present
      waitingQueue = waitingQueue.filter((u) => u.socketId !== socket.id);

      const queueItem: QueueUser = {
        socketId: socket.id,
        profile: data.profile,
        filters: data.filters,
        joinedAt: Date.now(),
      };

      waitingQueue.push(queueItem);
      tryMatchUser(queueItem);
    });

    // Leave Matchmaking Queue
    socket.on('leave_queue', () => {
      waitingQueue = waitingQueue.filter((u) => u.socketId !== socket.id);
    });

    // Send Chat Message
    socket.on('send_message', (data: { roomId: string; text: string }) => {
      if (!checkRateLimit(socket.id)) return;
      if (!data.text || !data.roomId) return;

      const room = activeRooms.get(data.roomId);
      if (!room) return;

      // Sanitize simple text
      const sanitizedText = data.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const messagePayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        sender: 'stranger',
        text: sanitizedText,
        timestamp: Date.now(),
      };

      socket.to(data.roomId).emit('receive_message', messagePayload);
    });

    // Typing Status
    socket.on('send_typing', (data: { roomId: string; isTyping: boolean }) => {
      socket.to(data.roomId).emit('partner_typing', data.isTyping);
    });

    // Skip Stranger / End Chat
    socket.on('skip_stranger', (data: { roomId: string }) => {
      const room = activeRooms.get(data.roomId);
      if (room) {
        io.to(data.roomId).emit('stranger_disconnected');
        activeRooms.delete(data.roomId);
      }
    });

    // WebRTC Signaling Events
    socket.on('webrtc_offer', (data: { roomId: string; offer: any }) => {
      socket.to(data.roomId).emit('webrtc_offer', data.offer);
    });

    socket.on('webrtc_answer', (data: { roomId: string; answer: any }) => {
      socket.to(data.roomId).emit('webrtc_answer', data.answer);
    });

    socket.on('webrtc_ice_candidate', (data: { roomId: string; candidate: any }) => {
      if (!checkRateLimit(socket.id)) return;
      socket.to(data.roomId).emit('webrtc_ice_candidate', data.candidate);
    });

    // Safety: Report & Block (Persisted to disk)
    socket.on('report_user', (data: { roomId: string; reason: string; details?: string }) => {
      const newReport: ReportEntry = {
        id: `rep_${Date.now()}`,
        roomId: data.roomId,
        reason: data.reason || 'unspecified',
        details: data.details,
        timestamp: Date.now(),
      };
      saveReportToDisk(newReport);

      const room = activeRooms.get(data.roomId);
      if (room) {
        const partnerId = room.userA === socket.id ? room.userB : room.userA;
        const partnerUser = connectedUsers.get(partnerId);
        if (partnerUser && partnerUser.ip) {
          addBan(partnerUser.ip, `Reported for: ${data.reason || 'Safety Policy Violation'}`);
        }
        blockedPairs.add(`${socket.id}_${partnerId}`);
        blockedPairs.add(`${partnerId}_${socket.id}`);
        io.to(data.roomId).emit('stranger_disconnected');
        activeRooms.delete(data.roomId);
      }
    });

    socket.on('block_user', (data: { roomId: string }) => {
      const room = activeRooms.get(data.roomId);
      if (room) {
        const partnerId = room.userA === socket.id ? room.userB : room.userA;
        const partnerUser = connectedUsers.get(partnerId);
        if (partnerUser && partnerUser.ip) {
          addBan(partnerUser.ip, 'Blocked by partner');
        }
        blockedPairs.add(`${socket.id}_${partnerId}`);
        blockedPairs.add(`${partnerId}_${socket.id}`);
        io.to(data.roomId).emit('stranger_disconnected');
        activeRooms.delete(data.roomId);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      waitingQueue = waitingQueue.filter((u) => u.socketId !== socket.id);
      socketRateLimits.delete(socket.id);

      // Clean active rooms
      for (const [roomId, room] of activeRooms.entries()) {
        if (room.userA === socket.id || room.userB === socket.id) {
          io.to(roomId).emit('stranger_disconnected');
          activeRooms.delete(roomId);
        }
      }

      io.emit('online_count', connectedUsers.size);
    });
  });

  // Vite Middleware in Development vs Static Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`StrangerPulse Chat Server running on http://0.0.0.0:${PORT}`);

    // Self Keep-Alive ping for Render Free Tier (pings every 10 minutes to prevent sleep)
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    setInterval(async () => {
      try {
        const urlToPing = process.env.RENDER_EXTERNAL_URL 
          ? `${process.env.RENDER_EXTERNAL_URL}/api/health` 
          : `http://localhost:${PORT}/api/health`;
        const res = await fetch(urlToPing);
        console.log(`[Keep-Alive Ping] Render self-wake ping to ${urlToPing} - Status: ${res.status}`);
      } catch (pingErr) {
        console.log(`[Keep-Alive Ping] Self-wake ping attempted:`, pingErr);
      }
    }, TEN_MINUTES_MS);
  });
}

startServer();
