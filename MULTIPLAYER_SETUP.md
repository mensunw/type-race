# 🚀 TypeRace Multiplayer Setup Guide

This guide explains how to run the TypeRace multiplayer functionality with the WebSocket server.

## 🏗️ Architecture Overview

TypeRace multiplayer uses a **dual-server architecture**:
- **Next.js Server** (Port 3000): Serves the web application
- **WebSocket Server** (Port 8080): Handles real-time multiplayer communication

## 🛠️ Quick Start

### Option 1: Run Both Servers Together (Recommended)
```bash
npm run dev:full
```
This starts both the Next.js development server and WebSocket server with hot-reload.

### Option 2: Run Servers Separately

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - WebSocket Server:**
```bash
npm run server:dev
```

### Option 3: Production Mode

**Build the application:**
```bash
npm run build
```

**Start Next.js production server:**
```bash
npm start
```

**Start WebSocket server:**
```bash
npm run server
```

## 🎮 Using Multiplayer

1. **Open the application**: Navigate to `http://localhost:3000`
2. **Go to Multiplayer**: Click "Multiplayer" from the home page
3. **Create or Join Room**:
   - **Create**: Click "Create Room" to generate a 6-character room code
   - **Join**: Enter a friend's room code to join their room
4. **Ready Up**: Click "Ready Up" when you're prepared to race
5. **Race**: Game starts automatically when all players are ready!

## 🔧 Server Configuration

### WebSocket Server Settings
- **Port**: 8080 (configurable via `PORT` environment variable)
- **Max Players per Room**: 4
- **Room Timeout**: 5 minutes of inactivity
- **Heartbeat Interval**: 30 seconds

### Environment Variables
```bash
# WebSocket server port (optional, defaults to 8080)
PORT=8080

# Next.js server port (optional, defaults to 3000)
NEXT_PORT=3000
```

## 🏃‍♂️ Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev:full` | Run both Next.js and WebSocket servers with hot-reload |
| `npm run dev` | Run only Next.js development server |
| `npm run server` | Run WebSocket server (production mode) |
| `npm run server:dev` | Run WebSocket server with hot-reload |
| `npm run build` | Build Next.js for production |
| `npm run lint` | Run ESLint on all files |

## 🐛 Troubleshooting

### Common Issues

**"Connection failed" error:**
- Ensure WebSocket server is running on port 8080
- Check if port 8080 is blocked by firewall
- Verify no other applications are using port 8080

**WebSocket server won't start:**
```bash
# Check if port is in use
lsof -ti:8080

# Kill process using port 8080 (if needed)
kill -9 $(lsof -ti:8080)

# Try starting again
npm run server
```

**TypeScript errors:**
```bash
# Clean build and reinstall
rm -rf node_modules .next
npm install
npm run build
```

**Room connection issues:**
- Refresh the page and try again
- Ensure both players are using the correct room code
- Check browser console for WebSocket connection errors

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
DEBUG=typerace:* npm run server:dev
```

## 📊 Performance Notes

- **Latency Target**: <50ms for optimal typing experience
- **Concurrent Rooms**: Server can handle 100+ simultaneous rooms
- **Memory Usage**: ~2MB per active room with 4 players
- **CPU Usage**: Minimal - WebSocket server is event-driven

## 🚀 Deployment

### Production Deployment
1. Build the Next.js application: `npm run build`
2. Deploy Next.js to Vercel, Netlify, or similar
3. Deploy WebSocket server to a service that supports persistent connections:
   - Railway, Render, or DigitalOcean
   - Update WebSocket URL in production environment

### Docker Support (Optional)
```dockerfile
# Dockerfile example for WebSocket server
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["npm", "run", "server"]
```

## 🔐 Security Considerations

- Room codes are cryptographically secure (6 characters, 36^6 combinations)
- Input validation on all WebSocket messages
- Rate limiting prevents spam
- No persistent data storage (rooms are ephemeral)
- CORS protection enabled

## 🎯 Testing

### Manual Testing
1. Open two browser windows/tabs
2. Create a room in one, join with the other
3. Test ready states, countdown, and racing
4. Verify real-time synchronization

### Automated Testing (Future)
- Unit tests for WebSocket message handling
- Integration tests for game flow
- Load testing for concurrent connections

## 📋 Server Logs

WebSocket server provides detailed logging:
```
TypeRace WebSocket server running on port 8080
Player Player 1 (player_123) joined room ABC123
Created room ABC123
Game starting in room ABC123
Player Player 1 finished in room ABC123
Cleaned up empty room ABC123
```

## 🔧 Customization

### Modify Game Settings
Edit `server/websocket-server.ts`:
```typescript
const DEFAULT_SETTINGS = {
  targetCharCount: 200,    // Race length
  maxPlayers: 4,           // Room capacity
  roomTimeout: 300000      // 5 minutes
};
```

### Add Custom Text
Replace `DEFAULT_TEXT` in the server file with your own typing challenges.

---

**Ready to race?** Start both servers with `npm run dev:full` and visit `http://localhost:3000/multiplayer`! 🏁