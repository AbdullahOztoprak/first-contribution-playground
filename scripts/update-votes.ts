import fs from 'fs/promises';
import {
  DIFFICULTY_MULTIPLIERS,
  type GameIndex,
  type GameMetadata,
  type LeaderboardData,
  type LeaderboardEntry,
  type WeeklyLeaderboard,
} from '../data/schema.js';

type PullRequest = {
  number: number;
  merged_at: string | null;
  user?: {
    login?: string;
  };
};

type PullRequestFile = {
  filename: string;
  status?: string;
};

type Reaction = {
  content?: string;
  user?: {
    login?: string;
    type?: string;
  };
};

type VoteKey = 'thumbs_up' | 'rocket' | 'heart';
type VoteBreakdown = Record<VoteKey, number>;
type GameVote = VoteBreakdown & { total: number };
type VotesLeaderboardData = Partial<LeaderboardData>;
type GameSubmission = { prNumber: number; mergedAt: string };

const DEMO_AUTHORS = new Set(['demo-contributor', 'platform-bot']);

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!TOKEN) {
  console.error('GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const repoEnv = process.env.GITHUB_REPOSITORY;
let owner = 'AbdullahOztoprak';
let repo = 'first-contribution-playground';
if (repoEnv) {
  [owner, repo] = repoEnv.split('/');
}

const API = `https://api.github.com/repos/${owner}/${repo}`;

async function ghFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json, application/vnd.github.squirrel-girl-preview+json',
      'User-Agent': 'first-contribution-playground-update-votes-script',
    },
    ...init,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub API error ${res.status} ${res.statusText}: ${t}`);
  }
  return res.json() as Promise<T>;
}

async function fetchAllPulls() {
  const pulls: PullRequest[] = [];
  let page = 1;
  while (true) {
    const pageData = await ghFetch<PullRequest[]>(`/pulls?state=closed&per_page=100&page=${page}`);
    if (!pageData || pageData.length === 0) break;
    pulls.push(...pageData);
    page += 1;
  }
  return pulls;
}

async function fetchAllFiles(pullNumber: number) {
  const files: PullRequestFile[] = [];
  let page = 1;
  while (true) {
    const pageData = await ghFetch<PullRequestFile[]>(`/pulls/${pullNumber}/files?per_page=100&page=${page}`);
    if (!pageData || pageData.length === 0) break;
    files.push(...pageData);
    page += 1;
  }
  return files;
}

async function fetchAllReactions(issueNumber: number) {
  const reactions: Reaction[] = [];
  let page = 1;
  while (true) {
    const pageData = await ghFetch<Reaction[]>(`/issues/${issueNumber}/reactions?per_page=100&page=${page}`);
    if (!pageData || pageData.length === 0) break;
    reactions.push(...pageData);
    page += 1;
  }
  return reactions;
}

function mapReactionWeight(content: string): { key: VoteKey; weight: number } | null {
  switch (content) {
    case '+1':
      return { key: 'thumbs_up', weight: 1 };
    case 'rocket':
      return { key: 'rocket', weight: 2 };
    case 'heart':
      return { key: 'heart', weight: 3 };
    default:
      return null;
  }
}

function isDemoAuthor(username: string): boolean {
  return DEMO_AUTHORS.has(username.toLowerCase());
}

function getWeekStart(date: Date): Date {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  return start;
}

function getWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function buildHistory(
  existing: VotesLeaderboardData,
  currentWeekId: string,
  currentRange: string,
): WeeklyLeaderboard[] {
  const weeks = [existing.current_week, ...(existing.history || [])].filter(
    (week): week is WeeklyLeaderboard => Boolean(week),
  );
  const seenIds = new Set<string>();
  const seenRanges = new Set<string>([currentRange]);
  const history: WeeklyLeaderboard[] = [];

  for (const week of weeks) {
    const range = `${week.week_start || ''}:${week.week_end || ''}`;
    if (
      !week.week_id ||
      week.week_id === currentWeekId ||
      seenIds.has(week.week_id) ||
      (range !== ':' && seenRanges.has(range))
    ) continue;
    seenIds.add(week.week_id);
    if (range !== ':') seenRanges.add(range);
    history.push(week);
    if (history.length >= 12) break;
  }

  return history;
}

function toLeaderboardEntry(game: GameMetadata, rank: number): LeaderboardEntry {
  const multiplier = DIFFICULTY_MULTIPLIERS[game.difficulty];
  const votes = game.votes || 0;
  return {
    rank,
    username: game.author,
    avatar_url: `https://github.com/${game.author}.png`,
    game_id: game.id,
    game_name: game.name,
    difficulty: game.difficulty,
    votes,
    pr_number: game.pr_number || 0,
    difficulty_multiplier: multiplier,
    weighted_score: votes * multiplier,
  };
}

async function main() {
  console.log('Scanning merged PRs for game submissions...');
  const pulls = await fetchAllPulls();

  // Map each game to the PR that first added its metadata file. Reactions on
  // later maintenance PRs must not be counted as extra votes for the game.
  const gameVotes: Record<string, GameVote> = {};
  const gameSubmissions = new Map<string, GameSubmission>();

  for (const pr of pulls) {
    if (!pr.merged_at) continue;
    const files = await fetchAllFiles(pr.number);
    const gameIds = new Set<string>();
    for (const f of files) {
      if (typeof f.filename !== 'string') continue;
      if (!f.filename.startsWith('games/') || !f.filename.endsWith('/metadata.json')) continue;
      if (f.status !== 'added') continue;
      const parts = f.filename.split('/');
      if (parts.length === 4) {
        const id = `${parts[1]}/${parts[2]}`;
        gameIds.add(id);
        gameSubmissions.set(id, { prNumber: pr.number, mergedAt: pr.merged_at });
      }
    }

    if (gameIds.size === 0) continue;

    // fetch reactions on the PR (issues endpoint)
    const reactions = await fetchAllReactions(pr.number);

    // count
    const counts: VoteBreakdown = { thumbs_up: 0, rocket: 0, heart: 0 };
    for (const r of reactions) {
      if (!r || !r.content) continue;
      // Ignore bots and self-votes from the game author.
      if (r.user && r.user.type && r.user.type.toLowerCase() === 'bot') continue;
      if (r.user?.login && r.user.login === pr.user?.login) continue;
      const mapped = mapReactionWeight(r.content);
      if (!mapped) continue;
      counts[mapped.key] += 1;
    }

    const total = counts.thumbs_up + counts.rocket * 2 + counts.heart * 3;

    for (const id of gameIds) {
      gameVotes[id] = { ...counts, total };
    }
  }

  // Load existing data files
  const gamesRaw = await fs.readFile('data/games.json', 'utf8');
  const gamesData = JSON.parse(gamesRaw) as GameIndex;

  const leaderboardRaw = await fs.readFile('data/leaderboard.json', 'utf8');
  const leaderboardData = JSON.parse(leaderboardRaw) as VotesLeaderboardData;

  // Update games.json
  const games: GameMetadata[] = gamesData.games || [];
  for (const g of games) {
    const votes = gameVotes[g.id] || { thumbs_up: 0, rocket: 0, heart: 0, total: 0 };
    const submission = gameSubmissions.get(g.id);
    g.votes = votes.total;
    g.vote_breakdown = {
      thumbs_up: votes.thumbs_up,
      rocket: votes.rocket,
      heart: votes.heart,
    };
    if (submission) {
      g.pr_number = submission.prNumber;
      g.merged_at = submission.mergedAt;
    }
  }

  const allEntries = games
    .filter(game => !isDemoAuthor(game.author))
    .map(game => toLeaderboardEntry(game, 0))
    .sort((a, b) => b.weighted_score - a.weighted_score || a.game_name.localeCompare(b.game_name));
  allEntries.forEach((entry, index) => entry.rank = index + 1);

  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const weekId = getWeekId(now);
  const currentEntries = allEntries
    .filter(entry => {
      const mergedAt = gameSubmissions.get(entry.game_id)?.mergedAt;
      if (!mergedAt) return false;
      const mergedDate = new Date(mergedAt);
      return mergedDate >= weekStart && mergedDate < new Date(weekEnd.getTime() + 86400000);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const updatedLeaderboard: LeaderboardData = {
    version: 1,
    generated_at: now.toISOString(),
    current_week: {
      week_id: weekId,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      entries: currentEntries,
      total_votes: currentEntries.reduce((sum, entry) => sum + entry.votes, 0),
      total_games: currentEntries.length,
    },
    all_time_top: allEntries.slice(0, 10),
    history: buildHistory(
      leaderboardData,
      weekId,
      `${weekStart.toISOString().split('T')[0]}:${weekEnd.toISOString().split('T')[0]}`,
    ),
  };

  // write files back
  gamesData.generated_at = now.toISOString();

  await fs.writeFile('data/games.json', JSON.stringify(gamesData, null, 2) + '\n');
  await fs.writeFile('data/leaderboard.json', JSON.stringify(updatedLeaderboard, null, 2) + '\n');

  console.log('Updated votes for games:', Object.keys(gameVotes).length);
  console.log('Wrote data/games.json and data/leaderboard.json');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
