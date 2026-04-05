# Tetris Web Game

## Project Overview

A browser-based **Tetris** game implemented using vanilla JavaScript, HTML, and CSS. This is a lightweight, client-side game with no external dependencies or build tools required.

### Technologies
- **HTML5** — Game structure and markup
- **CSS3** — Styling with Flexbox, CSS Grid, and glow effects
- **Vanilla JavaScript (ES6+)** — Game logic, no frameworks or libraries

### Architecture

```
src/
├── index.html      # Main HTML page, game container
├── style.css       # Game styling and layout with glow effect
├── app/
│   └── app.js      # Core game logic (JSDoc documented)
└── bkp/
    └── tetris.tar.gz # Project backup
```

### Game Features
- Classic Tetris gameplay with 7 standard tetromino shapes (I, J, L, O, S, T, Z)
- 7-bag randomizer system for fair piece distribution
- Score tracking with line clear bonuses (100/300/500/800 × level)
- Next shape preview
- Wall kick rotation system
- Automatic piece drop with increasing speed per level
- Level progression (every 10 lines)
- High score persistence via `localStorage`
- Pause/resume functionality
- Game over detection and restart
- Retro text-mode rendering (80×24 characters)
- Optimized rendering with DOM element reuse (no memory leaks)

### Controls
| Key | Action |
|-----|--------|
| ← | Move left |
| → | Move right |
| ↓ | Soft drop (+1 point per cell) |
| ↑ | Rotate clockwise |
| Space | Hard drop (+2 points per cell) |
| P / Escape | Pause / Resume |
| Enter / Space (after Game Over) | Restart |
| 0 | Toggle control hints |
| 1 | Toggle next piece preview |

## Running the Game

No build process or server is strictly required. The game can be run directly in a browser:

```bash
# Option 1: Open directly in browser
open index.html

# Option 2: Use a simple HTTP server (recommended for proper script loading)
python3 -m http.server 8000
# Then navigate to: http://localhost:8000
```

## Development Notes

### Coding Style
- Uses ES6+ features: `const`, `let`, arrow functions, template literals
- Single global `Tetris` object (no module bundling)
- Direct DOM manipulation via `getElementById` and `querySelector`
- JSDoc comments for all public methods

### Game Logic Summary
1. **Grid System**: 10 columns × 20 rows
2. **Cell Size**: 2 characters (`. ` for empty, `[]` for filled)
3. **Display**: 80×24 characters with ASCII art borders
4. **Tetrominoes**: Each shape has a defined matrix and color
5. **Game Loop**: `setInterval`-based automatic piece drop
6. **Rendering**: Full screen redraw on state changes, DOM reuse for glow layer

### Known Limitations
- All game state is in memory (resets on page reload, except high score)
- No sound effects or background music
- No responsive design for mobile devices
- No difficulty levels (speed is tied to level)

## Future Enhancements (Suggestions)
- Add sound effects and background music
- Implement responsive design for mobile devices
- Add touch controls for mobile
- Add difficulty levels (independent speed control)
- Implement ghost piece preview
- Add hold piece functionality
- Add animations for line clears
- Convert to ES modules for better encapsulation
