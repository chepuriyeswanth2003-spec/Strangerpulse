import { socketService } from './socket';

export const DEFAULT_VIDEO_BITRATE_FLOOR = 2500000; // 2.5 Mbps High-Def target

function setSDPBitrate(sdp: string, bitrateKbps: number = 2500): string {
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

const getIceServers = (): RTCConfiguration => {
  const turnUsername = (import.meta as any).env?.VITE_TURN_USERNAME || 'openrelayproject';
  const turnCredential = (import.meta as any).env?.VITE_TURN_CREDENTIAL || (import.meta as any).env?.VITE_TURN_PASSWORD || 'openrelayproject';
  const turnUrl = (import.meta as any).env?.VITE_TURN_URL || '';

  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      {
        urls: turnUrl || [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turn:openrelay.metered.ca:443?transport=tcp'
        ],
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

  public async initPeerConnection(roomId: string, isInitiator: boolean): Promise<void> {
    this.roomId = roomId;
    this.cleanupPeerConnection();

    const config = getIceServers();
    this.peerConnection = new RTCPeerConnection(config);
    this.remoteStream = new MediaStream();

    // 25-second fallback connection timeout for ICE candidate gathering
    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.peerConnection && this.peerConnection.connectionState !== 'connected') {
        console.warn('WebRTC peer connection timed out after 25 seconds');
        if (this.onConnectionTimeoutCallback) {
          this.onConnectionTimeoutCallback();
        }
      }
    }, 25000);

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

    // Handle connection state changes & clear timeout
    this.peerConnection.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState;

      if (state === 'connected') {
        if (this.connectionTimeoutTimer) {
          clearTimeout(this.connectionTimeoutTimer);
          this.connectionTimeoutTimer = null;
        }

        // Apply high-bandwidth sender parameters smoothly after connection
        const videoSender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video');
        if (videoSender) {
          try {
            const params = videoSender.getParameters();
            if (params && params.encodings && params.encodings.length > 0) {
              params.encodings[0].maxBitrate = 2500000; // 2.5 Mbps crisp 720p HD
              videoSender.setParameters(params).catch(() => {});
            }
          } catch (e) {
            // Ignore bitrate errors
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
        const rawAnswer = await this.peerConnection.createAnswer();
        
        // Inject high bandwidth allocation into SDP Answer (Forces 2.5 Mbps consumption)
        const sdpWithBitrate = setSDPBitrate(rawAnswer.sdp || '', 2500);
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
        const rawOffer = await this.peerConnection.createOffer();
        
        // Inject high bandwidth allocation into SDP Offer (Forces 2.5 Mbps consumption)
        const sdpWithBitrate = setSDPBitrate(rawOffer.sdp || '', 2500);
        const offer = new RTCSessionDescription({ type: rawOffer.type, sdp: sdpWithBitrate });

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
        const rawOffer = await this.peerConnection.createOffer({ iceRestart: true });
        const sdpWithBitrate = setSDPBitrate(rawOffer.sdp || '', 2500);
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
