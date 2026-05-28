# Architecture

First Contribution Playground is a static-first GitHub Pages project. The early version is designed to stay simple, cheap to host, and easy to maintain.

## Goals

- Keep the first contribution path small and understandable.
- Validate beginner-submitted code before review.
- Generate public site data from repository files.
- Avoid a database or custom backend until the project has real usage that needs it.

## Data Flow

```text
games/ and translations/
  -> pull request templates
  -> CI validation and security checks
  -> maintainer review
  -> merge to main
  -> scripts/build-data.ts
  -> data/games.json, data/contributors.json, data/leaderboard.json
  -> Astro static build
  -> GitHub Pages
```

Demo game authors such as `demo-contributor` are allowed in example metadata, but they are excluded from contributor and leaderboard rankings so public stats do not imply fake community activity.

## Main Pieces

| Area | Tooling | Why |
|---|---|---|
| Static site | Astro + TypeScript | Fast static pages, simple GitHub Pages deploy |
| Data layer | Generated JSON files | Easy to review, no database needed |
| Validation | TypeScript scripts + GitHub Actions | Gives contributors fast feedback |
| Contributions | Issue and PR templates | Keeps beginner tasks clear |
| Safety | Security scans and file limits | Reduces risk from submitted code |

## Generated Files

The site reads from generated JSON files:

- `data/games.json`
- `data/contributors.json`
- `data/leaderboard.json`

Contributors should not edit these directly. Source files under `games/`, `translations/`, docs, and workflow scripts are the reviewable inputs.

## Validation

The workflows check:

- game folder structure and metadata
- translation file placement and formatting expectations
- generated data file changes in PRs
- suspicious code patterns such as `eval`, `exec`, network calls, or unsafe file writes
- basic spam and abuse patterns

The goal is not full automation. The goal is to catch common mistakes early so maintainer review can stay focused and friendly.

## Trade-Offs

- Static JSON is simpler than a database, but it is not real-time.
- Manual review is slower than full auto-merge, but safer for beginner-submitted code.
- Small contribution limits reduce flexibility, but make first PRs easier to review.
- Demo games help explain the format, but they must be clearly marked and excluded from real stats.

## Current Limitations

- Community activity is still early-stage.
- Leaderboard data depends on merged game contributions and votes.
- Contributor profiles are intentionally simple.
- Repository topics and pinned issues still require some manual maintainer work in GitHub.

## Later Ideas

- Better issue discovery on the site
- Cleaner contributor profiles
- More starter games
- Improved leaderboard data
- Embeddable contributor badges
- Optional GitHub OAuth experiment if the project grows enough to need it
