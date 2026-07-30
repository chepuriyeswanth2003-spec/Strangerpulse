import { socketService } from './socket';

const getIceServers = (): RTCConfiguration => {
  const stunServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  const turnUrl = (import.meta as any).env?.VITE_TURN_URL as string;
  const turnUsername = (import.meta as any).env?.VITE_TURN_USERNAME as string;
  const turnCredential = (import.meta as any).env?.VITE_TURN_PASSWORD as string;

  if (turnUrl) {
    stunServers.push({
      urls: turnUrl,
      username: turnUsername || undefined,
      credential: turnCredential || undefined,
    });
  }

  return { iceServers: stunServers };
};

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string = '';
  private connectionTimeoutTimer: NodeJS.Timeout | null = null;
  
  public onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  public onLocalStreamCallback: ((stream: MediaStream) => void) | null = null;
  public onConnectionStateCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  public onConnectionTimeoutCallback: (() => void) | null = null;

  public async getLocalMedia(video: boolean = true, audio: boolean = true): Promise<MediaStream | null> {
    try {
      if (this.localStream) {
        this.stopLocalMedia();
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      });

      if (this.onLocalStreamCallback) {
        this.onLocalStreamCallback(this.localStream);
      }

      return this.localStream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      // Fallback to audio-only if video fails (e.g. no camera attached)
      if (video && audio) {
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
      return null;
    }
  }

  public async initPeerConnection(roomId: string, isInitiator: boolean): Promise<void> {
    this.roomId = roomId;
    this.cleanupPeerConnection();

    const config = getIceServers();
    this.peerConnection = new RTCPeerConnection(config);
    this.remoteStream = new MediaStream();

    // Start 12-second connection timeout
    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.peerConnection && this.peerConnection.connectionState !== 'connected') {
        console.warn('WebRTC peer connection timed out after 12 seconds');
        if (this.onConnectionTimeoutCallback) {
          this.onConnectionTimeoutCallback();
        }
      }
    }, 12000);

    // Add local tracks
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

    // Connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState;
      if (state === 'connected' && this.connectionTimeoutTimer) {
        clearTimeout(this.connectionTimeoutTimer);
        this.connectionTimeoutTimer = null;
      }
      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback(state);
      }
    };

    // Setup socket listeners for signaling
    socketService.subscribe('webrtc_offer', async (offer: RTCSessionDescriptionInit) => {
      if (!this.peerConnection) return;
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
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
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    });

    socketService.subscribe('webrtc_ice_candidate', async (candidate: RTCIceCandidateInit) => {
      if (!this.peerConnection) return;
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    // If initiator, create and send offer
    if (isInitiator) {
      try {
        const offer = await this.peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await this.peerConnection.setLocalDescription(offer);
        socketService.sendWebRTCOffer(this.roomId, offer);
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
      }
    }
  }

  public toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) return false;

    const newState = enabled !== undefined ? enabled : !videoTracks[0].enabled;
    videoTracks.forEach((t) => (t.enabled = newState));
    return newState;
  }

  public toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) return false;

    const newState = enabled !== undefined ? enabled : !audioTracks[0].enabled;
    audioTracks.forEach((t) => (t.enabled = newState));
    return newState;
  }

  public stopLocalMedia(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  public cleanupPeerConnection(): void {
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
    this.remoteStream = null;
  }

  public closeAll(): void {
    this.stopLocalMedia();
    this.cleanupPeerConnection();
  }
}

export const webrtcManager = new WebRTCManager();

