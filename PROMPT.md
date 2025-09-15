You are Claude Code. Please create a typing race game built with Next.js (latest) using TypeScript.

High-level vision
- Single-player typing race where a user types through a given prompt; their progress is visualized as a car moving along a track toward a finish line.
- Initial landing screen shows two choices: “Single Player (vs Bot)” and “Multiplayer”. For now, implement only Single Player; Multiplayer can be a placeholder button/state.
- Keep implementation intentionally lightweight so I can iterate later. Sensible defaults over exhaustive features.

Scope for this pass
- Use fresh Next.js app and set up a single-player page with basic game loop.
- The game shows:
  - The text to type (can be a short, hardcoded sample for now).
  - A typing input experience with per-character feedback (correct/incorrect or simple highlighting).
  - Real-time stats: elapsed time, WPM (rough), and accuracy (basic).
  - A horizontal track where my car advances based on % of prompt completed.
  - A simple “bot” opponent that advances at a steady, configurable pace (no AI needed).
  - Start/Reset controls.
- Keep the landing screen simple with two buttons. The Multiplayer button routes to a “coming soon” page/modal.

Tech + structure
- Use Next.js, Typescript, and TailwindCSS
- Keep components small and easy to modify later (e.g., Track, Car, TypingArea, HUD/Stats).
- Keep state management local (React hooks) for now.
- Organize files clearly so I can add multiplayer later.

Behavior details (purposely loose—use reasonable defaults)
- Progress calculation: typedCorrectChars / totalChars.
- Car position on track maps to progress %.
- WPM can be naive (gross WPM based on total characters / 5 over elapsed minutes).
- Accuracy can be naive (correct / typed).
- Bot speed: configurable constant; aim for a fun baseline “race” feel.
- End condition: when player or bot reaches 100% progress; show a simple result modal and allow restart.

Pages & routes (suggested)
- / : Landing with “Single Player” and “Multiplayer (placeholder)”.
- /single : The game.
- /multiplayer : Placeholder page that explains it’s coming soon.

Deliverables
- Working Next.js app with the above pages and components.
- Minimal, clean UI that looks decent but is easy to restyle later.
- Clear TODO comments where appropriate (e.g., “TODO: swap hardcoded text for fetched prompts”, “TODO: real-time multiplayer via WebSockets”).
- Brief README with setup/run instructions and notes on how to change the typing text and bot speed.

Please:
- Generate all necessary files and code.
- Explain any assumptions you make.
- Keep the code self-contained and runnable (include any config needed for Tailwind if you choose it).
- After completing a task, please update CLAUDE.md with any new files or new features
