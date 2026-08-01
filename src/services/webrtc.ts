import { socketService } from './socket';

export const DEFAULT_VIDEO_BITRATE_FLOOR = 3500000; // 3.5 Mbps High Definition floor

/* 
 * Note: Metered Open Relay project (openrelay.metered.ca) provides free-tier TURN relay bandwidth (20 GB/mo free).
 * Load credentials via environment variables VITE_TURN_USERNAME and VITE_TURN_CREDENTIAL (or VITE_TURN_PASSWORD).
 * If traffic exceeds the free monthly cap, the fallback path is self-hosting coturn on a free-tier VPS
 * (e.g., Oracle Cloud's Always Free VM instance), which provides unlimited relay bandwidth without maintenance fees.
 */
const getIceServers = (): RTCConfiguration => {
  const turnUsername = (import.meta as any).env?.VITE_TURN_USERNAME || 'openrelayproject';
  const turnCredential = (import.meta as any).env?.VITE_TURN_CREDENTIAL || (import.meta as any).env?.VITE_TURN_PASSWORD || 'openrelayproject';
  const turnUrl = (import.meta as any).env?.VITE_TURN_URL || '';

  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: turnUrl || ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'],
        username: turnUsername,
        credential: turnCredential,
      },
    ],
    bundlePolicy: 'max-bundle',
    iceCandidatePoolSize: 10,
  };
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
      // Fallback to basic video/audio if 720p ideal fails
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
          // Fallback to audio-only if video fails
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

  public async initPeerConnection(roomId: string, isInitiator: boolean): Promise<void> {
    this.roomId = roomId;
    this.cleanupPeerConnection();

    const config = getIceServers();
    this.peerConnection = new RTCPeerConnection(config);
    this.remoteStream = new MediaStream();

    // 20-second fallback connection timeout for candidate gathering
    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.peerConnection && this.peerConnection.connectionState !== 'connected') {
        console.warn('WebRTC peer connection timed out after 20 seconds');
        if (this.onConnectionTimeoutCallback) {
          this.onConnectionTimeoutCallback();
        }
      }
    }, 20000);

    // Add local tracks & set adaptive maxBitrate
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
          params.encodings[0].maxBitrate = 2500000; // 2.5 Mbps adaptive max
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


