# DVK-TETRIS

## Project Overview

Retro ASCII text-mode Tetris game rendered in the browser using pure JavaScript and monospace font. The game displays an 80x24 character grid with classic Tetris gameplay, featuring:

- **7 standard tetrominoes** (I, J, L, O, S, T, Z) with matrix-based representation
- **7-bag randomization system** (Fisher-Yates shuffle)
- **Scoring system**: 100/300/500/800 points for 1/2/3/4 lines, multiplied by level
- **Level progression**: Every 10 cleared lines increases speed
- **High score persistence** via localStorage
- **Wall kick** rotation system
- **Retro green terminal aesthetic** with text-shadow effects

## Directory Structure

```
DVK-TETRIS/
├── docs/
│   ├── index.html          # Main entry point
│   ├── style.css           # Terminal-style CSS
│   └── app/
│       └── app.js          # Game engine (single file)
└── QWEN.md                 # This file
```

## Technologies

- **Vanilla JavaScript** - No frameworks or libraries
- **HTML5** - Minimal markup structure
- **CSS3** - Monospace font styling, terminal glow effects, flexbox centering

## Running the Game

Open `docs/index.html` in a browser:

```bash
# Option 1: Direct file open
open docs/index.html

# Option 2: Simple HTTP server
python3 -m http.server 8000 --directory docs
```

## Controls

| Key | Action |
|-----|--------|
| `←` / `ArrowLeft` | Move left |
| `→` / `ArrowRight` | Move right |
| `↑` / `ArrowUp` | Rotate |
| `↓` / `ArrowDown` | Soft drop (+1 point) |
| `Space` | Hard drop (+2 points per row) |
| `P` / `Escape` | Pause/Resume |
| `R` | Reset game |
| `1` | Toggle next piece preview |
| `0` | Toggle control hints |
| `Enter` / `Space` | Restart after Game Over |

## Architecture

The game is implemented as a single `Tetris` namespace object with:

- **`CONSTANTS`** - Game configuration (board size, timing, display dimensions)
- **`TETROMINOS`** - Piece definitions as 2D arrays
- **`state`** - Reactive game state object
- **`elements`** - DOM element references
- **Core methods**: `init()`, `startGame()`, `drop()`, `rotate()`, `clearLines()`, `render()`, `handleInput()`

The render loop outputs ASCII characters to a `<pre>`-styled div, maintaining a fixed 80x24 character display with the game cup centered and info/controls on the sides.

## Development Conventions

- **JSDoc comments** throughout the codebase
- **Single file architecture** - All game logic in `app.js`
- **No external dependencies** - Pure vanilla JS
- **Russian UI text** - Game interface uses Cyrillic labels
- **Version query params** - CSS and JS include `?v=YYYYMMDD` for cache busting
