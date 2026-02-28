# 🎮 Game Submission Guide

This guide explains everything you need to know about submitting a game.

## Game Categories

### CLI Games (`games/cli/`)
Terminal-based games that run in the command line.
- **Examples:** Number guessing, text adventure, trivia quiz, hangman
- **Languages:** Python, Node.js
- **Entry point:** `game.py` or `game.js`

### Web Games (`games/web/`)
Browser-based games using HTML, CSS, and JavaScript.
- **Examples:** Rock-paper-scissors, tic-tac-toe, memory card, snake
- **Languages:** HTML/CSS/JavaScript (vanilla only, no frameworks)
- **Entry point:** `index.html`

### Algorithm Games (`games/algorithm/`)
Algorithm puzzles and coding challenges.
- **Examples:** Sorting visualizer, maze solver, sudoku solver, pathfinding
- **Languages:** Python, JavaScript
- **Entry point:** `main.py` or `main.js`

## Required Files

Every game submission **must** include:

### 1. Source Code
Your game implementation (1-3 source files)

### 2. `README.md`
Must include:
- Game name and author
- Category and difficulty
- Description (2-3 sentences)
- How to play (commands or instructions)
- "What I Learned" section

### 3. `metadata.json`
```json
{
  "name": "Game Name",
  "author": "github-username",
  "category": "cli | web | algorithm",
  "difficulty": "beginner | intermediate | advanced",
  "language": "python | javascript | html/css/javascript",
  "version": "1.0.0",
  "description": "Short description",
  "tags": ["tag1", "tag2"],
  "created_at": "YYYY-MM-DD",
  "entry_point": "game.py | index.html | main.js"
}
```

## Limits

| Limit | Value |
|-------|-------|
| Max files | 5 |
| Max total lines of code | 500 |
| Allowed file types | `.py`, `.js`, `.html`, `.css`, `.json`, `.md`, `.txt` |
| External dependencies | None allowed |
| Network access | Not allowed |
| File system access | Not allowed (outside game dir) |

## Tips for a Great Submission

1. **Start simple** — a well-made simple game beats a broken complex one
2. **Comment your code** — explain what each section does
3. **Handle errors** — what if the user enters invalid input?
4. **Make it fun** — add emoji, colors, or creative prompts
5. **Write a good README** — this is what people see first
6. **Test thoroughly** — play your own game multiple times
