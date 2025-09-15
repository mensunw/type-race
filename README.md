# 🏎️ TypeRace

A fun and engaging typing race game built with Next.js, TypeScript, and TailwindCSS. Race against a bot opponent to improve your typing speed and accuracy!

## Features

- **Single Player Mode**: Race against a configurable bot opponent
- **Real-time Stats**: Track your WPM, accuracy, and time elapsed
- **Visual Progress**: Watch your car advance along the track as you type
- **Responsive Design**: Works great on desktop and mobile devices
- **Multiplayer (Coming Soon)**: Real-time races against other players

## Getting Started

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd type-race
   npm install
   ```

2. **Run the Development Server**
   ```bash
   npm run dev
   ```

3. **Open Your Browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to start racing!

## Game Modes

### Single Player (vs Bot)
- Race against a bot that types at a consistent speed
- Default bot speed: 45 WPM
- Win by completing the text before the bot reaches the finish line

### Multiplayer (Coming Soon)
- Real-time races against other players
- Lobby system and custom rooms
- Global leaderboards

## Configuration

### Changing the Typing Text
Edit the `SAMPLE_TEXT` constant in `app/single/page.tsx`:

```typescript
const SAMPLE_TEXT = "Your custom text here...";
```

### Adjusting Bot Speed
Modify the `BOT_WPM` constant in `app/single/page.tsx`:

```typescript
const BOT_WPM = 45; // Change this value (words per minute)
```

## Project Structure

```
app/
├── components/
│   ├── Track.tsx          # Racing track visualization
│   ├── Stats.tsx          # WPM, accuracy, and time display
│   ├── TypingArea.tsx     # Text display and input area
│   └── EndGameModal.tsx   # Game completion modal
├── single/
│   └── page.tsx           # Single player game logic
├── multiplayer/
│   └── page.tsx           # Multiplayer placeholder
├── page.tsx               # Landing page
├── layout.tsx             # App layout
└── globals.css            # Global styles
```

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS 4** - Utility-first CSS framework
- **React Hooks** - State management and effects

## Game Mechanics

### Progress Calculation
- Progress = (correct characters / total characters) × 100
- Car position maps directly to progress percentage

### WPM Calculation
- WPM = (correct characters ÷ 5) ÷ (elapsed minutes)
- Uses gross WPM calculation for simplicity

### Accuracy Calculation
- Accuracy = (correct characters / total typed characters) × 100

## Development Roadmap

- [x] Single player racing game
- [x] Bot opponent with configurable speed
- [x] Real-time stats (WPM, accuracy, time)
- [x] Visual racing track
- [x] End game modal with results
- [ ] Multiple difficulty levels
- [ ] Custom text import
- [ ] Real-time multiplayer
- [ ] Global leaderboards
- [ ] User profiles and achievements

## Building for Production

```bash
npm run build
npm start
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
