import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';

import {
  Room,
  Player,
  GameMessage,
  GameSettings,
  isGameMessage,
  createPlayer,
  serializePlayer
} from '../types/multiplayer';

interface PlayerConnection {
  socket: WebSocket;
  player: Player;
  roomId: string;
  lastHeartbeat: number;
  isAlive: boolean;
}

export class TypeRaceWebSocketServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();
  private connections: Map<WebSocket, PlayerConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout;
  private cleanupInterval: NodeJS.Timeout;

  private readonly DEFAULT_TEXT = "The quick brown fox jumps over the lazy dog. This pangram contains all letters of the alphabet and is commonly used for typing practice. Speed and accuracy are both important when learning to type efficiently. In the digital age, typing has become an essential skill for students, professionals, and everyday computer users. The ability to type quickly and accurately can significantly improve productivity and communication. Many people spend hours each day using keyboards, whether for work, education, or personal activities. Touch typing, which involves typing without looking at the keyboard, is considered the most efficient method. It allows typists to focus on the content they are creating rather than searching for individual keys. Learning proper finger placement and muscle memory takes practice and dedication. The home row keys serve as the foundation for touch typing technique. Each finger has designated keys to press, and with consistent practice, the movements become automatic. Regular typing exercises help develop speed while maintaining accuracy. It is better to type slowly and correctly than to type quickly with many errors. Proofreading and editing skills are equally important as typing speed. Many typing programs and games are available to help people improve their skills. These tools often include lessons, tests, and challenges that make learning more engaging and fun. Some focus on specific areas like number typing, special characters, or programming symbols. Setting realistic goals and tracking progress can help maintain motivation during the learning process. Professional typists and data entry specialists can achieve typing speeds of over one hundred words per minute. However, for most people, a typing speed of thirty to fifty words per minute is sufficient for daily tasks. The key is finding the right balance between speed and accuracy for your specific needs and requirements.";

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', this.handleConnection.bind(this));

    // Start heartbeat checking every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, 30000);

    // Cleanup empty rooms every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupEmptyRooms();
    }, 60000);

    console.log(`TypeRace WebSocket server running on port ${port}`);
  }

  private handleConnection(socket: WebSocket, request: IncomingMessage): void {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const roomId = url.searchParams.get('roomId');
    const playerId = url.searchParams.get('playerId');

    if (!roomId || !playerId) {
      this.sendError(socket, 'Missing roomId or playerId parameters', 'VALIDATION_ERROR');
      socket.close(1008, 'Invalid parameters');
      return;
    }

    // Create or join room
    let room = this.rooms.get(roomId);
    if (!room) {
      // Create new room
      room = this.createRoom(roomId, {
        targetCharCount: 200,
        maxPlayers: 4,
        isPrivate: false
      });
    }

    // Check room capacity
    if (room.players.size >= room.settings.maxPlayers) {
      this.sendError(socket, 'Room is full', 'ROOM_FULL');
      socket.close(1013, 'Room full');
      return;
    }

    // Check if game is already started
    if (room.gameState === 'active' || room.gameState === 'finished') {
      this.sendError(socket, 'Game already in progress', 'GAME_ALREADY_STARTED');
      socket.close(1013, 'Game in progress');
      return;
    }

    // Create player
    const playerName = `Player ${room.players.size + 1}`;
    const player = createPlayer(playerId, playerName);

    // Add player to room
    room.players.set(playerId, player);

    // Create connection record
    const connection: PlayerConnection = {
      socket,
      player,
      roomId,
      lastHeartbeat: Date.now(),
      isAlive: true
    };

    this.connections.set(socket, connection);

    // Set up socket handlers
    socket.on('message', (data) => {
      this.handleMessage(socket, data.toString());
    });

    socket.on('close', () => {
      this.handleDisconnection(socket);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(socket);
    });

    socket.on('pong', () => {
      const conn = this.connections.get(socket);
      if (conn) {
        conn.isAlive = true;
        conn.lastHeartbeat = Date.now();
      }
    });

    // Notify other players
    this.broadcastToRoom(roomId, {
      type: 'player_join',
      playerId,
      playerName: player.name,
      timestamp: Date.now()
    }, playerId);

    // Send current room state to new player
    this.sendGameState(socket, room);

    console.log(`Player ${player.name} (${playerId}) joined room ${roomId}`);
  }

  private handleMessage(socket: WebSocket, data: string): void {
    const connection = this.connections.get(socket);
    if (!connection) return;

    let message: GameMessage;

    try {
      message = JSON.parse(data);
    } catch {
      this.sendError(socket, 'Invalid JSON', 'INVALID_MESSAGE');
      return;
    }

    if (!isGameMessage(message)) {
      this.sendError(socket, 'Invalid message format', 'INVALID_MESSAGE');
      return;
    }

    const room = this.rooms.get(connection.roomId);
    if (!room) {
      this.sendError(socket, 'Room not found', 'ROOM_NOT_FOUND');
      return;
    }

    // Route message to appropriate handler
    switch (message.type) {
      case 'heartbeat':
        this.handleHeartbeat(socket);
        break;
      case 'player_ready':
        this.handlePlayerReady(room, connection.player.id, message.isReady);
        break;
      case 'typing_progress':
        this.handleTypingProgress(room, message);
        break;
      case 'player_finished':
        this.handlePlayerFinished(room, message);
        break;
      default:
        console.warn('Unhandled message type:', message.type);
    }
  }

  private handlePlayerReady(room: Room, playerId: string, isReady: boolean): void {
    const player = room.players.get(playerId);
    if (!player) return;

    player.isReady = isReady;

    // Broadcast ready state change
    this.broadcastToRoom(room.id, {
      type: 'player_ready',
      playerId,
      isReady,
      timestamp: Date.now()
    });

    // Check if all players are ready
    const allPlayers = Array.from(room.players.values());
    if (allPlayers.length >= 2 && allPlayers.every(p => p.isReady)) {
      this.startGame(room);
    }
  }

  private handleTypingProgress(room: Room, message: GameMessage & { type: 'typing_progress' }): void {
    const player = room.players.get(message.playerId);
    if (!player || room.gameState !== 'active') return;

    // Update player state
    player.correctChars = message.correctChars;
    player.currentWordIndex = message.currentWordIndex;
    player.completedWords = message.completedWords;
    player.currentWordInput = message.currentWordInput;
    player.wpm = message.wpm;
    player.accuracy = message.accuracy;


    // Check if player finished
    if (player.correctChars >= room.targetCharCount && !player.isFinished) {
      player.isFinished = true;
      player.finishTime = Date.now() - (room.startedAt || Date.now());

      // Broadcast finish
      this.broadcastToRoom(room.id, {
        type: 'player_finished',
        playerId: player.id,
        finalStats: {
          correctChars: player.correctChars,
          wpm: player.wpm,
          accuracy: player.accuracy,
          finishTime: player.finishTime
        },
        timestamp: Date.now()
      });

      // Check if game should end
      this.checkGameCompletion(room);
    } else {
      // Broadcast progress to other players
      this.broadcastToRoom(room.id, message, message.playerId);
    }
  }

  private handlePlayerFinished(room: Room, message: GameMessage & { type: 'player_finished' }): void {
    const player = room.players.get(message.playerId);
    if (!player) return;

    player.isFinished = true;
    player.finishTime = message.finalStats.finishTime;

    // Broadcast to other players
    this.broadcastToRoom(room.id, message, message.playerId);

    this.checkGameCompletion(room);
  }

  private handleHeartbeat(socket: WebSocket): void {
    const connection = this.connections.get(socket);
    if (connection) {
      connection.lastHeartbeat = Date.now();
      connection.isAlive = true;

      // Send heartbeat response
      socket.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: Date.now()
      }));
    }
  }

  private handleDisconnection(socket: WebSocket): void {
    const connection = this.connections.get(socket);
    if (!connection) return;

    const room = this.rooms.get(connection.roomId);
    if (room) {
      // Mark player as disconnected
      const player = room.players.get(connection.player.id);
      if (player) {
        player.isConnected = false;

        // Notify other players
        this.broadcastToRoom(room.id, {
          type: 'player_leave',
          playerId: player.id,
          timestamp: Date.now()
        }, player.id);

        // If game is active and key player disconnects, pause the game
        if (room.gameState === 'active') {
          const activePlayers = Array.from(room.players.values()).filter(p => p.isConnected);
          if (activePlayers.length < 2) {
            room.gameState = 'paused';
            this.broadcastGameState(room);
          }
        }
      }

      // Remove player if room is in waiting state
      if (room.gameState === 'waiting') {
        room.players.delete(connection.player.id);
      }
    }

    this.connections.delete(socket);

    console.log(`Player ${connection.player.name} disconnected from room ${connection.roomId}`);
  }

  private startGame(room: Room): void {
    room.gameState = 'countdown';
    room.textContent = this.DEFAULT_TEXT;
    room.startedAt = Date.now();

    // Start countdown sequence
    this.startCountdown(room);
  }

  private startCountdown(room: Room): void {
    let phase = 3;

    const countdownInterval = setInterval(() => {
      this.broadcastToRoom(room.id, {
        type: 'countdown_sync',
        phase,
        serverTime: Date.now(),
        timestamp: Date.now()
      });

      phase--;

      if (phase < 0) {
        clearInterval(countdownInterval);
        room.gameState = 'active';

        // Send game start message
        this.broadcastToRoom(room.id, {
          type: 'game_start',
          textContent: room.textContent,
          targetCharCount: room.targetCharCount,
          timestamp: Date.now()
        });

        this.broadcastGameState(room);
      }
    }, 1000);
  }

  private checkGameCompletion(room: Room): void {
    const players = Array.from(room.players.values());
    const finishedPlayers = players.filter(p => p.isFinished);

    // End game when first player finishes (race mode)
    if (finishedPlayers.length > 0) {
      room.gameState = 'finished';
      room.finishedAt = Date.now();
      this.broadcastGameState(room);
    }
  }

  private checkHeartbeats(): void {
    const now = Date.now();
    const timeout = 60000; // 60 seconds timeout

    this.connections.forEach((connection, socket) => {
      if (now - connection.lastHeartbeat > timeout) {
        console.log(`Heartbeat timeout for player ${connection.player.id}`);
        socket.terminate();
        this.handleDisconnection(socket);
      } else if (!connection.isAlive) {
        socket.terminate();
        this.handleDisconnection(socket);
      } else {
        connection.isAlive = false;
        socket.ping();
      }
    });
  }

  private cleanupEmptyRooms(): void {
    const now = Date.now();
    const roomTimeout = 300000; // 5 minutes

    this.rooms.forEach((room, roomId) => {
      const hasConnectedPlayers = Array.from(room.players.values()).some(p => p.isConnected);

      if (!hasConnectedPlayers && (now - room.createdAt) > roomTimeout) {
        this.rooms.delete(roomId);
        console.log(`Cleaned up empty room ${roomId}`);
      }
    });
  }

  private createRoom(roomId: string, settings: GameSettings): Room {
    const room: Room = {
      id: roomId,
      players: new Map(),
      gameState: 'waiting',
      settings,
      textContent: '',
      targetCharCount: settings.targetCharCount,
      createdAt: Date.now()
    };

    this.rooms.set(roomId, room);
    console.log(`Created room ${roomId}`);
    return room;
  }

  private broadcastToRoom(roomId: string, message: GameMessage, excludePlayerId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageString = JSON.stringify(message);

    this.connections.forEach((connection) => {
      if (connection.roomId === roomId &&
          connection.player.id !== excludePlayerId &&
          connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(messageString);
      }
    });
  }

  private broadcastGameState(room: Room): void {
    const players = Array.from(room.players.values()).map(serializePlayer);

    this.broadcastToRoom(room.id, {
      type: 'game_state_sync',
      gameState: room.gameState,
      players,
      timestamp: Date.now()
    });
  }

  private sendGameState(socket: WebSocket, room: Room): void {
    const players = Array.from(room.players.values()).map(serializePlayer);

    socket.send(JSON.stringify({
      type: 'game_state_sync',
      gameState: room.gameState,
      players,
      timestamp: Date.now()
    }));
  }

  private sendError(socket: WebSocket, message: string, code: string): void {
    socket.send(JSON.stringify({
      type: 'error',
      message,
      code,
      timestamp: Date.now()
    }));
  }

  public shutdown(): void {
    clearInterval(this.heartbeatInterval);
    clearInterval(this.cleanupInterval);
    this.wss.close();
    console.log('WebSocket server shut down');
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  new TypeRaceWebSocketServer(port);
}