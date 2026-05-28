# Case Study: First Contribution Playground

## Problem

Many beginner developers want to contribute to open source, but they do not know where to start. Real repositories can feel too large, too strict, or too confusing for a first pull request.

## Goal

Create a small, safe repository where first-time contributors can practice the real GitHub workflow: issues, branches, pull requests, CI checks, review, and merging.

## What I Built

- Beginner-friendly issue system
- Contribution and pull request templates
- Validation scripts for games and translations
- GitHub Actions workflows for CI, Pages deploys, generated data checks, and community guidance
- Astro-based static site
- Generated JSON data for games, contributors, and leaderboard pages
- Security limits for submitted beginner code

## Technical Decisions

- Astro for a fast static website that works well on GitHub Pages
- TypeScript for validation and data generation scripts
- GitHub Actions for repeatable CI and deployment
- JSON files as a simple data layer instead of a database
- Small contribution scopes to keep review manageable

## Trade-Offs

- Static data is simple and cheap, but not real-time.
- Manual review is slower, but safer for beginner-submitted code.
- Small task limits reduce flexibility, but make first PRs less scary.
- Demo games help explain the format, but must be clearly marked and excluded from real contributor stats.

## Current Limitations

- The project is still early-stage.
- Community activity is not large yet.
- Some GitHub repository settings, such as topics and pinned issues, still require manual maintenance.
- The leaderboard becomes more meaningful only after real game submissions and votes.

## What I Learned

- How to design contributor onboarding
- How to maintain a public repository
- How to balance automation with human review
- How to keep beginner contributions safer
- How to document trade-offs honestly instead of over-marketing a project
