# 🤝 Contributing to Platform

Thank you for your interest in contributing! This project is designed specifically for **junior developers** to make their first open-source contributions. Whether you're submitting a game or a translation, we've made the process as smooth as possible.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [🎮 Submitting a Game](#-submitting-a-game)
  - [🌍 Submitting a Translation](#-submitting-a-translation)
- [Submission Rules](#submission-rules)
- [Pull Request Process](#pull-request-process)
- [Gamification & Leaderboard](#gamification--leaderboard)
- [Getting Help](#getting-help)

---

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold a welcoming, inclusive, and harassment-free environment.

---

## How Can I Contribute?

### 🎮 Submitting a Game

We accept three types of games:

| Type | Directory | Description |
|------|-----------|-------------|
| **CLI Games** | `games/cli/` | Terminal-based games (Python, Node.js, etc.) |
| **Web Games** | `games/web/` | Browser-based games (HTML/CSS/JS) |
| **Algorithm Games** | `games/algorithm/` | Puzzle & algorithm challenges |

#### Game Submission Steps:

1. **Fork** this repository
2. **Create a new branch**: `git checkout -b game/your-game-name`
3. **Create your game folder**: `games/<category>/your-game-name/`
4. **Required files in your folder:**
   - `README.md` — Description, how to play, what you learned
   - `metadata.json` — Game metadata (see template below)
   - Your game source files
5. **Submit a Pull Request** using the **Game Submission** template

#### metadata.json Template:

```json
{
  "name": "Your Game Name",
  "author": "your-github-username",
  "category": "cli | web | algorithm",
  "difficulty": "beginner | intermediate | advanced",
  "language": "python | javascript | etc.",
  "version": "1.0.0",
  "description": "A short description of your game",
  "tags": ["beginner", "python", "cli"],
  "created_at": "YYYY-MM-DD",
  "entry_point": "game.py | index.html | main.js"
}
```

### 🌍 Submitting a Translation

1. **Fork** this repository
2. **Create a new branch**: `git checkout -b translation/language-code`
3. **Create or find the file** to translate in `translations/`
4. **Use the correct naming convention**: `FILENAME.LANG_CODE.md`
   - Example: `README.tr.md` for Turkish, `README.es.md` for Spanish
5. **Submit a Pull Request** using the **Translation** template

---

## Submission Rules

### Game Rules ✅

- [ ] Game must be **original** or **significantly modified** from tutorials
- [ ] No external API calls or network requests
- [ ] No file system access outside your game directory
- [ ] No package installations required (keep it dependency-free)
- [ ] Maximum **5 files** per submission
- [ ] Maximum **500 lines of code** total per submission
- [ ] Must include `README.md` and `metadata.json`
- [ ] Only allowed file types: `.py`, `.js`, `.html`, `.css`, `.json`, `.md`, `.txt`
- [ ] No minified or obfuscated code
- [ ] Code must be readable and well-commented

### Translation Rules ✅

- [ ] Must be a **human translation** (not pure machine translation)
- [ ] Must follow the original document structure exactly
- [ ] Keep all links and references intact
- [ ] Use proper grammar and spelling
- [ ] File must use UTF-8 encoding

---

## Pull Request Process

1. **Fill out the PR template completely** — incomplete PRs will be auto-closed
2. **Pass all automated checks** — our CI will validate your submission
3. **Wait for review:**
   - 🌍 **Translations**: Auto-merged if all checks pass
   - 🎮 **Games**: Require at least 1 approval from a maintainer
4. **Address feedback** if changes are requested
5. **Celebrate** when merged! 🎉

### PR Labels (Auto-assigned)

| Label | Meaning |
|-------|---------|
| `🎮 game` | Game submission |
| `🌍 translation` | Translation submission |
| `🟢 beginner-friendly` | Good first contribution |
| `✅ ready-to-merge` | All checks passed |
| `❌ validation-failed` | Checks did not pass |
| `🔒 needs-security-review` | Flagged for security review |

---

## If CI fails

Short checklist when your pull request fails automated checks:

- **Did you commit generated data?** — Remove `data/*.json` from your branch; these are generated on `main`. Locally use `npm run build:data` for preview only.
- **Metadata validation errors** — Check `metadata.json` keys: `name`, `author`, `category`, `difficulty`, `language`, `entry_point`. Run `npm run validate` to see validation output.
- **File/line limits** — Ensure your submission has ≤ 5 files and ≤ 500 total lines.
- **Security restrictions** — Remove any usage of `eval`, `exec`, subprocess/network calls or access beyond the game folder.

If you're unsure, paste the CI failure output into a Discussion or open an Issue (link in Getting Help). A maintainer will help triage.


## Gamification & Leaderboard

- Community members can **vote** on game submissions using 👍 reactions on the PR
- Every week, a bot calculates votes and updates the **Leaderboard** in README.md
- **Top 3 weekly games** get featured!
- Active contributors earn recognition in our Hall of Fame

---

## Generated Data Files (Important)

The repository generates a set of JSON files from the source-of-truth content (the `games/`, `translations/`, and other content directories). These generated files are:

- `data/games.json`
- `data/contributors.json`
- `data/leaderboard.json`

Please do NOT edit or commit these generated files in feature branches. Any pull request that includes changes to these files will fail an automated check and must be updated to remove those changes. The project provides automation that regenerates and commits the canonical data on the `main` branch.

If you need to run the data generation locally for testing, run:

```bash
npm run build:data
```

This will update the files in your working tree for local testing only — do not commit those changes. Keep your PRs limited to source files under `games/`, `translations/`, `docs/`, etc.

---

## Getting Help

- 💬 Open a [Discussion](../../discussions) for questions
- 🐛 Use [Issue Templates](../../issues/new/choose) for bugs or requests
 - 💬 Open a [Discussion](https://github.com/AbdullahOztoprak/Platform/discussions) for questions
 - 🐛 Use [Issue Templates](https://github.com/AbdullahOztoprak/Platform/issues/new/choose) for bugs or requests
- 📖 Read the [Beginner's Guide](docs/BEGINNER_GUIDE.md) for step-by-step instructions

---

**Welcome aboard! Every expert was once a beginner.** 🚀
