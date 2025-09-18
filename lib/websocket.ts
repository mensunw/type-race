'use client';

import {
  GameMessage,
  WebSocketConfig,
  WebSocketEventHandlers,
  ConnectionState,
  isGameMessage
} from '@/types/multiplayer';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: WebSocketEventHandlers = {};
  private connectionState: ConnectionState;
  private messageQueue: GameMessage[] = [];
  private heartbeatInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private lastPingTime: number = 0;

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: 'ws://localhost:8080',
      reconnectInterval: 1000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      messageTimeout: 5000,
      ...config
    };

    this.connectionState = {
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      lastHeartbeat: Date.now(),
      roundTripTime: 0
    };
  }

  public connect(roomId: string, playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `${this.config.url}?roomId=${encodeURIComponent(roomId)}&playerId=${encodeURIComponent(playerId)}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.handleConnectionOpen();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          this.handleConnectionClose(event.code);
        };

        this.ws.onerror = (error) => {
          this.handleConnectionError();
          reject(error);
        };

        // Timeout for connection attempt
        setTimeout(() => {
          if (!this.connectionState.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, this.config.messageTimeout);

      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(): void {
    this.clearIntervals();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.connectionState = {
      ...this.connectionState,
      isConnected: false,
      isReconnecting: false
    };

    this.eventHandlers.onConnectionChange?.(false);
  }

  public sendMessage(message: GameMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!isGameMessage(message)) {
        reject(new Error('Invalid message format'));
        return;
      }

      if (!this.connectionState.isConnected) {
        // Queue message for when connection is restored
        this.messageQueue.push(message);
        resolve();
        return;
      }

      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.messageQueue.push(message);
        this.attemptReconnect();
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        this.ws.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        this.messageQueue.push(message);
        reject(error);
      }
    });
  }

  public on(handlers: WebSocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  public off(eventType?: keyof WebSocketEventHandlers): void {
    if (eventType) {
      delete this.eventHandlers[eventType];
    } else {
      this.eventHandlers = {};
    }
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  private handleConnectionOpen(): void {
    this.connectionState = {
      ...this.connectionState,
      isConnected: true,
      isReconnecting: false,
      reconnectAttempts: 0
    };

    this.eventHandlers.onConnectionChange?.(true);
    this.startHeartbeat();
    this.processMessageQueue();
  }

  private handleConnectionClose(code: number): void {
    this.clearIntervals();

    this.connectionState = {
      ...this.connectionState,
      isConnected: false
    };

    this.eventHandlers.onConnectionChange?.(false);

    // Don't reconnect on normal closure or if max attempts reached
    if (code === 1000 || this.connectionState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      return;
    }

    this.attemptReconnect();
  }

  private handleConnectionError(): void {
    this.eventHandlers.onError?.('Connection error', 'NETWORK_ERROR');
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (!isGameMessage(message)) {
        this.eventHandlers.onError?.('Invalid message format', 'INVALID_MESSAGE');
        return;
      }

      // Handle heartbeat response
      if (message.type === 'heartbeat') {
        this.connectionState.roundTripTime = Date.now() - this.lastPingTime;
        this.connectionState.lastHeartbeat = Date.now();
        return;
      }

      // Route message to appropriate handler
      switch (message.type) {
        case 'player_join':
          this.eventHandlers.onPlayerJoin?.({
            id: message.playerId,
            name: message.playerName,
            isReady: false,
            isConnected: true,
            correctChars: 0,
            currentWordIndex: 0,
            wpm: 0,
            accuracy: 100,
            isFinished: false
          });
          break;

        case 'player_leave':
          this.eventHandlers.onPlayerLeave?.(message.playerId);
          break;

        case 'player_ready':
          this.eventHandlers.onPlayerReady?.(message.playerId, message.isReady);
          break;

        case 'game_start':
          this.eventHandlers.onGameStart?.(message.textContent, message.targetCharCount);
          break;

        case 'countdown_sync':
          this.eventHandlers.onCountdownSync?.(message.phase, message.serverTime);
          break;

        case 'typing_progress':
          this.eventHandlers.onTypingProgress?.(message.playerId, {
            id: message.playerId,
            name: '', // Will be filled by the handler
            isReady: false,
            isConnected: true,
            correctChars: message.correctChars,
            currentWordIndex: message.currentWordIndex,
            wpm: message.wpm,
            accuracy: message.accuracy,
            isFinished: false
          });
          break;

        case 'player_finished':
          this.eventHandlers.onPlayerFinished?.(message.playerId, {
            playerId: message.playerId,
            playerName: '', // Will be filled by the handler
            wpm: message.finalStats.wpm,
            accuracy: message.finalStats.accuracy,
            correctChars: message.finalStats.correctChars,
            totalChars: message.finalStats.correctChars, // Approximation
            finishTime: message.finalStats.finishTime
          });
          break;

        case 'game_state_sync':
          this.eventHandlers.onGameStateSync?.(message.gameState, message.players);
          break;

        case 'error':
          this.eventHandlers.onError?.(message.message, message.code);
          break;

        default:
          console.warn('Unhandled message type:', message);
      }

    } catch {
      this.eventHandlers.onError?.('Failed to parse message', 'INVALID_MESSAGE');
    }
  }

  private attemptReconnect(): void {
    if (this.connectionState.isReconnecting ||
        this.connectionState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      return;
    }

    this.connectionState.isReconnecting = true;
    this.connectionState.reconnectAttempts++;

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.connectionState.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    this.reconnectTimeout = window.setTimeout(() => {
      if (!this.connectionState.isConnected) {
        // Extract room and player IDs from current URL or store them
        // For now, we'll need the caller to handle reconnection with proper parameters
        this.eventHandlers.onError?.('Reconnection failed', 'NETWORK_ERROR');
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();

    this.heartbeatInterval = window.setInterval(() => {
      this.ping();
    }, this.config.heartbeatInterval);

    // Start with immediate ping
    this.ping();
  }

  private ping(): void {
    if (!this.connectionState.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.lastPingTime = Date.now();
    const heartbeatMessage: GameMessage = {
      type: 'heartbeat',
      timestamp: this.lastPingTime
    };

    this.sendMessage(heartbeatMessage).catch(() => {
      // Heartbeat failed, connection might be dead
      this.handleConnectionClose(1006);
    });
  }

  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    const queuedMessages = [...this.messageQueue];
    this.messageQueue = [];

    queuedMessages.forEach(message => {
      this.sendMessage(message).catch(() => {
        console.warn('Failed to send queued message:', message.type);
        // Re-queue failed messages
        this.messageQueue.push(message);
      });
    });
  }

  private clearIntervals(): void {
    this.clearHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Factory function for creating WebSocket service instances
export const createWebSocketService = (config?: Partial<WebSocketConfig>): WebSocketService => {
  return new WebSocketService(config);
};

// Default configuration for development
export const defaultWebSocketConfig: WebSocketConfig = {
  url: process.env.NODE_ENV === 'production'
    ? 'wss://your-websocket-server.com'
    : 'ws://localhost:8080',
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  messageTimeout: 5000
};