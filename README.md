<h1 align="center">First Contribution Playground</h1>
<p align="center">
  <strong>A small open-source playground that helps beginners make their first real pull request.</strong>
</p>
<p align="center">
  Start with a tiny docs fix, README translation, beginner game, or small UI improvement.
</p>
<p align="center">
  <a href="https://abdullahoztoprak.github.io/first-contribution-playground">Live Site</a> |
  <a href="https://github.com/AbdullahOztoprak/first-contribution-playground/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22">Good First Issues</a> |
  <a href="#choose-your-first-contribution">Choose a Path</a> |
  <a href="CONTRIBUTING.md">Contributing Guide</a>
</p>
<p align="center">
  <img src="https://img.shields.io/github/stars/AbdullahOztoprak/first-contribution-playground?style=flat-square" alt="Stars">
  <img src="https://img.shields.io/github/forks/AbdullahOztoprak/first-contribution-playground?style=flat-square" alt="Forks">
  <img src="https://img.shields.io/github/contributors/AbdullahOztoprak/first-contribution-playground?style=flat-square" alt="Contributors">
  <img src="https://img.shields.io/github/issues/AbdullahOztoprak/first-contribution-playground/good%20first%20issue?style=flat-square" alt="Good first issues">
</p>

---

## Project Status

- Early-stage project with active maintenance
- Beginner pull requests are welcome
- Translations, games, docs, and small website improvements are accepted
- Typical review time: 24-72 hours when maintainers are active
- Best first step: pick a `good first issue`

---

## What Is This?

**First Contribution Playground** is a beginner-friendly open-source repository for practicing the real GitHub workflow.

You can contribute by:

- Fixing a small typo or docs issue
- Translating documentation into your language
- Adding a small CLI, web, or algorithm game
- Improving docs and beginner guides
- Fixing small website or repository issues

The goal is not to be perfect. The goal is to learn the workflow: fork, branch, edit, commit, push, open a PR, get feedback, and merge.

---

## Why I Built This

Many junior developers want to contribute to open source, but most repositories feel too large or intimidating for a first PR.

I built this project to create a smaller, guided place where beginners can practice issues, branches, pull requests, CI checks, reviews, and merging without needing to understand a huge codebase first.

---

## Maintainer Highlights

This project is intentionally simple, but it includes the maintenance pieces a real open-source repository needs:

- Automated PR validation for games, translations, generated data, and security rules
- Beginner-friendly issue labels that GitHub can surface to first-time contributors
- GitHub Pages site generated from repository data
- Generated game, contributor, and leaderboard indexes
- Anti-abuse checks and friendly CI comments for new contributors
- Separate workflows for translation, game, label, and community onboarding tasks

---

## For Recruiters

This repository is not just a coding exercise. It is a small open-source maintenance project where I worked on:

- contributor onboarding and documentation
- GitHub issue and pull request workflow design
- automated validation with GitHub Actions
- static site generation with Astro and TypeScript
- generated JSON data for games, contributors, and leaderboards
- security limits for accepting beginner-submitted code

The project is intentionally small, but it shows how I think about developer experience, automation, maintainability, and trade-offs.

---

## Our Promise to Beginners

- No question is too small.
- You do not need to be perfect.
- We explain requested changes respectfully.
- We help you fix your first PR.
- Your contribution will be treated seriously.

---

## Choose Your First Contribution

| Path | Best for | Time | Start |
|---|---|---:|---|
| Translate README | No-code contributors | 10-20 min | [Translation issues](https://github.com/AbdullahOztoprak/first-contribution-playground/issues?q=is%3Aissue+is%3Aopen+label%3A%22%F0%9F%8C%8D+translation%22) |
| Improve docs | Writers and learners | 10-30 min | [Docs issues](https://github.com/AbdullahOztoprak/first-contribution-playground/issues?q=is%3Aissue+is%3Aopen+label%3A%22%F0%9F%93%9A+documentation%22) |
| Add a CLI game | Python or JavaScript beginners | 30-60 min | [Game guide](CONTRIBUTING.md#submitting-a-game) |
| Add a web game | HTML/CSS/JS beginners | 45-90 min | [Game guide](CONTRIBUTING.md#submitting-a-game) |
| Fix website UI | Frontend beginners | 30-90 min | [Open issues](https://github.com/AbdullahOztoprak/first-contribution-playground/issues) |

---

## No Local Setup Needed

For documentation and translation tasks, you can make your first PR from the GitHub website:

1. Open the file on GitHub.
2. Click the pencil icon.
3. Make your edit.
4. Click **Commit changes**.
5. Choose **Create a new branch**.
6. Open a pull request.

This is the easiest way to make a first contribution without installing Git locally.

---

## Before You Start an Issue

To avoid duplicate work:

1. Open the issue you want.
2. Comment: `I'd like to work on this`.
3. Wait for a maintainer to confirm or add the `claimed` label.
4. Open your PR and include `Closes #ISSUE_NUMBER` in the description.

Inactive claimed issues may be released after 7 days so another beginner can try them.

---

## Repository Structure

```text
first-contribution-playground/
├── games/
│   ├── cli/              # Terminal-based games
│   ├── web/              # Browser-based games
│   └── algorithm/        # Algorithm puzzles and challenges
├── translations/
│   ├── README/           # README translations
│   ├── CONTRIBUTING/     # Contributing guide translations
│   └── guides/           # Guide translations
├── data/                 # Generated data and schema
├── scripts/              # Build and validation scripts
├── web/                  # Astro website
├── docs/                 # Guides and architecture notes
└── .github/              # Templates and workflow automation
```

---

## Quick Start

### Submit a Translation

1. Pick an open [translation issue](https://github.com/AbdullahOztoprak/first-contribution-playground/issues?q=is%3Aissue+is%3Aopen+label%3A%22%F0%9F%8C%8D+translation%22).
2. Comment `I'd like to work on this`.
3. Create the requested file, for example `translations/README/README.es.md`.
4. Keep headings, links, lists, and code blocks intact.
5. Open a PR using the [translation template](.github/PULL_REQUEST_TEMPLATE/translation_submission.md).

### Submit a Game

1. Fork this repository.
2. Create a branch: `git checkout -b game/your-game-name`.
3. Add your game in `games/<category>/your-game-name/`.
4. Include:
   - `README.md` with how to play and what you learned
   - `metadata.json` with game info
   - Your source code
5. Open a PR using the [game template](.github/PULL_REQUEST_TEMPLATE/game_submission.md).

Game submissions should stay small: max 5 files and max 500 lines.

---

## Featured Games

| Game | Type | Author | Language | Difficulty |
|---|---|---|---|---|
| [Dice Roller](games/cli/dice-roller/) | CLI | @AbdullahOztoprak | Python | Beginner |
| [Number Guessing](games/cli/example-number-guessing/) | CLI | demo-contributor | Python | Beginner |
| [Rock Paper Scissors](games/web/example-rock-paper-scissors/) | Web | demo-contributor | HTML/CSS/JS | Beginner |

`demo-contributor` marks starter examples that show the expected submission format. Demo authors are not counted in real contributor or leaderboard stats.

Want to add your own? Start with the [game contribution guide](CONTRIBUTING.md#submitting-a-game).

---

## Example Pull Requests

- [Simplified Chinese README translation](https://github.com/AbdullahOztoprak/first-contribution-playground/pull/23)
- [CI and contributor workflow fixes](https://github.com/AbdullahOztoprak/first-contribution-playground/pull/30)
- [Dice Roller game contribution](games/cli/dice-roller/)

Use these as examples for PR size, file placement, and formatting.

---

## Contributor Journey

| Level | Goal |
|---|---|
| Level 1 | Make your first PR |
| Level 2 | Add a translation or docs improvement |
| Level 3 | Add a simple game |
| Level 4 | Review or help another contributor |
| Level 5 | Become a community helper |

---

## Leaderboard

<!-- LEADERBOARD:WEEKLY:START -->

*No game submissions this week. Be the first!*
<!-- LEADERBOARD:WEEKLY:END -->

<!-- LEADERBOARD:CONTRIBUTORS:START -->
### Top Contributors

| Rank | Contributor | Contributions |
|---|---|---:|
| 1 | [@AbdullahOztoprak](https://github.com/AbdullahOztoprak) | 8 |

<!-- LEADERBOARD:CONTRIBUTORS:END -->

Community members can vote on game PRs with 👍 reactions.

---

## Available Translations

| Language | README |
|---|---|
| English | ✅ |
| Simplified Chinese | ✅ |
| Turkish | [Help wanted](https://github.com/AbdullahOztoprak/first-contribution-playground/issues/25) |
| Spanish | [Help wanted](https://github.com/AbdullahOztoprak/first-contribution-playground/issues/26) |
| German | [Help wanted](https://github.com/AbdullahOztoprak/first-contribution-playground/issues/27) |
| French | [Help wanted](https://github.com/AbdullahOztoprak/first-contribution-playground/issues/28) |
| Arabic | [Help wanted](https://github.com/AbdullahOztoprak/first-contribution-playground/issues/29) |

More translation tasks are available in [open issues](https://github.com/AbdullahOztoprak/first-contribution-playground/issues?q=is%3Aissue+is%3Aopen+label%3A%22%F0%9F%8C%8D+translation%22).

---

## Documentation

- [Contributing Guide](CONTRIBUTING.md)
- [Beginner's Guide](docs/BEGINNER_GUIDE.md)
- [Translation Guide](docs/TRANSLATION_GUIDE.md)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Roadmap](docs/ROADMAP.md)
- [Maintenance Policy](docs/MAINTENANCE.md)
- [Case Study](docs/CASE_STUDY.md)
- [Community Growth Plan](docs/COMMUNITY_GROWTH.md)
- [Reusable Issue Templates](docs/ISSUE_TEMPLATES.md)

---

## Generated Data Files

Do not edit these files in contribution branches:

- `data/games.json`
- `data/contributors.json`
- `data/leaderboard.json`

They are generated from source files. If you run `npm run build:data` locally, preview the result but do not commit generated JSON changes.

---

## Community

- Ask questions in [Discussions](https://github.com/AbdullahOztoprak/first-contribution-playground/discussions)
- Report bugs with [issue templates](https://github.com/AbdullahOztoprak/first-contribution-playground/issues/new/choose)
- Pick a small task from [good first issues](https://github.com/AbdullahOztoprak/first-contribution-playground/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

---

## License

This project is licensed under the [MIT License](LICENSE).

<p align="center">
  <strong>Every contribution matters. Start small, learn the workflow, and grow from there.</strong>
</p>
