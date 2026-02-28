<h1 align="center">🎮 Platform</h1>
<p align="center">
  <strong>The open-source playground for junior developers</strong>
</p>
<p align="center">
  Submit games · Earn XP · Collect badges · Build your portfolio
</p>
<p align="center">
  <a href="https://abdullahoztoprak.github.io/Platform">🌐 Live Site</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-how-to-contribute">Contribute</a> •
  <a href="#-gamification">Gamification</a> •
  <a href="CONTRIBUTING.md">Guidelines</a>
</p>
<p align="center">
  <img src="https://img.shields.io/github/stars/AbdullahOztoprak/Platform?style=flat-square" alt="Stars">
  <img src="https://img.shields.io/github/forks/AbdullahOztoprak/Platform?style=flat-square" alt="Forks">
  <img src="https://img.shields.io/github/contributors/AbdullahOztoprak/Platform?style=flat-square" alt="Contributors">
</p>

---

## 🚀 What is Platform?

**Platform** is a GitHub-based community where junior developers can make their first open-source contributions by:

- 🎮 **Submitting simple games** — CLI, web, or algorithm games
- 🌍 **Contributing translations** — Help us reach a global audience
- 🏆 **Competing on leaderboards** — Community votes rank the best games weekly
- 📊 **Building GitHub history** — Every merged PR appears on your profile
- 🎓 **Learning real workflows** — PRs, code review, CI/CD, and automation

> **Every expert was once a beginner.** This is where your open-source journey starts.

---

## 📁 Repository Structure

```
Platform/
├── games/
│   ├── cli/              # Terminal-based games
│   ├── web/              # Browser-based games
│   └── algorithm/        # Algorithm puzzles & challenges
├── translations/
│   ├── README/           # README translations
│   ├── CONTRIBUTING/     # Contributing guide translations
│   └── guides/           # Guide translations
├── data/                 # TypeScript data schemas
├── scripts/              # Build & validation scripts
├── web/                  # Astro web platform
│   ├── src/pages/        # Pages (games, leaderboard, profiles)
│   └── src/components/   # Reusable UI components
├── docs/                 # Documentation & guides
├── .github/
│   └── workflows/        # CI/CD automation (4 workflows)
├── CONTRIBUTING.md        # Contribution guidelines
├── CODE_OF_CONDUCT.md     # Code of conduct
└── README.md              # You are here!
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

*No game submissions this week. Be the first to submit!*

<!-- LEADERBOARD:WEEKLY:END -->

<!-- LEADERBOARD:CONTRIBUTORS:START -->
### 🌟 Top Contributors (All Time)

*No contributions yet. Be the first!*

<!-- LEADERBOARD:CONTRIBUTORS:END -->

<!-- LEADERBOARD:TIMESTAMP:START -->
*Last updated: Not yet — leaderboard updates every Sunday*
<!-- LEADERBOARD:TIMESTAMP:END -->

> 💡 **How voting works:** React with 👍 on game PRs to vote! Top 3 games are featured weekly.

---

## 🏅 Hall of Fame

Special recognition for outstanding contributors:

| Badge | Criteria | Recipients |
|-------|----------|------------|
| 🥇 **First Contributor** | First merged PR | — |
| 🎮 **Game Master** | 5+ games submitted | — |
| 🌍 **Translation Champion** | 3+ translations | — |
| ⭐ **Weekly Champion** | #1 on weekly leaderboard | — |
| 🔥 **Streak Hero** | 4 consecutive weekly contributions | — |
| 🐛 **Bug Hunter** | Found & reported a significant bug | — |

---

## 🤖 Automation

This project is **fully automated** with 4 consolidated GitHub Actions:

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
- 🔒 [Security Policy](SECURITY.md) — How we keep submissions safe
- 📜 [Code of Conduct](CODE_OF_CONDUCT.md) — Community standards
- 🗺️ [Roadmap](docs/ROADMAP.md) — Future plans for the platform

---

## 🛡️ Security

We take security seriously. Game submissions are:

- ✅ Scanned for dangerous functions (`eval`, `exec`, `subprocess`, etc.)
- ✅ Checked for network access attempts
- ✅ Validated for allowed file types only
- ✅ Limited to 5 files and 500 lines per submission
- ✅ Reviewed by maintainers before merging

See our full [Security Policy](SECURITY.md) for details.

---

## 🗺️ Roadmap

- [x] Core repository structure
- [x] GitHub Actions automation
- [x] Gamification & leaderboard system
- [x] Anti-spam & security protection
- [ ] Web frontend for browsing games
- [ ] Contributor profiles & badges
- [ ] API for game metadata
- [ ] Hosted game playground (try games in browser)
- [ ] Monthly community challenges
- [ ] Integration with Discord/Slack

See the full [Roadmap](docs/ROADMAP.md) for details.

---

## ⭐ Star This Repo

If you find this project useful, please give it a ⭐ star! It helps others discover the platform.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <strong>Built with ❤️ for the open-source community</strong>
  <br>
  <sub>Every contribution matters. Start your journey today.</sub>
</p>
