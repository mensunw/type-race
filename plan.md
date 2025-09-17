# TypeRace Multiplayer Implementation Plan

## Overview
Production-ready real-time multiplayer using native WebSockets with custom protocol optimized for typing games. Architecture focuses on <50ms latency, authoritative server state, and graceful degradation for disconnections.

## WebSocket Infrastructure Decision

**Selected Architecture**: Native WebSocket + Custom Node.js Server
- **Rationale**: Typing games require <50ms latency; native WebSockets provide optimal performance
- **Deployment**: Separate WebSocket server (can run alongside Next.js or independently)
- **Protocol**: Custom binary/JSON hybrid optimized for typing progress events
- **State Management**: Authoritative server with client-side prediction

### Message Protocol Design
```typescript
type GameMessage =
  | { type: 'typing_progress', playerId: string, correctChars: number, currentWord: number, timestamp: number }
  | { type: 'game_start', timestamp: number, textId: string, targetChars: number }
  | { type: 'player_finished', playerId: string, finalStats: Stats, timestamp: number }
  | { type: 'countdown_sync', phase: number, serverTime: number }
  | { type: 'player_join', playerId: string, name: string }
  | { type: 'player_disconnect', playerId: string }
```

### Connection Management Strategy
- **Heartbeat Protocol**: Bi-directional pings every 5 seconds to detect disconnections
- **Reconnection Logic**: Exponential backoff (1s, 2s, 4s, 8s max) with game state restoration
- **Game Persistence**: Rooms persist for 30 seconds after last player disconnection
- **Conflict Resolution**: Server timestamp authority for simultaneous events

## Files to Create/Modify

### New Files
- `lib/websocket.ts` - WebSocket client with auto-reconnection and message queuing
- `types/multiplayer.ts` - Multiplayer type definitions and message protocol
- `app/components/MultiplayerLobby.tsx` - Room creation/joining with player list
- `app/components/MultiplayerTrack.tsx` - Multi-player racing track with collision detection
- `server/websocket-server.ts` - Standalone WebSocket server with room management
- `hooks/useMultiplayer.ts` - Multiplayer game state with optimistic updates
- `lib/game-sync.ts` - Client-side prediction and server reconciliation

### Modified Files
- `app/multiplayer/page.tsx` - Replace placeholder with full multiplayer game implementation
- `app/components/Track.tsx` - Extract reusable components for multiplayer variant
- `package.json` - Add WebSocket dependencies (ws, uuid)

## Core Functions

### WebSocket Service (`lib/websocket.ts`)
- `createConnection(roomId: string, playerId: string)` - Establishes WebSocket connection with automatic reconnection and message queuing
- `sendMessage(message: GameMessage)` - Sends typed message with client-side validation and retry logic
- `subscribeToGameEvents(callback: (message: GameMessage) => void)` - Type-safe event subscription with automatic cleanup
- `handleReconnection(previousState: GameState)` - Restores game state after connection drops with server reconciliation

### Game Synchronization (`lib/game-sync.ts`)
- `predictiveUpdate(localInput: string, serverState: GameState)` - Client-side prediction to reduce perceived latency
- `reconcileWithServer(predicted: GameState, authoritative: GameState)` - Merge client predictions with server truth
- `detectNetworkLag()` - Measure round-trip time and adjust UI feedback accordingly

### Multiplayer Hook (`hooks/useMultiplayer.ts`)
- `useMultiplayer(roomId: string, playerId: string)` - Central multiplayer state management with connection lifecycle
- `handlePlayerTyping(input: string, wordIndex: number)` - Process typing with optimistic updates and server broadcast
- `syncCountdown(serverTimestamp: number)` - Synchronize countdown with server time compensation for network delay
- `managePlayerStates(players: Player[])` - Track all player progress and connection status

### Room Management (`app/components/MultiplayerLobby.tsx`)
- `createRoom(settings: GameSettings)` - Generate unique room with configurable race parameters
- `joinRoom(roomCode: string, playerName: string)` - Validate and connect to existing room with duplicate name handling
- `handlePlayerReady(playerId: string, isReady: boolean)` - Manage ready states and auto-start when all ready
- `copyRoomLink()` - Generate shareable room URL for easy invitation

### Multiplayer Track (`app/components/MultiplayerTrack.tsx`)
- `renderPlayerCars(players: Player[], trackWidth: number)` - Display multiple player positions with collision avoidance
- `updatePlayerProgress(playerId: string, progress: number, smooth: boolean)` - Smooth position updates with interpolation
- `showPlayerNames(players: Player[])` - Display player names and current WPM near their cars
- `handleFinishLineEffects(winner: Player)` - Celebration animations when first player finishes

### WebSocket Server (`server/websocket-server.ts`)
- `handleConnection(socket: WebSocket, request: IncomingMessage)` - Accept connections and assign to rooms
- `broadcastToRoom(roomId: string, message: GameMessage, excludePlayerId?: string)` - Efficient room-wide message broadcasting
- `manageRoomLifecycle(roomId: string)` - Handle room creation, player limits, and cleanup
- `validateGameMessage(message: any)` - Type validation and sanitization of all incoming messages
- `handlePlayerDisconnect(playerId: string, roomId: string)` - Graceful disconnection with potential game pause/resume

## Test Coverage

### WebSocket Infrastructure Tests
- `connection-establishes-with-auto-reconnection` - Connection resilience under network issues
- `message-queuing-during-disconnection` - Messages queued and sent on reconnect
- `heartbeat-detects-dead-connections` - Connection health monitoring works
- `exponential-backoff-reconnection-strategy` - Proper retry timing implementation
- `message-validation-rejects-malformed-data` - Server-side input validation

### Real-time Synchronization Tests
- `client-prediction-reduces-perceived-latency` - Optimistic updates feel responsive
- `server-reconciliation-corrects-prediction-errors` - Authority resolution works
- `typing-progress-syncs-under-50ms-latency` - Performance requirement met
- `countdown-synchronizes-across-network-delays` - Timing coordination works
- `game-state-consistency-maintained` - All clients see same authoritative state

### Room Management Tests
- `room-creation-generates-cryptographically-secure-id` - Secure room IDs
- `player-limit-enforcement-prevents-overcrowding` - Max players respected
- `duplicate-name-handling-in-same-room` - Name collision resolution
- `room-cleanup-after-all-players-disconnect` - Memory leak prevention
- `ready-state-changes-trigger-game-start` - Ready system works

### Game Flow Tests
- `multiplayer-game-starts-only-when-all-ready` - Start synchronization
- `winner-determination-accounts-for-network-lag` - Fair win detection
- `mid-game-disconnection-pauses-appropriately` - Graceful handling
- `reconnection-restores-game-state-accurately` - State restoration
- `final-results-consistent-across-all-clients` - Results synchronization

### Performance & Load Tests
- `handles-concurrent-typing-from-multiple-players` - Concurrent input processing
- `server-performance-under-high-message-frequency` - Load handling
- `memory-usage-stable-during-long-games` - Memory leak detection
- `websocket-server-handles-connection-spikes` - Connection scaling

## Production Deployment Strategy

### Infrastructure Requirements
- **WebSocket Server**: Separate Node.js process (can be containerized)
- **Load Balancing**: Sticky sessions for WebSocket connections
- **Monitoring**: Connection count, message throughput, average latency metrics
- **Scaling**: Horizontal scaling with Redis pub/sub for cross-server room management

### Security Considerations
- **Rate Limiting**: Per-connection message rate limits to prevent spam
- **Input Validation**: Strict message format validation and sanitization
- **Room Code Security**: Cryptographically secure random room IDs
- **Connection Limits**: Per-IP connection limits to prevent DoS

### Development vs Production
- **Development**: Single WebSocket server on localhost:8080
- **Production**: WebSocket server cluster with Redis backing store
- **Deployment**: Docker containers with health checks and auto-restart

**Final Scope**: 7 new files, 3 modified files for production-ready multiplayer with comprehensive error handling and performance optimization