# 📖 Beginner's Guide to Contributing

Welcome! If this is your **first time contributing to open source**, this guide will walk you through everything step by step.

## Table of Contents

1. [What You'll Need](#what-youll-need)
2. [Understanding Git & GitHub](#understanding-git--github)
3. [Step-by-Step: Your First Game Submission](#step-by-step-your-first-game-submission)
4. [Step-by-Step: Your First Translation](#step-by-step-your-first-translation)
5. [Understanding the Review Process](#understanding-the-review-process)
6. [Common Mistakes & How to Avoid Them](#common-mistakes--how-to-avoid-them)
7. [Glossary](#glossary)

---

## What You'll Need

- A **GitHub account** (free) — [Sign up here](https://github.com/join)
- **Git** installed on your computer — [Download here](https://git-scm.com/downloads)
- A **text editor** (we recommend [VS Code](https://code.visualstudio.com/))
- Basic knowledge of at least one programming language (Python or JavaScript recommended)

---

## Understanding Git & GitHub

### Key Concepts

| Term | Meaning |
|------|---------|
| **Repository (repo)** | A project folder hosted on GitHub |
| **Fork** | Your personal copy of someone else's repo |
| **Clone** | Downloading a repo to your computer |
| **Branch** | A separate version of the code for your changes |
| **Commit** | Saving your changes with a message |
| **Push** | Uploading your commits to GitHub |
| **Pull Request (PR)** | Asking the original repo to accept your changes |
| **Merge** | When your changes are accepted into the original repo |

### The Contribution Flow

```
1. Fork the repo → Your copy on GitHub
2. Clone to your computer → Local copy
3. Create a branch → Isolated workspace
4. Make changes → Write your code
5. Commit → Save with a message
6. Push → Upload to your fork
7. Open a PR → Request to merge
8. Review → Maintainers check your code
9. Merge → Your code is in the project! 🎉
```

---

## Step-by-Step: Your First Game Submission

### Step 1: Fork the Repository

1. Go to [Platform repository](https://github.com/AbdullahOztoprak/Platform)
2. Click the **Fork** button (top right)
3. This creates a copy under your account

### Step 2: Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/Platform.git
cd Platform
```

### Step 3: Create a Branch

```bash
git checkout -b game/my-awesome-game
```

### Step 4: Create Your Game

Create a new folder for your game:

```bash
mkdir -p games/cli/my-awesome-game
cd games/cli/my-awesome-game
```

Create these files:

**game.py** (your game code):
```python
"""
My Awesome Game
Author: @your-username
"""

def play():
    print("Welcome to My Awesome Game!")
    # Your game logic here

if __name__ == "__main__":
    play()
```

**metadata.json** (game info):
```json
{
  "name": "My Awesome Game",
  "author": "your-username",
  "category": "cli",
  "difficulty": "beginner",
  "language": "python",
  "version": "1.0.0",
  "description": "A short description of my game",
  "tags": ["beginner", "python", "cli"],
  "created_at": "2026-02-28",
  "entry_point": "game.py"
}
```

**README.md** (description):
```markdown
# My Awesome Game

**Author:** @your-username
**Category:** CLI Game
**Difficulty:** Beginner

## Description
A brief description of your game.

## How to Play
\`\`\`bash
python game.py
\`\`\`

## What I Learned
- Thing 1
- Thing 2
```

### Step 5: Commit Your Changes

```bash
git add .
git commit -m "Add my awesome game"
```

### Step 6: Push to Your Fork

```bash
git push origin game/my-awesome-game
```

### Step 7: Open a Pull Request

1. Go to your fork on GitHub
2. Click **"Compare & pull request"**
3. Select the **Game Submission** template
4. Fill out all fields and checkboxes
5. Click **"Create pull request"**

### Step 8: Wait for Review

- 🤖 Automated checks will run (validation, lint, security)
- 👤 A maintainer will review your code
- 💬 You might get feedback — that's normal and good!
- ✅ Once approved, your game gets merged!

---

## Step-by-Step: Your First Translation

### Step 1-3: Same as Above

Fork, clone, and create a branch:

```bash
git checkout -b translation/es
```

### Step 4: Create Your Translation

```bash
# Find the file to translate and create the translated version
cp README.md translations/README/README.es.md
```

Edit the file and translate all content to your language.

### Step 5-7: Same as Above

Commit, push, and open a PR using the **Translation** template.

### Step 8: Auto-Merge!

Translation PRs can be **automatically merged** if all checks pass!

---

## Understanding the Review Process

### What Automated Checks Do

1. **PR Triage** — Detects if your PR is a game or translation and adds labels
2. **Validation** — Checks your files, structure, and metadata
3. **Lint** — Checks code style and syntax
4. **Security** — Scans for dangerous code patterns
5. **Anti-Spam** — Prevents abuse

### Review Timeline

- **Translations**: Minutes (auto-merge if checks pass)
- **Games**: 1-3 days (requires human review)

### If You Get Feedback

1. Read the feedback carefully
2. Make the requested changes locally
3. Commit and push the changes
4. The PR updates automatically — no need to create a new one!

```bash
# Make your fixes, then:
git add .
git commit -m "Address review feedback"
git push origin your-branch-name
```

---

## Common Mistakes & How to Avoid Them

| Mistake | Solution |
|---------|----------|
| Forgetting `metadata.json` | Always include it — copy the template from CONTRIBUTING.md |
| Wrong folder structure | Check: `games/<category>/your-game-name/` |
| Too many files (> 5) | Keep it simple! One main file + README + metadata |
| Using network requests | Not allowed — games must work offline |
| Not filling out PR template | All checkboxes must be checked |
| Pushing to `main` branch | Always create a new branch first |
| Machine-only translation | Must be human-reviewed, not just Google Translate |

---

## Glossary

| Term | Definition |
|------|-----------|
| **CI/CD** | Continuous Integration / Continuous Deployment — automated testing and deployment |
| **Lint** | Automated code style checking |
| **Merge conflict** | When your changes overlap with someone else's |
| **Upstream** | The original repository you forked from |
| **Origin** | Your fork on GitHub |
| **HEAD** | The latest commit on your current branch |
| **Squash merge** | Combining all your commits into one when merging |

---

## Need Help?

- 💬 Open a [Discussion](https://github.com/AbdullahOztoprak/Platform/discussions)
- 📖 Read the [Contributing Guide](../CONTRIBUTING.md)
- 🐛 Found a bug? [Report it](https://github.com/AbdullahOztoprak/Platform/issues/new?template=bug-report.yml)

**You've got this! 🚀**
