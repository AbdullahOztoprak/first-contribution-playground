# 🗺️ Platform Roadmap

This document outlines the vision and future plans for Platform.

## Current Status: v1.0 — Foundation ✅

### Completed
- [x] Repository structure (games, translations, leaderboard)
- [x] Contribution guidelines and templates
- [x] Issue templates (game proposal, translation, bug, feature request)
- [x] PR templates (game submission, translation submission)
- [x] GitHub Actions automation (10 workflows)
- [x] Gamification system with weekly leaderboard
- [x] Security scanning and anti-abuse protection
- [x] Welcome bot and contributor guidance
- [x] Example game submissions (CLI + Web)
- [x] Beginner's guide and documentation

---

## Phase 2: Community Growth (Q2 2026)

### 🎯 Goals
- Reach 50+ game submissions
- Reach 10+ language translations
- Build an active community of 100+ contributors

### 📋 Tasks
- [ ] Add monthly challenge system (themed game jams)
- [ ] Create Discord/Slack community integration
- [ ] Build contributor profiles page (auto-generated from PRs)
- [ ] Add "good first issue" auto-labeling for easy tasks
- [ ] Create video tutorials for first-time contributors
- [ ] Add game categories: educational, multiplayer-local, retro
- [ ] Implement achievement/badge system in README
- [ ] Add automated game testing (run Python/JS games in CI)

---

## Phase 3: Web Platform (Q3 2026)

### 🎯 Goals
- Launch a web frontend where users can browse and play games
- Create an API layer for game metadata

### 📋 Tasks
- [ ] **API Development**
  - [ ] Build REST API serving game metadata from `metadata.json` files
  - [ ] Endpoint: `GET /api/games` — list all games with filters
  - [ ] Endpoint: `GET /api/games/:id` — single game details
  - [ ] Endpoint: `GET /api/leaderboard` — current rankings
  - [ ] Endpoint: `GET /api/contributors` — contributor stats

- [ ] **Frontend Development**
  - [ ] Next.js or Astro static site
  - [ ] Game catalog with search and filters
  - [ ] Game detail pages with embedded web games
  - [ ] Leaderboard visualization
  - [ ] Contributor profiles
  - [ ] Dark/light theme

- [ ] **Game Playground**
  - [ ] Embed web games in iframes (sandboxed)
  - [ ] Python CLI games via WebAssembly (Pyodide)
  - [ ] "Try in browser" button for each game

- [ ] **GitHub Integration**
  - [ ] Webhook to auto-rebuild site on PR merge
  - [ ] GitHub OAuth for user profiles
  - [ ] Link contributions to GitHub profiles

### 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   GitHub     │────▶│   GitHub     │────▶│   Static Site  │
│   Repository │     │   Actions    │     │   (Vercel/     │
│              │     │   (Build)    │     │    Netlify)    │
└─────────────┘     └──────────────┘     └────────────────┘
       │                                          │
       ▼                                          ▼
┌─────────────┐                          ┌────────────────┐
│  metadata/   │                          │   Web Game     │
│  JSON files  │─────────────────────────▶│   Playground   │
└─────────────┘                          │   (iframe)     │
                                          └────────────────┘
```

---

## Phase 4: Portfolio Platform (Q4 2026)

### 🎯 Goals
- Transform into a portfolio-ready platform for junior developers
- Verifiable contribution history

### 📋 Tasks
- [ ] **Contributor Dashboard**
  - [ ] Personal stats page (games, translations, votes received)
  - [ ] Contribution calendar (GitHub-style grid)
  - [ ] Shareable profile URL
  - [ ] Downloadable contribution certificate (PDF)

- [ ] **Skill Badges**
  - [ ] Auto-assign based on contribution types
  - [ ] "Python Game Developer", "Web Game Developer", "Translator" badges
  - [ ] Display on GitHub profile README (dynamic SVG)

- [ ] **Integration APIs**
  - [ ] Embeddable widget for personal portfolios
  - [ ] JSON API for contribution verification
  - [ ] LinkedIn-compatible achievement links

---

## Phase 5: Ecosystem (2027+)

### 🎯 Vision
- Become the go-to platform for junior developer open-source experience

### 📋 Ideas
- [ ] Partner with coding bootcamps and universities
- [ ] Create "Platform Certified Contributor" program
- [ ] Add mentorship matching (experienced ↔ junior)
- [ ] Multi-repo support (different project types)
- [ ] Sponsor/rewards program for top contributors
- [ ] AI-powered code review assistance for submissions
- [ ] Game ratings and comments system
- [ ] Annual "Platform Awards" for best contributions

---

## How to Suggest Changes to the Roadmap

1. Open a [Feature Request](https://github.com/AbdullahOztoprak/Platform/issues/new?template=feature-request.yml)
2. Or start a [Discussion](https://github.com/AbdullahOztoprak/Platform/discussions)
3. Community feedback shapes our priorities!

---

*This roadmap is a living document and will be updated as the project evolves.*
