/**
 * VIGIL-AI WebSocket Service
 * Manages real-time connections for live attendance feed.
 */

const WS_BASE = 'ws://localhost:8000';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = [];
    this.reconnectTimer = null;
    this.sessionId = 'global';
  }

  connect(sessionId = 'global') {
    this.sessionId = sessionId;
    const url = `${WS_BASE}/ws/${sessionId}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log(`[WS] Connected to session: ${sessionId}`);
        this.clearReconnect();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          data.timestamp = new Date().toISOString();
          this.listeners.forEach((cb) => cb(data));
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting in 3s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    } catch (e) {
      console.error('[WS] Connection failed:', e);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.clearReconnect();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  scheduleReconnect() {
    this.clearReconnect();
    this.reconnectTimer = setTimeout(() => this.connect(this.sessionId), 3000);
  }

  clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }
}

const wsService = new WebSocketService();
export default wsService;
