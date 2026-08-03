import { socketService } from './socket';

export const BITRATE_INITIAL_START_BPS = 800000; // 800 kbps smooth start
export const BITRATE_CEILING_BPS = 2000000;      // 2.0 Mbps Ceiling
export const BITRATE_FLOOR_BPS = 150000;        // 150 kbps Floor

function setSDPBitrate(sdp: string, bitrateKbps: number = 1500): string {
  let lines = sdp.split('\r\n');
  let inVideo = false;
  let newLines: string[] = [];

  for (let line of lines) {
    if (line.startsWith('m=video')) {
      inVideo = true;
      newLines.push(line);
      newLines.push(`b=AS:${bitrateKbps}`);
      newLines.push(`b=TIAS:${bitrateKbps * 1000}`);
      continue;
    }
    if (line.startsWith('m=') && !line.startsWith('m=video')) {
      inVideo = false;
    }
    if (inVideo && (line.startsWith('b=AS:') || line.startsWith('b=TIAS:'))) {
      continue;
    }
    newLines.push(line);
  }
  return newLines.join('\r\n');
}

const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

const DEFAULT_ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    ...DEFAULT_STUN_SERVERS,
  ],
  bundlePolicy: 'max-bundle',
  iceCandidatePoolSize: 10,
};

let cachedIceConfig: RTCConfiguration = DEFAULT_ICE_CONFIG;

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string = '';
  private connectionTimeoutTimer: NodeJS.Timeout | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  
  // Adaptive Bitrate & Stats Tracking
  private statsIntervalTimer: NodeJS.Timeout | null = null;
  private currentMaxBitrate: number = BITRATE_INITIAL_START_BPS;
  private unhealthyPollCount: number = 0;
  private healthyPollCount: number = 0;
  private currentResolution: '720p' | '480p' = '720p';
  private prevPacketsLost: number = 0;
  private prevPacketsSent: number = 0;

  public onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  public onLocalStreamCallback: ((stream: MediaStream) => void) | null = null;
  public onConnectionStateCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  public onConnectionTimeoutCallback: (() => void) | null = null;

  public getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  // Pre-fetch TURN credentials in background so initPeerConnection is 100% synchronous
  public async preloadIceServers(): Promise<void> {
    try {
      const res = await fetch('/api/turn-credentials', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const iceServers: RTCIceServer[] = [];

        // 1. PRIMARY: Metered.live TURN entry (FIRST for all connections)
        if (data.meteredTurn) {
          if (Array.isArray(data.meteredTurn)) {
            iceServers.push(...data.meteredTurn);
          } else if (data.meteredTurn.urls) {
            iceServers.push({
              urls: data.meteredTurn.urls,
              username: data.meteredTurn.username,
              credential: data.meteredTurn.credential,
            });
          }
        }

        // 2. SECONDARY: ExpressTurn entry
        if (data.expressTurn && data.expressTurn.urls && data.expressTurn.urls.length > 0) {
          iceServers.push({
            urls: data.expressTurn.urls,
            username: data.expressTurn.username,
            credential: data.expressTurn.credential,
          });
        }

        // 3. STUN servers
        iceServers.push(...DEFAULT_STUN_SERVERS);

        // 4. TERTIARY: Coturn entry (if configured)
        if (data.coturn && data.coturn.urls && data.coturn.urls.length > 0) {
          iceServers.push({
            urls: data.coturn.urls,
            username: data.coturn.username,
            credential: data.coturn.credential,
          });
        }

        cachedIceConfig = {
          iceServers,
          bundlePolicy: 'max-bundle',
          iceCandidatePoolSize: 10,
        };
      }
    } catch (err) {
      console.warn('Failed to pre-fetch dynamic TURN credentials, using default pool:', err);
    }
  }

  public async getLocalMedia(video: boolean = true, audio: boolean = true): Promise<MediaStream | null> {
    // Pre-fetch ice servers when local camera initializes
    this.preloadIceServers();

    try {
      if (this.localStream) {
        this.stopLocalMedia();
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
              facingMode: 'user',
            }
          : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
      });

      if (this.onLocalStreamCallback) {
        this.onLocalStreamCallback(this.localStream);
      }

      return this.localStream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      if (video) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
          });
          if (this.onLocalStreamCallback && this.localStream) {
            this.onLocalStreamCallback(this.localStream);
          }
          return this.localStream;
        } catch (subErr) {
          if (audio) {
            try {
              this.localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
              if (this.onLocalStreamCallback && this.localStream) {
                this.onLocalStreamCallback(this.localStream);
              }
              return this.localStream;
            } catch (audioErr) {
              console.error('Error accessing audio device:', audioErr);
            }
          }
        }
      }
      return null;
    }
  }

  // Instant 0ms Synchronous PeerConnection Initialization
  public initPeerConnection(roomId: string, isInitiator: boolean): void {
    this.roomId = roomId;
    this.cleanupPeerConnection();

    // Use cached TURN / STUN configuration synchronously
    this.peerConnection = new RTCPeerConnection(cachedIceConfig);
    this.remoteStream = new MediaStream();
    this.pendingCandidates = [];

    // Reset adaptive bitrate state to smooth 800 kbps start
    this.currentMaxBitrate = BITRATE_INITIAL_START_BPS;
    this.unhealthyPollCount = 0;
    this.healthyPollCount = 0;
    this.currentResolution = '720p';
    this.prevPacketsLost = 0;
    this.prevPacketsSent = 0;

    // 35-second fallback connection timeout for global cross-region candidate gathering
    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.peerConnection && this.peerConnection.connectionState !== 'connected') {
        console.warn('WebRTC peer connection timed out after 35 seconds');
        if (this.onConnectionTimeoutCallback) {
          this.onConnectionTimeoutCallback();
        }
      }
    }, 35000);

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    }

    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      if (this.remoteStream && this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Send ICE candidates to partner
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendICECandidate(this.roomId, event.candidate.toJSON());
      }
    };

    // Handle connection state changes & start adaptive stats polling loop
    this.peerConnection.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState;

      if (state === 'connected') {
        if (this.connectionTimeoutTimer) {
          clearTimeout(this.connectionTimeoutTimer);
          this.connectionTimeoutTimer = null;
        }

        // Apply smooth 800 kbps start bitrate & balanced degradation preference
        const videoSender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video');
        if (videoSender) {
          try {
            const params = videoSender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = BITRATE_INITIAL_START_BPS; // Start smooth at 800 kbps
            // @ts-ignore
            params.degradationPreference = 'balanced';
            videoSender.setParameters(params).catch(() => {});
          } catch (e) {
            // Ignore param error
          }
        }

        // Start 3-second Adaptive Bitrate & Resolution getStats polling loop
        this.startAdaptiveStatsLoop();
      }

      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback(state);
      }
    };

    // INSTANT SOCKET SUBSCRIPTIONS with ICE Candidate Buffering
    socketService.subscribe('webrtc_offer', async (offer: RTCSessionDescriptionInit) => {
      if (!this.peerConnection) return;
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        await this.flushPendingIceCandidates();

        const rawAnswer = await this.peerConnection.createAnswer();
        const sdpWithBitrate = setSDPBitrate(rawAnswer.sdp || '', 1500);
        const answer = new RTCSessionDescription({ type: rawAnswer.type, sdp: sdpWithBitrate });

        await this.peerConnection.setLocalDescription(answer);
        socketService.sendWebRTCAnswer(this.roomId, answer);
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    });

    socketService.subscribe('webrtc_answer', async (answer: RTCSessionDescriptionInit) => {
      if (!this.peerConnection) return;
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        await this.flushPendingIceCandidates();
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    });

    socketService.subscribe('webrtc_ice_candidate', async (candidate: RTCIceCandidateInit) => {
      if (!this.peerConnection) return;
      if (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
        // Buffer candidate until remote description is set
        this.pendingCandidates.push(candidate);
        return;
      }
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    // Create SDP Offer synchronously if Initiator
    if (isInitiator) {
      (async () => {
        try {
          if (!this.peerConnection) return;
          const rawOffer = await this.peerConnection.createOffer();
          const sdpWithBitrate = setSDPBitrate(rawOffer.sdp || '', 1500);
          const offer = new RTCSessionDescription({ type: rawOffer.type, sdp: sdpWithBitrate });

          await this.peerConnection.setLocalDescription(offer);
          socketService.sendWebRTCOffer(this.roomId, offer);
        } catch (err) {
          console.error('Error creating WebRTC offer:', err);
        }
      })();
    }
  }

  private async flushPendingIceCandidates(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.pendingCandidates.length > 0) {
      const cand = this.pendingCandidates.shift();
      if (cand) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn('Error flushing buffered ICE candidate:', err);
        }
      }
    }
  }

  // 3-second polling loop for Adaptive Bitrate & Resolution fallback
  private startAdaptiveStatsLoop(): void {
    if (this.statsIntervalTimer) {
      clearInterval(this.statsIntervalTimer);
    }

    this.statsIntervalTimer = setInterval(async () => {
      if (!this.peerConnection || this.peerConnection.connectionState !== 'connected') {
        return;
      }

      try {
        const stats = await this.peerConnection.getStats();
        let packetsLost = 0;
        let packetsSent = 0;
        let rttMs = 0;

        stats.forEach((report) => {
          if (report.type === 'outbound-rtp' && report.kind === 'video') {
            packetsSent = report.packetsSent || 0;
          }
          if (report.type === 'remote-inbound-rtp' && report.kind === 'video') {
            packetsLost = report.packetsLost || 0;
            if (report.roundTripTime) {
              rttMs = report.roundTripTime * 1000;
            }
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.currentRoundTripTime && rttMs === 0) {
              rttMs = report.currentRoundTripTime * 1000;
            }
          }
        });

        const deltaLost = Math.max(0, packetsLost - this.prevPacketsLost);
        const deltaSent = Math.max(0, packetsSent - this.prevPacketsSent);
        this.prevPacketsLost = packetsLost;
        this.prevPacketsSent = packetsSent;

        const totalPackets = deltaSent + deltaLost;
        const lossRatio = totalPackets > 0 ? deltaLost / totalPackets : 0;

        const isUnhealthy = lossRatio > 0.05 || rttMs > 300;

        if (isUnhealthy) {
          this.unhealthyPollCount++;
          this.healthyPollCount = 0;

          // Bad conditions for 2 consecutive polls (6s): step maxBitrate down by ~25%
          if (this.unhealthyPollCount >= 2) {
            const nextBitrate = Math.max(BITRATE_FLOOR_BPS, Math.floor(this.currentMaxBitrate * 0.75));
            if (nextBitrate !== this.currentMaxBitrate) {
              this.currentMaxBitrate = nextBitrate;
              this.applyBitrateParameters(this.currentMaxBitrate);
              console.log(`[WebRTC Adaptive] Poor connection detected (Loss: ${(lossRatio * 100).toFixed(1)}%, RTT: ${rttMs.toFixed(0)}ms). Stepped maxBitrate down to ${Math.round(this.currentMaxBitrate / 1000)} kbps`);
            }

            // Adaptive Resolution Fallback: Drop to 640x480 @ 20fps if at floor
            if (this.currentMaxBitrate <= BITRATE_FLOOR_BPS && this.currentResolution === '720p') {
              this.applyCameraConstraints(640, 480, 20);
              this.currentResolution = '480p';
              console.log('[WebRTC Adaptive] Quality severely degraded. Lowering local video track constraints to 640x480 @ 20fps');
            }
          }
        } else {
          this.healthyPollCount++;
          this.unhealthyPollCount = 0;

          // Healthy conditions for 15 seconds (5 consecutive polls): step maxBitrate back up toward ceiling (2.0 Mbps)
          if (this.healthyPollCount >= 5) {
            if (this.currentMaxBitrate < BITRATE_CEILING_BPS) {
              const nextBitrate = Math.min(BITRATE_CEILING_BPS, Math.floor(this.currentMaxBitrate * 1.25));
              if (nextBitrate !== this.currentMaxBitrate) {
                this.currentMaxBitrate = nextBitrate;
                this.applyBitrateParameters(this.currentMaxBitrate);
                console.log(`[WebRTC Adaptive] Network conditions healthy. Stepped maxBitrate up to ${Math.round(this.currentMaxBitrate / 1000)} kbps`);
              }
            }

            // Restore resolution to 960x540 / 1280x720 @ 30fps if bandwidth recovers
            if (this.currentMaxBitrate > 500000 && this.currentResolution === '480p') {
              this.applyCameraConstraints(960, 540, 30);
              this.currentResolution = '720p';
              console.log('[WebRTC Adaptive] Network recovered. Restored local video track constraints to 960x540 @ 30fps');
            }
          }
        }
      } catch (err) {
        console.warn('Error polling WebRTC stats:', err);
      }
    }, 3000);
  }

  private applyBitrateParameters(targetMaxBitrate: number): void {
    if (!this.peerConnection) return;
    const videoSender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video');
    if (videoSender) {
      try {
        const params = videoSender.getParameters();
        if (!params.encodings || params.encodings.length === 0) {
          params.encodings = [{}];
        }
        params.encodings[0].maxBitrate = targetMaxBitrate;
        // @ts-ignore
        params.degradationPreference = 'balanced';
        videoSender.setParameters(params).catch(() => {});
      } catch (e) {
        // Ignore setParameters error
      }
    }
  }

  private applyCameraConstraints(width: number, height: number, frameRate: number): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.applyConstraints === 'function') {
        videoTrack.applyConstraints({
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: frameRate },
        }).catch((e) => console.warn('Could not apply camera constraints:', e));
      }
    }
  }

  public async restartIce(): Promise<void> {
    if (this.peerConnection && this.roomId) {
      try {
        const rawOffer = await this.peerConnection.createOffer({ iceRestart: true });
        const sdpWithBitrate = setSDPBitrate(rawOffer.sdp || '', 1500);
        const offer = new RTCSessionDescription({ type: rawOffer.type, sdp: sdpWithBitrate });
        await this.peerConnection.setLocalDescription(offer);
        socketService.sendWebRTCOffer(this.roomId, offer);
      } catch (err) {
        console.error('Error restarting ICE:', err);
      }
    }
  }

  public toggleVideo(enabled?: boolean): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = enabled !== undefined ? enabled : !videoTrack.enabled;
        videoTrack.enabled = nextState;
        return nextState;
      }
    }
    return false;
  }

  public toggleAudio(enabled?: boolean): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = enabled !== undefined ? enabled : !audioTrack.enabled;
        audioTrack.enabled = nextState;
        return nextState;
      }
    }
    return false;
  }

  public stopLocalMedia(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  public cleanupPeerConnection(): void {
    if (this.statsIntervalTimer) {
      clearInterval(this.statsIntervalTimer);
      this.statsIntervalTimer = null;
    }
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.pendingCandidates = [];
    this.remoteStream = null;
  }

  public closeAll(): void {
    this.cleanupPeerConnection();
    this.stopLocalMedia();
  }
}

export const webrtcManager = new WebRTCManager();
