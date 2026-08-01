import { socketService } from './socket';

export const DEFAULT_VIDEO_BITRATE_FLOOR = 3000000; // 3.0 Mbps High-Def target

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
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, min: 24 },
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
      console.error('Error accessing 720p media devices:', err);
      // Fallback to basic camera if 720p ideal fails
      if (video) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
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

    // 20-second fallback connection timeout for ICE candidate gathering
    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.peerConnection && this.peerConnection.connectionState !== 'connected') {
        console.warn('WebRTC peer connection timed out after 20 seconds');
        if (this.onConnectionTimeoutCallback) {
          this.onConnectionTimeoutCallback();
        }
      }
    }, 20000);

    // Add local tracks & set H.264 / VP8 hardware accelerated codec preference
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          const sender = this.peerConnection.addTrack(track, this.localStream);
          if (track.kind === 'video' && 'RTCRtpSender' in window && 'getCapabilities' in RTCRtpSender) {
            try {
              // Prefer H.264 hardware acceleration for 0ms latency & crisp 720p
              const capabilities = RTCRtpSender.getCapabilities('video');
              if (capabilities && capabilities.codecs) {
                const preferredCodecs = capabilities.codecs.filter(
                  (c) => c.mimeType.toLowerCase() === 'video/h264' || c.mimeType.toLowerCase() === 'video/vp8'
                );
                const transceiver = this.peerConnection.getTransceivers().find((t) => t.sender === sender);
                if (transceiver && 'setCodecPreferences' in transceiver && preferredCodecs.length > 0) {
                  transceiver.setCodecPreferences(preferredCodecs);
                }
              }
            } catch (e) {
              // Ignore codec preference error on unsupported browsers
            }
          }
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

    // Apply Crisp 720p HD Bitrate & maintain-resolution mode ONCE CONNECTED
    this.peerConnection.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState;

      if (state === 'connected') {
        if (this.connectionTimeoutTimer) {
          clearTimeout(this.connectionTimeoutTimer);
          this.connectionTimeoutTimer = null;
        }

        // Apply 3.0 Mbps Bitrate Floor & maintain-resolution mode AFTER connected (prevents blurring)
        const videoSender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video');
        if (videoSender) {
          try {
            const params = videoSender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = 3500000; // 3.5 Mbps Max target
            // @ts-ignore
            params.degradationPreference = 'maintain-resolution'; // NEVER downscale or blur pixels!
            videoSender.setParameters(params).catch((e) => console.warn('Could not set connected bitrate:', e));
          } catch (e) {
            console.warn('Error applying connected video sender parameters:', e);
          }
        }
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

    // Create SDP Offer if Initiator
    if (isInitiator) {
      try {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        socketService.sendWebRTCOffer(this.roomId, offer);
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
      }
    }
  }

  public async restartIce(): Promise<void> {
    if (this.peerConnection && this.roomId) {
      try {
        const offer = await this.peerConnection.createOffer({ iceRestart: true });
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
    this.cleanupPeerConnection();
    this.stopLocalMedia();
  }
}

export const webrtcManager = new WebRTCManager();
