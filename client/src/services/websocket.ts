export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface PlayerInfo {
  playerId: number;
  playerName: string;
  sessionId: string;
  tableId: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isConnected = false;
  private playerInfo: PlayerInfo | null = null;

  constructor() {
    // Delay initial connection to ensure page is fully loaded
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  private connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:5000`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to:', wsUrl);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Rejoin session if we have player info
        if (this.playerInfo) {
          this.joinSession(this.playerInfo);
        }
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.error('Trying to connect to:', wsUrl);
      };
      
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(data: WebSocketMessage) {
    const handler = this.messageHandlers.get(data.type);
    if (handler) {
      handler(data);
    } else {
      console.log('Unhandled WebSocket message:', data);
    }
  }

  public onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  public offMessage(type: string) {
    this.messageHandlers.delete(type);
  }

  public joinSession(playerInfo: PlayerInfo) {
    this.playerInfo = playerInfo;
    
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'join_session',
        sessionId: playerInfo.sessionId,
        tableId: playerInfo.tableId,
        playerId: playerInfo.playerId,
        playerName: playerInfo.playerName
      }));
    }
  }

  public sendPlayerAction(action: string, amount?: number) {
    if (this.isConnected && this.ws && this.playerInfo) {
      this.ws.send(JSON.stringify({
        type: 'player_action',
        sessionId: this.playerInfo.sessionId,
        tableId: this.playerInfo.tableId,
        playerId: this.playerInfo.playerId,
        action,
        amount
      }));
    }
  }

  public requestNewHand() {
    if (this.isConnected && this.ws && this.playerInfo) {
      this.ws.send(JSON.stringify({
        type: 'request_new_hand',
        sessionId: this.playerInfo.sessionId,
        tableId: this.playerInfo.tableId,
        playerId: this.playerInfo.playerId
      }));
    }
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  public getPlayerInfo(): PlayerInfo | null {
    return this.playerInfo;
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.playerInfo = null;
    this.messageHandlers.clear();
  }

  public forceReconnect() {
    console.log('🔄 Принудительное переподключение...');
    this.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 500);
  }
}

// Singleton instance
export const websocketService = new WebSocketService(); 