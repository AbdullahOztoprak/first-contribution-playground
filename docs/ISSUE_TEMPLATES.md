# Reusable Issue Templates

Use these when creating manual GitHub issues.

## Start Here

```markdown
## Welcome

New to open source? Start here.

## Best first steps

1. Pick an issue labeled `good first issue`.
2. Comment `I'd like to work on this`.
3. Wait for a maintainer to confirm or mark it as `claimed`.
4. Open a pull request and include `Closes #ISSUE_NUMBER`.

## Good first paths

- Translation: no local setup needed
- Docs improvement: no local setup needed
- CLI game: good for Python or JavaScript beginners
- Web game: good for HTML/CSS/JS beginners

## Need help?

Comment on the issue or open a Discussion. No question is too small.
```

## Game Idea

```markdown
## Goal

Build a small beginner-friendly game.

## Requirements

- Add the game under `games/<category>/<game-name>/`
- Include `README.md`
- Include `metadata.json`
- Keep the submission under 5 files and 500 lines
- Do not use external network requests
- Do not edit generated files under `data/`

## Acceptance Criteria

- The game runs locally
- The README explains how to play
- The metadata file is valid JSON
- The PR uses the game submission template

## Before You Start

Comment `I'd like to work on this`.
```

## Translation

```markdown
## Goal

Translate the README into <Language>.

## Files to edit

- `translations/README/README.<lang>.md`

## Acceptance Criteria

- Translation is complete
- Markdown formatting is preserved
- Links still work
- No machine-only translation without human review
- Generated files under `data/` are not edited

## Before You Start

Comment `I'd like to work on this`.
```
