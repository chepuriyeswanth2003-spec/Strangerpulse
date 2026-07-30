import { io, Socket } from 'socket.io-client';
import { PublicProfile, MatchFilters, ChatMessage } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Connect to current window host
    this.socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server:', this.socket?.id);
      this.emitToListeners('connect_status', true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      this.emitToListeners('connect_status', false);
    });

    this.socket.on('online_count', (count: number) => {
      this.emitToListeners('online_count', count);
    });

    this.socket.on('match_found', (data: { roomId: string; partnerProfile: PublicProfile; isInitiator: boolean; mode: 'text' | 'video' }) => {
      this.emitToListeners('match_found', data);
    });

    this.socket.on('receive_message', (message: ChatMessage) => {
      this.emitToListeners('receive_message', message);
    });

    this.socket.on('partner_typing', (isTyping: boolean) => {
      this.emitToListeners('partner_typing', isTyping);
    });

    this.socket.on('stranger_disconnected', () => {
      this.emitToListeners('stranger_disconnected');
    });

    this.socket.on('webrtc_offer', (offer: RTCSessionDescriptionInit) => {
      this.emitToListeners('webrtc_offer', offer);
    });

    this.socket.on('webrtc_answer', (answer: RTCSessionDescriptionInit) => {
      this.emitToListeners('webrtc_answer', answer);
    });

    this.socket.on('webrtc_ice_candidate', (candidate: RTCIceCandidateInit) => {
      this.emitToListeners('webrtc_ice_candidate', candidate);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public joinQueue(profile: PublicProfile, filters: MatchFilters): void {
    if (!this.socket) this.connect();
    this.socket?.emit('join_queue', { profile, filters });
  }

  public leaveQueue(): void {
    this.socket?.emit('leave_queue');
  }

  public sendMessage(roomId: string, text: string): void {
    this.socket?.emit('send_message', { roomId, text });
  }

  public sendTyping(roomId: string, isTyping: boolean): void {
    this.socket?.emit('send_typing', { roomId, isTyping });
  }

  public skipStranger(roomId: string): void {
    this.socket?.emit('skip_stranger', { roomId });
  }

  public sendWebRTCOffer(roomId: string, offer: RTCSessionDescriptionInit): void {
    this.socket?.emit('webrtc_offer', { roomId, offer });
  }

  public sendWebRTCAnswer(roomId: string, answer: RTCSessionDescriptionInit): void {
    this.socket?.emit('webrtc_answer', { roomId, answer });
  }

  public sendICECandidate(roomId: string, candidate: RTCIceCandidateInit): void {
    this.socket?.emit('webrtc_ice_candidate', { roomId, candidate });
  }

  public reportUser(roomId: string, reason: string, details?: string): void {
    this.socket?.emit('report_user', { roomId, reason, details });
  }

  public blockUser(roomId: string): void {
    this.socket?.emit('block_user', { roomId });
  }

  public subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emitToListeners(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
