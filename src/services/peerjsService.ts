import Peer, { MediaConnection, DataConnection } from 'peerjs';

export class PeerJSService {
  private peer: Peer | null = null;
  private currentCall: MediaConnection | null = null;
  private currentConn: DataConnection | null = null;
  private myPeerId: string = '';

  public onMatchFound: ((partnerId: string) => void) | null = null;
  public onRemoteStream: ((stream: MediaStream) => void) | null = null;
  public onMessage: ((text: string) => void) | null = null;
  public onDisconnected: (() => void) | null = null;

  public async initializePeer(): Promise<string> {
    if (this.peer && !this.peer.destroyed) {
      return this.myPeerId;
    }

    return new Promise((resolve, reject) => {
      const customId = `strangerpulse_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`[PeerJS Network] Initializing WebSockets connection to 0.peerjs.com with ID: ${customId}`);

      const peer = new Peer(customId, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        debug: 1,
      });

      peer.on('open', (id) => {
        console.log(`[PeerJS Network Success] Registered on 0.peerjs.com! My Peer ID: ${id}`);
        this.myPeerId = id;
        this.peer = peer;
        resolve(id);
      });

      peer.on('error', (err) => {
        console.error('[PeerJS Network Error]:', err);
        reject(err);
      });

      // Handle incoming video calls
      peer.on('call', (call) => {
        console.log(`[PeerJS Network] Incoming video call from stranger: ${call.peer}`);
        this.currentCall = call;

        if (this.onMatchFound) {
          this.onMatchFound(call.peer);
        }
      });

      // Handle incoming text data connections
      peer.on('connection', (conn) => {
        console.log(`[PeerJS Network] Incoming text channel from stranger: ${conn.peer}`);
        this.currentConn = conn;
        this.setupDataConnection(conn);
      });
    });
  }

  public async answerCall(localStream: MediaStream | null) {
    if (!this.currentCall) return;

    if (localStream) {
      this.currentCall.answer(localStream);
    } else {
      this.currentCall.answer();
    }

    this.currentCall.on('stream', (remoteStream) => {
      console.log('[PeerJS Network] Received remote media stream!');
      if (this.onRemoteStream) {
        this.onRemoteStream(remoteStream);
      }
    });

    this.currentCall.on('close', () => {
      console.log('[PeerJS Network] Stranger closed video stream');
      if (this.onDisconnected) {
        this.onDisconnected();
      }
    });
  }

  public async callPeer(remotePeerId: string, localStream: MediaStream | null) {
    if (!this.peer) return;

    console.log(`[PeerJS Network] Calling stranger ${remotePeerId}...`);
    const call = localStream ? this.peer.call(remotePeerId, localStream) : (this.peer as any).call(remotePeerId);
    this.currentCall = call;

    if (call) {
      call.on('stream', (remoteStream: MediaStream) => {
        console.log('[PeerJS Network] Connected to remote stranger media stream!');
        if (this.onRemoteStream) {
          this.onRemoteStream(remoteStream);
        }
      });

      call.on('close', () => {
        console.log('[PeerJS Network] Call ended');
        if (this.onDisconnected) {
          this.onDisconnected();
        }
      });
    }

    // Also establish DataChannel for text
    const conn = this.peer.connect(remotePeerId);
    this.currentConn = conn;
    this.setupDataConnection(conn);
  }

  private setupDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log('[PeerJS Network] WebRTC DataChannel open for text chat!');
    });

    conn.on('data', (data: any) => {
      console.log('[PeerJS Network] Received text message:', data);
      if (typeof data === 'string' && this.onMessage) {
        this.onMessage(data);
      }
    });

    conn.on('close', () => {
      console.log('[PeerJS Network] DataChannel closed');
      if (this.onDisconnected) {
        this.onDisconnected();
      }
    });
  }

  public sendMessage(text: string) {
    if (this.currentConn && this.currentConn.open) {
      this.currentConn.send(text);
    }
  }

  public disconnect() {
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }
    if (this.currentConn) {
      this.currentConn.close();
      this.currentConn = null;
    }
  }

  public destroy() {
    this.disconnect();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const peerjsService = new PeerJSService();
