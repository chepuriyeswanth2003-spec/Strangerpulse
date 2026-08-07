// Client-side Omegle Protocol WebRTC Bridge (With Diagnostic Console Logging)
export class OmegleClientBridge {
  private activeSessionId: string | null = null;
  private isPolling: boolean = false;
  private serverUrl: string = 'https://front1.omegle.com';

  public onMatchFound: ((strangerInfo: any) => void) | null = null;
  public onMessage: ((text: string) => void) | null = null;
  public onTyping: ((isTyping: boolean) => void) | null = null;
  public onDisconnected: (() => void) | null = null;
  public onOffer: ((offer: any) => void) | null = null;
  public onIceCandidate: ((candidate: any) => void) | null = null;

  public async connectToOmegleNetwork(mode: 'text' | 'video' = 'video'): Promise<boolean> {
    this.disconnect();

    console.log(`[Omegle Bridge Diagnostic] Starting browser bridge connection to external network (Mode: ${mode})...`);

    const servers = [
      'https://front1.omegle.com',
      'https://front2.omegle.com',
      'https://front3.omegle.com',
      'https://omegle.online',
    ];
    const randid = Math.random().toString(36).substring(2, 10).toUpperCase();

    for (const server of servers) {
      console.log(`[Omegle Bridge Diagnostic] Attempting handshake with node: ${server}/start`);
      try {
        const params = new URLSearchParams({
          caps: 'recaptcha2,statuslog',
          rcs: '1',
          spb: '0',
          firstevents: '1',
          randid,
        });

        if (mode === 'video') {
          params.append('topics', JSON.stringify(['video']));
        }

        const res = await fetch(`${server}/start?${params.toString()}`, {
          method: 'POST',
          mode: 'cors',
        });

        console.log(`[Omegle Bridge Diagnostic] Node ${server} HTTP Response Status: ${res.status} ${res.statusText}`);

        if (!res.ok) {
          console.error(`[Omegle Bridge Error] Node ${server} rejected request with HTTP ${res.status}. Check browser CORS / Cloudflare headers.`);
          continue;
        }

        const data = await res.json();
        console.log(`[Omegle Bridge Diagnostic] Received payload from ${server}:`, data);

        if (data && data.clientID) {
          this.serverUrl = server;
          this.activeSessionId = data.clientID;
          this.isPolling = true;
          console.log(`[Omegle Bridge Success] Connected to Omegle network! Session ID: ${data.clientID}`);

          if (this.onMatchFound) {
            this.onMatchFound({
              nickname: 'Stranger',
              country: 'Global Network',
              mode,
            });
          }

          if (data.events) {
            this.handleEvents(data.events);
          }

          this.startPollingLoop();
          return true;
        } else {
          console.warn(`[Omegle Bridge Warning] Node ${server} returned response without clientID:`, data);
        }
      } catch (err: any) {
        console.error(`[Omegle Bridge Diagnostic Error] Handshake with ${server} failed:`, err?.message || err);
      }
    }

    console.error('[Omegle Bridge Error] All Omegle network nodes failed to connect. Direct browser CORS / Anti-bot policies blocked cross-origin requests.');
    return false;
  }

  private async startPollingLoop() {
    while (this.isPolling && this.activeSessionId) {
      try {
        const body = new URLSearchParams({ id: this.activeSessionId });
        const res = await fetch(`${this.serverUrl}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });

        if (!res.ok) {
          console.error(`[Omegle Bridge Error] Event polling HTTP error ${res.status}`);
          break;
        }

        const events = await res.json();
        if (events === null || !Array.isArray(events)) {
          console.log('[Omegle Bridge Diagnostic] Null/Invalid event stream, disconnecting session...');
          this.disconnect();
          break;
        }

        this.handleEvents(events);
      } catch (err: any) {
        console.error('[Omegle Bridge Diagnostic Error] Event poll exception:', err?.message || err);
        break;
      }
    }
  }

  private handleEvents(events: any[]) {
    for (const ev of events) {
      if (!Array.isArray(ev)) continue;
      const type = ev[0];
      console.log(`[Omegle Bridge Event Received] ${type}:`, ev);

      if (type === 'gotMessage' && this.onMessage) {
        this.onMessage(ev[1]);
      } else if (type === 'typing' && this.onTyping) {
        this.onTyping(true);
      } else if (type === 'stoppedTyping' && this.onTyping) {
        this.onTyping(false);
      } else if (type === 'strangerDisconnected' && this.onDisconnected) {
        console.log('[Omegle Bridge Event] Stranger disconnected');
        this.onDisconnected();
        this.disconnect();
      } else if (type === 'webrtc_offer' && this.onOffer) {
        this.onOffer(ev[1]);
      } else if (type === 'webrtc_ice_candidate' && this.onIceCandidate) {
        this.onIceCandidate(ev[1]);
      }
    }
  }

  public async sendMessage(text: string): Promise<void> {
    if (!this.activeSessionId) return;
    try {
      const body = new URLSearchParams({ id: this.activeSessionId, msg: text });
      await fetch(`${this.serverUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch (err: any) {
      console.error('[Omegle Bridge Error] Send message failed:', err?.message || err);
    }
  }

  public async sendAnswer(answer: any): Promise<void> {
    if (!this.activeSessionId) return;
    try {
      const body = new URLSearchParams({ id: this.activeSessionId, answer: JSON.stringify(answer) });
      await fetch(`${this.serverUrl}/webrtc_answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch (err: any) {
      console.error('[Omegle Bridge Error] Send WebRTC answer failed:', err?.message || err);
    }
  }

  public async sendIceCandidate(candidate: any): Promise<void> {
    if (!this.activeSessionId) return;
    try {
      const body = new URLSearchParams({ id: this.activeSessionId, candidate: JSON.stringify(candidate) });
      await fetch(`${this.serverUrl}/ice_candidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch (err: any) {
      console.error('[Omegle Bridge Error] Send ICE candidate failed:', err?.message || err);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.activeSessionId) return;
    const cid = this.activeSessionId;
    const server = this.serverUrl;
    this.isPolling = false;
    this.activeSessionId = null;

    console.log(`[Omegle Bridge Diagnostic] Disconnecting session ${cid}`);
    try {
      const body = new URLSearchParams({ id: cid });
      await fetch(`${server}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch (err) {}

    if (this.onDisconnected) {
      this.onDisconnected();
    }
  }
}

export const omegleClientBridge = new OmegleClientBridge();
