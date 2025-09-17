# Changelog

All notable changes to the TypeRace project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-09-17

### Added
- **Countdown Component** (`app/components/Countdown.tsx`): 3-2-1-Go countdown with traffic light system
- **Bot Difficulty Selection**: Five difficulty levels in race settings
  - Easy: 41 WPM (Beginner friendly)
  - Medium: 67 WPM (Average challenge)
  - Hard: 97 WPM (Expert level)
  - Very Hard: 120 WPM (Professional)
  - Henry: 180 WPM (Legendary)
- **OptiBot Avatar Integration**: Custom bot avatar image replacing generic robot emoji
- **Traffic Light Countdown**: Color-coded countdown sequence (red-red-yellow-green)

### Changed
- **Game State Machine**: Added 'countdown' state between 'waiting' and 'active'
- **Car Orientation**: Player car now faces the correct direction (flipped horizontally)
- **Modal Background**: Race settings modal uses blur effect instead of solid black overlay
- **Bot Positioning**: Improved starting positions to prevent image cutoff on track edges
- **Manual Scrolling**: Disabled user scrolling in typing area to prevent interference
- **Track Layout**: Removed starting flag, keeping only finish line trophy

### Fixed
- **Critical Bot Speed Bug**: Fixed bot WPM calculation that was 25x too slow
- **Vehicle Visibility**: Cars and bot now start at 3% position instead of 0% to prevent cutoff
- **Countdown Sizing**: Adjusted countdown text size to fit properly within typing area bounds
- **Modal Blur Effect**: Corrected blur implementation for proper background effect

### Technical Improvements
- **State Management**: Enhanced bot difficulty state handling with proper dependencies
- **Performance**: Optimized bot speed calculations with correct WPM-to-characters-per-second conversion
- **Component Architecture**: Clean separation of countdown logic from typing area
- **Type Safety**: Proper TypeScript typing for bot difficulty mappings

## [1.0.0] - 2025-09-16

### Added
- **Complete TypeRace Application**: Built from Next.js template to full-featured typing race game
- **Landing Page** (`app/page.tsx`): Clean interface with Single Player and Multiplayer navigation buttons
- **Single Player Racing Game** (`app/single/page.tsx`): Complete racing implementation with bot opponent
- **Multiplayer Placeholder** (`app/multiplayer/page.tsx`): Coming soon page with planned features

#### Core Game Components
- **Track Component** (`app/components/Track.tsx`): Visual racing track with player car (<�) and bot car (>)
- **Stats Component** (`app/components/Stats.tsx`): Real-time WPM, accuracy, and elapsed time display
- **TypingArea Component** (`app/components/TypingArea.tsx`): Word-based text display with character-by-character feedback
- **EndGameModal Component** (`app/components/EndGameModal.tsx`): Game completion modal with statistics and restart options
- **RaceSettings Component** (`app/components/RaceSettings.tsx`): Configurable race parameters modal

#### Game Features
- **Word-Based Typing System**: Revolutionary change from character-based to word-based typing
- **Extra Character Support**: Users can type beyond expected word length (e.g., "lazyyy" for "lazy")
- **Spacebar Word Advancement**: Only spacebar advances to next word, preventing auto-progression
- **Smart Backspace Navigation**: Return to previous words and edit within current word
- **Real-time Statistics**: Live WPM calculation, accuracy tracking, and elapsed time
- **Bot Opponent**: 45 WPM bot with consistent performance
- **Win/Loss Detection**: Automatic game ending when target reached

#### Visual System
- **Color-Coded Feedback**:
  - Black: Correctly typed characters
  - Red: Incorrectly typed or extra characters
  - Gray: Untyped characters or skipped words
  - Blue line: Current cursor position (left border)
- **Word Error Indicators**: Red underlines on completed words with errors
- **Dynamic Character Display**: Shows expected text plus extra typed characters
- **Responsive Design**: Mobile and desktop optimized layouts

#### Advanced Features
- **Auto-Scrolling Text Area**: Automatically centers cursor in 3-line view
- **Hidden Scrollbars**: Clean interface with custom CSS scrollbar hiding
- **Configurable Race Length**: Target-based races from 50-1000 correct characters
- **Race Presets**: Quick Sprint (100), Short (200), Medium (400), Long (600), Marathon (1000)
- **Settings Modal**: Gear icon interface with real-time estimates

### Changed
- **Game Architecture**: Rebuilt entire typing system from character-based to word-based
- **Progress Calculation**: Changed from text completion percentage to correct character count
- **Win Conditions**: Updated from completing all text to reaching configurable character target
- **Bot Progress**: Adjusted to compete for same character target as player
- **Input Handling**: Completely rewritten to support word-based typing with extra characters

### Fixed
- **Character Display Bug**: Fixed issue where expected characters were replaced by typed input
- **Red Character Overflow**: Resolved untyped characters incorrectly showing red instead of gray
- **Scroll Position Reset**: Fixed text area not returning to top position on game reset
- **Auto-Scroll Timing**: Implemented proper text scrolling with `scrollIntoView`
- **Extra Character Handling**: Corrected display logic to show both expected and extra characters
- **Cursor Positioning**: Changed from blue box to clean blue left border line
- **Space Highlighting**: Ensured spaces always appear with correct formatting
- **Word Error Detection**: Fixed underline logic to only show on completed words with errors
- **Settings Integration**: Proper state management for race configuration changes

### Technical Improvements
- **TypeScript Integration**: Full type safety throughout application
- **Performance Optimization**: Efficient rendering with useCallback hooks and strategic re-renders
- **State Management**: Clean React hooks architecture with proper dependency management
- **Build Optimization**: Next.js 15 with Turbopack for fast development builds
- **Code Quality**: ESLint integration with zero warnings in production build
- **Component Architecture**: Modular, reusable components with clear interfaces

### UI/UX Enhancements
- **Gradient Backgrounds**: Modern blue-to-indigo gradients for visual appeal
- **Settings Integration**: Gear icon (�) for easy access to race configuration
- **Progress Indicators**: Character count display with visual progress bar
- **Dynamic Headers**: Updates to show current race target (e.g., "Race to 200 correct characters!")
- **Modal Interfaces**: Polished settings and end game modals with proper transitions
- **Responsive Text Sizing**: Optimized font sizes for mobile and desktop
- **Clean Overlays**: Proper game state overlays with high opacity coverage

### Documentation
- **Comprehensive README**: Updated with setup instructions, features, and configuration options
- **CLAUDE.md**: Technical implementation summary with file descriptions and features
- **HANDOFF.md**: Complete developer handoff documentation with architecture details
- **Code Comments**: Strategic commenting for complex logic and algorithms

### Development Infrastructure
- **Build System**: Next.js 15 with App Router and Turbopack
- **Styling**: TailwindCSS 4 with custom utilities and responsive design
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint integration with Next.js config
- **Performance**: Optimized bundle size and runtime performance

## Development Notes

### Architecture Decisions
1. **Word-Based System**: Chose word-based over character-based to support natural typing patterns
2. **Component Separation**: Clear separation of concerns between display, input, and game logic
3. **State Management**: React hooks over external state managers for simplicity
4. **Auto-Scrolling**: `scrollIntoView` implementation for smooth, reliable scrolling
5. **Configuration**: Modal-based settings for better UX than inline controls

### Performance Considerations
- Character rendering optimized with proper React keys
- Efficient useEffect dependencies to minimize re-renders
- Strategic use of useCallback for event handlers
- Minimal DOM manipulation through React state management
- Hidden input field approach for clean keystroke capture

### Future-Proofing
- Modular component architecture ready for multiplayer expansion
- Configurable race system extensible to new game modes
- Clean API surface for potential backend integration
- Responsive design foundation for mobile app development

---

*This changelog documents the transformation of a basic Next.js template into a full-featured typing race game with advanced word-based typing mechanics, configurable race settings, and polished user experience.*