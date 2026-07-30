import { socketService } from './socket';

export const DEFAULT_VIDEO_BITRATE_FLOOR = 500000; // 500 kbps floor

/* 
 * Note: Metered Open Relay project (openrelay.metered.ca) provides free-tier TURN relay bandwidth (20 GB/mo free).
 * Load credentials via environment variables VITE_TURN_USERNAME and VITE_TURN_CREDENTIAL (or VITE_TURN_PASSWORD).
 * If traffic exceeds the free monthly cap, the fallback path is self-hosting coturn on a free-tier VPS
 * (e.g., Oracle Cloud's Always Free VM instance), which provides unlimited relay bandwidth without maintenance fees.
 */
const getIceServers = (): RTCConfiguration => {
  const turnUsername = (import.meta as any).env?.VITE_TURN_USERNAME || '';
  const turnCredential = (import.meta as any).env?.VITE_TURN_CREDENTIAL || (import.meta as any).env?.VITE_TURN_PASSWORD || '';
  const turnUrl = (import.meta as any).env?.VITE_TURN_URL || '';

  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  if (turnUsername && turnCredential) {
    iceServers.push(
      {
        urls: turnUrl || 'turn:openrelay.metered.ca:80',
        username: turnUsername,
        credential: turnCredential,
      },
      {
        urls: turnUrl ? turnUrl.replace(':80', ':443') : 'turn:openrelay.metered.ca:443',
        username: turnUsername,
        credential: turnCredential,
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: turnUsername,
        credential: turnCredential,
      }
    );
  }

  return { iceServers };
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

  public getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  public async getLocalMedia(video: boolean = true, audio: boolean = true): Promise<MediaStream | null> {
    try {
      if (this.localStream) {
        this.stopLocalMedia();
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video
          ? {
              width: { min: 480, ideal: 1280 },
              height: { min: 360, ideal: 720 },
              frameRate: { ideal: 24, min: 15 },
              facingMode: 'user',
            }
          : false,
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

    // Add local tracks & set bitrate floor + degradation preference
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      const videoSender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video');
      if (videoSender) {
        try {
          const params = videoSender.getParameters();
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          params.encodings[0].maxBitrate = DEFAULT_VIDEO_BITRATE_FLOOR;
          // @ts-ignore
          params.degradationPreference = 'maintain-framerate';
          videoSender.setParameters(params).catch((e) => console.warn('Could not set video parameters:', e));
        } catch (e) {
          console.warn('Error applying video sender parameters:', e);
        }
      }
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

  public async restartIce(): Promise<void> {
    if (!this.peerConnection || !this.roomId) return;
    try {
      console.log('Attempting WebRTC ICE restart...');
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);
      socketService.sendWebRTCOffer(this.roomId, offer);
    } catch (err) {
      console.error('Error during ICE restart:', err);
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


