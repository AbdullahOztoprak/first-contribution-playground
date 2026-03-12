<h1 align="center">🎮 Platform</h1>
<p align="center">
  <strong>Make your first open-source contribution by submitting a small game</strong>
</p>
<p align="center">
  Fork → Build a game → Open a PR → Get it reviewed and merged
</p>
<p align="center">
  <a href="https://abdullahoztoprak.github.io/Platform">🌐 Live Site</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="CONTRIBUTING.md">Guidelines</a> •
  <a href="docs/BEGINNER_GUIDE.md">Beginner's Guide</a> •
  <a href="docs/GAME_IDEAS.md">Game Ideas</a>
</p>
<p align="center">
  <img src="https://img.shields.io/github/stars/AbdullahOztoprak/Platform?style=flat-square" alt="Stars">
  <img src="https://img.shields.io/github/forks/AbdullahOztoprak/Platform?style=flat-square" alt="Forks">
  <img src="https://img.shields.io/github/contributors/AbdullahOztoprak/Platform?style=flat-square" alt="Contributors">
  <img src="https://img.shields.io/github/issues/AbdullahOztoprak/Platform?style=flat-square&label=open%20issues" alt="Issues">
</p>

---

## 🚀 What is Platform?

**Platform** is an open-source playground where junior developers learn real-world open-source workflows by building and submitting small games.

- 🎮 **Submit a game** — CLI, web, or algorithm. Max 5 files, max 500 lines.
- 🌍 **Contribute translations** — Help make the docs multilingual.
- 📊 **Build your GitHub profile** — Every merged PR is real contribution history.
- 🎓 **Learn real workflows** — Forks, branches, PRs, code review, CI/CD.
- 🏆 **Earn XP and badges** — Gamification rewards active contributors.

> **This project is early-stage and actively looking for first contributors.** If you've never made an open-source PR before, this is a great place to start.

---

## 📁 Repository Structure

```
Platform/
├── games/
│   ├── cli/              # Terminal-based games (Python)
│   └── web/              # Browser-based games (HTML/CSS/JS)
├── data/                 # TypeScript data schemas & generated JSON
├── scripts/              # Build & validation scripts (TypeScript)
├── web/                  # Astro static site (deployed to GitHub Pages)
├── docs/                 # Guides for contributors
├── translations/         # Translated docs (help wanted!)
├── .github/workflows/    # CI/CD automation (4 workflows)
├── CONTRIBUTING.md
├── SECURITY.md
└── CODE_OF_CONDUCT.md
```

---

## ⚡ Quick Start

### 🎮 Submit a Game

1. **Fork** this repository
2. **Create a branch**: `git checkout -b game/your-game-name`
3. **Add your game** in `games/<category>/your-game-name/`
4. **Include these files:**
   - `README.md` — How to play + what you learned
   - `metadata.json` — Game info ([template](CONTRIBUTING.md#metadatajson-template))
   - Your source code (max 5 files, max 500 lines)
5. **Open a PR** using the [Game Submission template](.github/PULL_REQUEST_TEMPLATE/game_submission.md)
6. **Wait for review** — our bots will validate automatically!

### 🌍 Submit a Translation

1. **Fork** this repository
2. **Create a branch**: `git checkout -b translation/lang-code`
3. **Add your translation** in `translations/` with format `FILENAME.LANG_CODE.md`
4. **Open a PR** using the [Translation template](.github/PULL_REQUEST_TEMPLATE/translation_submission.md)
5. **Auto-merge** — if all checks pass, translations merge automatically!

---

## 🎮 Featured Games

### CLI Games
| Game | Author | Language | Difficulty |
|------|--------|----------|------------|
| [Number Guessing](games/cli/example-number-guessing/) | @platform-bot | Python | Beginner |

### Web Games
| Game | Author | Language | Difficulty |
|------|--------|----------|------------|
| [Rock Paper Scissors](games/web/example-rock-paper-scissors/) | @platform-bot | HTML/CSS/JS | Beginner |

➡️ *Want to see your game here? [Submit one now!](../../issues/new?template=game-submission.yml)*

---

## 🏆 Leaderboard

<!-- LEADERBOARD:WEEKLY:START -->
### 🏆 Top Games This Week

*No game submissions this week yet — [be the first!](../../issues/new?template=game-submission.yml)*
<!-- LEADERBOARD:WEEKLY:END -->

<!-- LEADERBOARD:CONTRIBUTORS:START -->
### 🌟 Top Contributors (All Time)

| Rank | Contributor | Contributions |
|------|------------|---------------|
| 🥇 | [@AbdullahOztoprak](https://github.com/AbdullahOztoprak) | 8 |

<!-- LEADERBOARD:CONTRIBUTORS:END -->

<!-- LEADERBOARD:TIMESTAMP:START -->
*Last updated: Sun, 08 Mar 2026 12:06:01 GMT*
<!-- LEADERBOARD:TIMESTAMP:END -->

> 💡 **How voting works:** React with 👍 on game PRs to vote! Top 3 games are featured weekly.

---

## 🤖 Automation

This project uses **4 GitHub Actions** workflows:

| Workflow | Trigger | What it Does |
|----------|---------|--------------|
| **CI Pipeline** | PR opened/updated | Detects type, validates, lints, security scan |
| **Deploy** | Push to main | Builds data index, deploys web site |
| **Community** | PR/Issue | Welcome bot, anti-spam, stale management |
| **Leaderboard** | Weekly (Sunday) | Calculates XP-weighted rankings |

---

## 🎮 Gamification System

### XP Rewards
| Action | XP Earned |
|--------|-----------|
| First contribution | +50 |
| Game merged | +100 |
| Translation merged | +30 |
| Reviewed a PR | +20 |
| Received 👍 vote | +5 |
| Weekly #1 | +200 |
| Weekly #2 | +100 |
| Weekly #3 | +50 |

### Difficulty Multipliers
- 🟢 **Beginner games**: 1.0x points
- 🟡 **Intermediate games**: 1.5x points
- 🔴 **Advanced games**: 2.0x points

### Levels
| Level | XP Required | Title |
|-------|-------------|-------|
| 1 | 0 | Newcomer |
| 2 | 100 | Contributor |
| 3 | 300 | Regular |
| 4 | 600 | Expert |
| 5 | 1000+ | Master |

### Badges
🎮 **Game Master** (5+ games) • 🌍 **Translator** (3+ translations) • ⭐ **Champion** (Weekly #1) • 🔥 **Streak Hero** (4-week streak) • 👀 **Reviewer** (10+ reviews) • 💎 **OG** (First 10 contributors)

---

## 🌍 Available Translations

| Language | README | Contributing | Beginner's Guide |
|----------|--------|-------------|-----------------|
| 🇬🇧 English | ✅ | ✅ | ✅ |
| 🇹🇷 Turkish | ❌ Help wanted! | ❌ | ❌ |
| 🇪🇸 Spanish | ❌ Help wanted! | ❌ | ❌ |
| 🇫🇷 French | ❌ Help wanted! | ❌ | ❌ |
| 🇩🇪 German | ❌ Help wanted! | ❌ | ❌ |
| 🇯🇵 Japanese | ❌ Help wanted! | ❌ | ❌ |
| 🇧🇷 Portuguese | ❌ Help wanted! | ❌ | ❌ |

➡️ *Pick a language and [start translating!](../../issues/new?template=translation.yml)*

---

## 📖 Documentation

- 📋 [Contributing Guide](CONTRIBUTING.md) — Rules, templates, and process
- 📖 [Beginner's Guide](docs/BEGINNER_GUIDE.md) — Step-by-step for first-timers
- � [Game Ideas](docs/GAME_IDEAS.md) — Don't know what to build? Start here
- 🗺️ [Roadmap](docs/ROADMAP.md) — What's done and what's planned
- 🔒 [Security Policy](SECURITY.md) — How we keep submissions safe
- 📜 [Code of Conduct](CODE_OF_CONDUCT.md) — Community standards

---

## 🛡️ Security

Game submissions are automatically scanned before they can be merged:

- ✅ Scanned for dangerous functions (`eval`, `exec`, `subprocess`, etc.)
- ✅ Checked for network access attempts
- ✅ Validated for allowed file types only
- ✅ Limited to 5 files and 500 lines per submission
- ✅ Reviewed by maintainers before merging

See the full [Security Policy](SECURITY.md) for details.

---

## 🗺️ Roadmap

### Shipped
- [x] Core repository structure & contribution guidelines
- [x] GitHub Actions CI/CD (validation, deploy, community, leaderboard)
- [x] Gamification system (XP, badges, levels, weekly leaderboard)
- [x] Security scanning & anti-spam protection
- [x] Astro web frontend with game catalog, leaderboard, contributor profiles
- [x] Auto-deploy to GitHub Pages on merge
- [x] Example games (CLI + Web)
- [x] Beginner's guide & documentation

### Next Up
- [ ] Grow to 10+ community-submitted games
- [ ] First community translations
- [ ] Monthly themed game challenges
- [ ] Embed web games playable in the browser
- [ ] Community Discord/Slack channel

### Future
- [ ] Python CLI games playable via WebAssembly (Pyodide)
- [ ] Contributor dashboard with shareable profile URL
- [ ] Integration with coding bootcamps
- [ ] Annual community awards

See the full [Roadmap](docs/ROADMAP.md) for details.

---

## 🤝 Contributing

We welcome contributions of all kinds! This project is designed for first-time open-source contributors.

**Not sure where to start?**
- Browse [open issues](https://github.com/AbdullahOztoprak/Platform/issues) for ideas
- Check [Game Ideas](docs/GAME_IDEAS.md) for game inspiration
- Read the [Beginner's Guide](docs/BEGINNER_GUIDE.md) for a step-by-step walkthrough

---

## ⭐ Star This Repo

If you think this project is a good idea, give it a ⭐ star. It helps others find it.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <strong>Built with ❤️ for the open-source community</strong>
  <br>
  <sub>Every contribution matters. Start your journey today.</sub>
</p>
