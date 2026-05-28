#!/usr/bin/env tsx
/**
 * Community setup helper.
 *
 * Usage:
 *   GITHUB_TOKEN=... npm run community:setup
 *
 * The token needs Issues read/write and repository metadata access.
 * The script is idempotent: it skips labels and issues that already exist.
 */

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const repository = process.env.GITHUB_REPOSITORY || 'AbdullahOztoprak/first-contribution-playground';

if (!token) {
  console.error('GITHUB_TOKEN or GH_TOKEN is required.');
  process.exit(1);
}

const api = `https://api.github.com/repos/${repository}`;

type GitHubLabel = {
  name: string;
};

type GitHubIssue = {
  number: number;
  title: string;
  html_url: string;
  pull_request?: unknown;
};

type LabelSpec = {
  name: string;
  color: string;
  description: string;
};

type IssueSpec = {
  title: string;
  labels: string[];
  body: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'first-contribution-playground-community-setup',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${response.status} ${JSON.stringify(data)}`);
  }

  return data as T;
}

const labels: LabelSpec[] = [
  { name: 'available', color: '0e8a16', description: 'Ready to be claimed' },
  { name: 'claimed', color: 'fbca04', description: 'Someone is working on this' },
  { name: 'no-code', color: 'bfdadc', description: 'Can be completed without writing code' },
  { name: '10-minute-task', color: 'c5def5', description: 'Very small beginner task' },
  { name: '30-minute-task', color: 'c2e0c6', description: 'Small beginner task' },
  { name: '1-hour-task', color: 'fef2c0', description: 'Beginner task that may need more time' },
  { name: 'needs-local-setup', color: 'd4c5f9', description: 'Requires running the project locally' },
  { name: 'ready-to-review', color: '0e8a16', description: 'Ready for maintainer review' },
  { name: 'needs-changes', color: 'e11d48', description: 'Needs contributor changes' },
  { name: 'web', color: '1d76db', description: 'Browser-based game or website task' },
  { name: 'algorithm', color: 'fbca04', description: 'Algorithm or puzzle game' },
  { name: 'python', color: '3572A5', description: 'Python task' },
  { name: 'javascript', color: 'f1e05a', description: 'JavaScript task' },
];

function gameIssue(title: string, category: string, timeLabel: string, body: string): IssueSpec {
  return {
    title,
    labels: ['good first issue', '🎮 game', '🟢 beginner-friendly', 'available', timeLabel, 'needs-local-setup'],
    body: `${body}

## Requirements

- Add the game under \`games/${category}/<game-name>/\`
- Include \`README.md\`
- Include \`metadata.json\`
- Keep the submission under 5 files and 500 lines
- Do not use external network requests
- Do not edit generated files under \`data/\`

## Acceptance Criteria

- The game runs locally
- The README explains how to play
- The metadata file is valid JSON
- The PR uses the game submission template

## Before You Start

Comment \`I'd like to work on this\`.
`,
  };
}

const issues: IssueSpec[] = [
  {
    title: 'Start here: make your first contribution',
    labels: ['good first issue', '🟢 beginner-friendly', 'available', 'no-code', '10-minute-task'],
    body: `## Welcome

New to open source? Start here.

## Best first steps

1. Pick an issue labeled \`good first issue\`.
2. Comment \`I'd like to work on this\`.
3. Wait for a maintainer to confirm or mark it as \`claimed\`.
4. Open a pull request and include \`Closes #ISSUE_NUMBER\`.

## Good first paths

- Translation: no local setup needed
- Docs improvement: no local setup needed
- CLI game: good for Python or JavaScript beginners
- Web game: good for HTML/CSS/JS beginners

## Need help?

Comment on the issue or open a Discussion. No question is too small.
`,
  },
  gameIssue(
    '🎮 Add a Tic-Tac-Toe CLI game',
    'cli',
    '1-hour-task',
    '## Goal\n\nBuild a small command-line Tic-Tac-Toe game.'
  ),
  gameIssue(
    '🎮 Add a Hangman CLI game',
    'cli',
    '1-hour-task',
    '## Goal\n\nBuild a beginner-friendly command-line Hangman game.'
  ),
  gameIssue(
    '🎮 Add a Memory Card web game',
    'web',
    '1-hour-task',
    '## Goal\n\nBuild a simple browser-based memory card matching game.'
  ),
  gameIssue(
    '🎮 Add a Quiz CLI game',
    'cli',
    '30-minute-task',
    '## Goal\n\nBuild a command-line quiz game with a small set of questions.'
  ),
  gameIssue(
    '🎮 Add a Word Scramble game',
    'cli',
    '30-minute-task',
    '## Goal\n\nBuild a small game where players unscramble words.'
  ),
  gameIssue(
    '🎮 Add a Typing Speed web game',
    'web',
    '1-hour-task',
    '## Goal\n\nBuild a browser-based typing speed challenge.'
  ),
  gameIssue(
    '🎮 Improve Rock Paper Scissors scoring',
    'web',
    '30-minute-task',
    '## Goal\n\nImprove the existing Rock Paper Scissors game with clearer score tracking or round history.'
  ),
  gameIssue(
    '🎮 Add a Minesweeper-lite web game',
    'web',
    '1-hour-task',
    '## Goal\n\nBuild a small beginner-friendly Minesweeper-inspired game.'
  ),
  gameIssue(
    '🎮 Add difficulty modes to Number Guessing',
    'cli',
    '30-minute-task',
    '## Goal\n\nImprove the existing Number Guessing game with easy, medium, and hard modes.'
  ),
  gameIssue(
    '🎮 Add a Calculator Challenge game',
    'cli',
    '30-minute-task',
    '## Goal\n\nBuild a small math challenge game where players solve timed arithmetic questions.'
  ),
  {
    title: '📚 Improve README translation instructions',
    labels: ['good first issue', '📚 documentation', '🟢 beginner-friendly', 'available', 'no-code', '10-minute-task'],
    body: `## Goal

Make the translation instructions clearer for first-time contributors.

## Acceptance Criteria

- Explain where translation files should go
- Mention that generated files under \`data/\` should not be edited
- Keep the tone beginner-friendly

## Before You Start

Comment \`I'd like to work on this\`.
`,
  },
  {
    title: '📚 Add a short FAQ for first-time contributors',
    labels: ['good first issue', '📚 documentation', '🟢 beginner-friendly', 'available', 'no-code', '30-minute-task'],
    body: `## Goal

Add a small FAQ section for first-time contributors.

## Suggested Questions

- What if my CI check fails?
- Can I contribute from the GitHub website?
- How do I claim an issue?
- What files should I avoid editing?

## Before You Start

Comment \`I'd like to work on this\`.
`,
  },
];

async function ensureLabels() {
  const existing = await request<GitHubLabel[]>('/labels?per_page=100');
  const existingNames = new Set(existing.map(label => label.name));

  for (const label of labels) {
    if (existingNames.has(label.name)) {
      console.log(`label exists: ${label.name}`);
      continue;
    }

    await request('/labels', {
      method: 'POST',
      body: JSON.stringify(label),
    });
    console.log(`created label: ${label.name}`);
  }
}

async function ensureIssues() {
  const existing = await request<GitHubIssue[]>('/issues?state=all&per_page=100');
  const existingTitles = new Set(
    existing
      .filter(issue => !issue.pull_request)
      .map(issue => issue.title.toLowerCase())
  );

  for (const issue of issues) {
    if (existingTitles.has(issue.title.toLowerCase())) {
      console.log(`issue exists: ${issue.title}`);
      continue;
    }

    const created = await request<GitHubIssue>('/issues', {
      method: 'POST',
      body: JSON.stringify(issue),
    });
    console.log(`created issue #${created.number}: ${created.title}`);
  }
}

async function improveExistingTranslationIssues() {
  const existing = await request<GitHubIssue[]>('/issues?state=open&per_page=100');
  const translationIssues = existing.filter(issue =>
    !issue.pull_request &&
    issue.title.startsWith('🌍 Add README translation:')
  );

  const note = `## Acceptance Criteria

- Translation is complete
- Markdown formatting is preserved
- Links still work
- No machine-only translation without human review
- Generated files under \`data/\` are not edited

## Before You Start

Comment \`I'd like to work on this\` so a maintainer can mark the issue as claimed.
`;

  for (const issue of translationIssues) {
    const details = await request<GitHubIssue & { body?: string }>(`/issues/${issue.number}`);
    const body = details.body || '';
    if (body.includes('## Acceptance Criteria') && body.includes("I'd like to work on this")) {
      console.log(`translation issue already polished: #${issue.number}`);
      continue;
    }

    await request(`/issues/${issue.number}`, {
      method: 'PATCH',
      body: JSON.stringify({
        body: `${body.trim()}\n\n---\n\n${note}`,
      }),
    });
    console.log(`updated translation issue body: #${issue.number}`);
  }
}

async function updateTopics() {
  const topics = [
    'good-first-issue',
    'first-contribution',
    'beginner-friendly',
    'open-source',
    'contributions-welcome',
    'github-actions',
    'games',
    'translations',
    'javascript',
    'python',
    'astro',
    'typescript',
  ];

  try {
    await request('/topics', {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github.mercy-preview+json',
      },
      body: JSON.stringify({ names: topics }),
    });
    console.log('updated repository topics');
  } catch (error) {
    console.warn(`could not update topics: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  await ensureLabels();
  await ensureIssues();
  await improveExistingTranslationIssues();
  await updateTopics();
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
