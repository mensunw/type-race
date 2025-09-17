# TypeRace Project Handoff Documentation

## 📋 Project Overview

TypeRace is a web-based typing game built with **Next.js 15**, **TypeScript**, and **TailwindCSS**. Users can race against a bot opponent to improve their typing speed and accuracy in a gamified environment.

## 🏗️ Architecture & Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **State Management**: React Hooks (useState, useEffect, useCallback, useRef)
- **Build Tool**: Turbopack

## 📁 Project Structure

```
app/
├── components/
│   ├── Track.tsx           # Racing track with OptiBot avatar and flipped car
│   ├── Stats.tsx           # Real-time WPM, accuracy, and time display
│   ├── TypingArea.tsx      # Word-based typing with countdown overlay
│   ├── EndGameModal.tsx    # Game completion modal with results
│   ├── RaceSettings.tsx    # Settings modal with bot difficulty selection
│   └── Countdown.tsx       # 3-2-1-Go countdown with traffic lights
├── single/
│   └── page.tsx           # Single player game with bot difficulty system
├── multiplayer/
│   └── page.tsx           # Placeholder for future multiplayer
├── page.tsx               # Landing page with navigation
├── layout.tsx             # App layout and metadata
└── globals.css            # Global styles including scrollbar hiding
```

## 🎯 Key Features Implemented

### 1. **Word-Based Typing System**
- **Architecture**: Completely rebuilt from character-based to word-based typing
- **Extra Characters**: Users can type beyond expected word length (e.g., "lazyyy" for "lazy")
- **Spacebar Advancement**: Only spacebar moves to next word, preventing auto-advancement
- **Backspace Navigation**: Smart backspace that can return to previous words

### 2. **Visual Feedback System**
- **Color Coding**:
  - **Black**: Correctly typed characters
  - **Red**: Incorrectly typed or extra characters
  - **Gray**: Untyped characters or skipped words
  - **Blue Line**: Current cursor position (left border, not box)
- **Word Error Indicators**: Red underlines on completed words with errors
- **Dynamic Display**: Shows expected text + extra typed characters

### 3. **Configurable Racing System**
- **Target-Based Races**: Win by reaching a set number of correct characters (50-1000)
- **Flexible Length**: From 30-second sprints to 5-minute marathons
- **Settings Modal**: Easy configuration with presets and real-time estimates
- **Fair Bot Competition**: Bot races to same character target

### 4. **Auto-Scrolling Text Area**
- **Smart Scrolling**: Automatically keeps cursor centered in 3-line view
- **Smooth Navigation**: Uses `scrollIntoView` for optimal positioning
- **Hidden Scrollbars**: Clean interface with custom CSS scrollbar hiding
- **Reset Handling**: Properly resets scroll position on game reset

### 5. **Racing Mechanics**
- **Real-time Progress**: Visual track with flipped player car (🏎️) and OptiBot avatar
- **Bot Difficulty System**: 5 difficulty levels from Easy (41 WPM) to Henry (180 WPM)
- **Statistics Tracking**: Live WPM, accuracy, and elapsed time
- **Win/Loss Detection**: Automatic game ending with celebration modal
- **Race Start Countdown**: 3-2-1-Go countdown with traffic light indicators

### 6. **Game Start Enhancement**
- **Countdown Component**: Animated countdown with traffic lights (red-red-yellow-green)
- **Visual Indicators**: Color-coded countdown numbers and encouraging text
- **Smooth Transitions**: Automatic progression from countdown to active gameplay
- **Manual Scrolling Disabled**: Prevents user interference with auto-scrolling text

## 🗂️ Data Flow & State Management

### Core Game State (`single/page.tsx`)
```typescript
// Word-based typing state
const [currentWordIndex, setCurrentWordIndex] = useState(0);
const [currentWordInput, setCurrentWordInput] = useState('');
const [completedWords, setCompletedWords] = useState<string[]>([]);

// Race configuration
const [targetCharCount, setTargetCharCount] = useState(200);
const [botDifficulty, setBotDifficulty] = useState('Medium');
const [showSettings, setShowSettings] = useState(false);

// Game progress
const [correctChars, setCorrectChars] = useState(0);
const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'active' | 'finished'>('waiting');
```

### Key Algorithms

#### Progress Calculation
```typescript
const playerProgress = (correctChars / targetCharCount) * 100;
```

#### Bot Speed Calculation
```typescript
const BOT_DIFFICULTIES = {
  'Easy': 41, 'Medium': 67, 'Hard': 97, 'Very Hard': 120, 'Henry': 180
};
const currentBotWPM = BOT_DIFFICULTIES[botDifficulty];
const botCharsPerSecond = (currentBotWPM * 5) / 60; // 5 chars per word, 60 seconds per minute
```

#### Win Condition
```typescript
useEffect(() => {
  if (correctChars >= targetCharCount && gameState === 'active') {
    endGame('player');
  }
}, [correctChars, targetCharCount, gameState, endGame]);
```

#### Character Classification Logic
```typescript
// In TypingArea component
if (isCurrentWord && charIndex < currentWordInput.length) {
  if (charIndex < expectedWord.length && currentWordInput[charIndex] === expectedWord[charIndex]) {
    return 'text-black'; // Correct
  } else {
    return 'text-red-600'; // Incorrect or extra
  }
}
```

## 🎮 Game Flow

1. **Landing Page** (`app/page.tsx`)
   - User selects Single Player or Multiplayer
   - Clean UI with navigation buttons

2. **Game Setup** (`app/single/page.tsx`)
   - Default 200 character target with Medium bot difficulty
   - Settings button (⚙️) to configure race length and bot difficulty
   - "Start Race" button triggers countdown sequence

3. **Race Start Sequence**
   - 3-2-1-Go countdown with traffic light colors
   - Red lights for "3" and "2", yellow for "1", green for "Go!"
   - Automatic transition to active gameplay after countdown

4. **Active Gameplay**
   - Word-by-word typing with real-time feedback
   - Spacebar advances words, backspace can return to previous
   - Live stats and progress tracking
   - Bot races simultaneously with selected difficulty
   - Manual scrolling disabled to prevent interference

5. **Game Completion**
   - Winner determined by first to reach target character count
   - End game modal with final statistics
   - Options to restart or return home

## 🐛 Known Issues & Considerations

### Fixed Issues
- ✅ **Character Display Bug**: Fixed issue where expected characters were replaced by typed characters
- ✅ **Red Character Overflow**: Fixed untyped characters showing red instead of gray
- ✅ **Scroll Reset**: Fixed text not returning to top on game reset
- ✅ **Auto-scroll**: Implemented proper text scrolling for 3-line view
- ✅ **Extra Character Handling**: Users can now type beyond word boundaries
- ✅ **Car Direction**: Player car now faces the correct direction (right)
- ✅ **Vehicle Positioning**: Cars and bot start positions adjusted to prevent cutoff
- ✅ **Bot Speed Calculation**: Fixed incorrect bot WPM calculation (was 25x too slow)
- ✅ **Modal Background**: Race settings modal now uses blur instead of solid overlay

### Recent Enhancements
- ✅ **Countdown System**: Added 3-2-1-Go countdown with traffic light indicators
- ✅ **Bot Difficulty Levels**: Five difficulty levels from Easy (41 WPM) to Henry (180 WPM)
- ✅ **OptiBot Avatar**: Replaced generic robot emoji with custom OptiBot image
- ✅ **UI Improvements**: Blurred modal backgrounds and better visual positioning

### Future Considerations
- **Performance**: Large text handling is optimized but could be improved for 1000+ character races
- **Mobile UX**: Works responsively but could benefit from touch-specific optimizations
- **Multiplayer**: Foundation is ready for WebSocket-based real-time multiplayer
- **Text Sources**: Currently uses hardcoded text, could integrate with external APIs

## 🚀 Development Commands

```bash
# Development
npm run dev          # Start development server on localhost:3000

# Building
npm run build        # Create production build
npm start           # Run production build

# Linting & Type Checking
npm run lint        # ESLint checking (automatically runs in build)
# Type checking is handled automatically by TypeScript compiler
```

## 📦 Key Dependencies

```json
{
  "next": "15.5.3",
  "react": "19.0.0",
  "react-dom": "19.0.0",
  "typescript": "^5",
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "eslint": "^9",
  "eslint-config-next": "15.5.3",
  "tailwindcss": "4.0.0"
}
```

## 🎨 Styling System

### TailwindCSS Configuration
- Uses TailwindCSS 4 with custom theme configuration in `globals.css`
- Custom scrollbar hiding utility: `.scrollbar-hide::-webkit-scrollbar { display: none; }`
- Responsive design with `sm:` breakpoints for mobile/desktop differences

### Color Scheme
- **Primary**: Blue gradients for backgrounds and progress indicators
- **Success**: Green for correct typing and completion
- **Error**: Red for mistakes and incorrect input
- **Neutral**: Gray scale for untyped content and UI elements

## 📈 Performance Optimizations

1. **React Optimization**
   - `useCallback` hooks for event handlers to prevent unnecessary re-renders
   - Efficient character-by-character rendering with proper keys
   - Smart useEffect dependencies to minimize updates

2. **DOM Optimization**
   - Uses `scrollIntoView` for smooth auto-scrolling
   - Hidden input field to capture keystrokes without visual clutter
   - Minimal DOM updates through strategic state management

3. **Build Optimization**
   - Next.js 15 with Turbopack for fast builds
   - TypeScript for compile-time optimization
   - Clean production build with no warnings

## 🧪 Testing Approach

The application has been manually tested for:
- ✅ Word-based typing with extra characters
- ✅ Spacebar word advancement and backspace navigation
- ✅ Settings configuration and race length changes
- ✅ Bot racing and win/loss conditions
- ✅ Auto-scrolling and responsive design
- ✅ Error handling and edge cases

## 🔮 Future Development Roadmap

### Immediate Opportunities
1. **Unit Testing**: Add Jest/React Testing Library tests for components
2. **E2E Testing**: Implement Playwright or Cypress for full user flows
3. **Performance Monitoring**: Add Web Vitals tracking
4. **Analytics**: Track user engagement and typing improvement

### Feature Enhancements
1. **Multiplayer Mode**: Real-time racing via WebSockets
2. **User Accounts**: Progress tracking and personal statistics
3. **Custom Text**: Allow users to paste/import their own text
4. **Difficulty Levels**: Multiple bot speeds and text complexity
5. **Achievements**: Gamification with badges and milestones

### Technical Improvements
1. **PWA Features**: Offline support and app-like experience
2. **Database Integration**: Persistent user data and leaderboards
3. **API Integration**: External text sources and multiplayer backend
4. **Advanced Analytics**: Detailed typing pattern analysis

## 👨‍💻 Developer Notes

### Code Quality
- **TypeScript**: Strict typing throughout for better maintainability
- **Component Architecture**: Modular, reusable components with clear interfaces
- **State Management**: Predictable state flow with proper separation of concerns
- **Error Handling**: Graceful degradation and user-friendly error states

### Deployment Ready
- ✅ Production build optimized and tested
- ✅ No console errors or warnings
- ✅ Responsive design works across devices
- ✅ Clean, maintainable codebase

The project is in a production-ready state with room for feature expansion and technical enhancements as outlined above.