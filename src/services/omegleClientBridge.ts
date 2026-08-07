// Client-side Omegle Protocol WebRTC Bridge (Runs in real user browser to pass Cloudflare)
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

    const servers = ['https://front1.omegle.com', 'https://front2.omegle.com', 'https://front3.omegle.com'];
    const randid = Math.random().toString(36).substring(2, 10).toUpperCase();

    for (const server of servers) {
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

        if (!res.ok) continue;

        const data = await res.json();
        if (data && data.clientID) {
          this.serverUrl = server;
          this.activeSessionId = data.clientID;
          this.isPolling = true;

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
        }
      } catch (err) {
        console.warn('Omegle server connection attempt failed, trying next node:', err);
      }
    }
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

        if (!res.ok) break;

        const events = await res.json();
        if (events === null || !Array.isArray(events)) {
          this.disconnect();
          break;
        }

        this.handleEvents(events);
      } catch (err) {
        break;
      }
    }
  }

  private handleEvents(events: any[]) {
    for (const ev of events) {
      if (!Array.isArray(ev)) continue;
      const type = ev[0];

      if (type === 'gotMessage' && this.onMessage) {
        this.onMessage(ev[1]);
      } else if (type === 'typing' && this.onTyping) {
        this.onTyping(true);
      } else if (type === 'stoppedTyping' && this.onTyping) {
        this.onTyping(false);
      } else if (type === 'strangerDisconnected' && this.onDisconnected) {
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
    } catch (err) {}
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
    } catch (err) {}
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
    } catch (err) {}
  }

  public async disconnect(): Promise<void> {
    if (!this.activeSessionId) return;
    const cid = this.activeSessionId;
    const server = this.serverUrl;
    this.isPolling = false;
    this.activeSessionId = null;

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
