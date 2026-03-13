import fs from 'fs/promises';

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!TOKEN) {
  console.error('GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const repoEnv = process.env.GITHUB_REPOSITORY;
let owner = 'AbdullahOztoprak';
let repo = 'Platform';
if (repoEnv) {
  [owner, repo] = repoEnv.split('/');
}

const API = `https://api.github.com/repos/${owner}/${repo}`;

async function ghFetch(path: string, init: any = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json, application/vnd.github.squirrel-girl-preview+json',
      'User-Agent': 'platform-update-votes-script',
    },
    ...init,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub API error ${res.status} ${res.statusText}: ${t}`);
  }
  return res.json();
}

async function fetchAllPulls() {
  const pulls: any[] = [];
  let page = 1;
  while (true) {
    const pageData = await ghFetch(`/pulls?state=closed&per_page=100&page=${page}`);
    if (!pageData || pageData.length === 0) break;
    pulls.push(...pageData);
    page += 1;
  }
  return pulls;
}

async function fetchAllFiles(pullNumber: number) {
  const files: any[] = [];
  let page = 1;
  while (true) {
    const pageData = await ghFetch(`/pulls/${pullNumber}/files?per_page=100&page=${page}`);
    if (!pageData || pageData.length === 0) break;
    files.push(...pageData);
    page += 1;
  }
  return files;
}

async function fetchAllReactions(issueNumber: number) {
  const reactions: any[] = [];
  let page = 1;
  while (true) {
    const pageData = await ghFetch(`/issues/${issueNumber}/reactions?per_page=100&page=${page}`);
    if (!pageData || pageData.length === 0) break;
    reactions.push(...pageData);
    page += 1;
  }
  return reactions;
}

function mapReactionWeight(content: string) {
  switch (content) {
    case 'thumbs_up':
      return { key: 'thumbs_up', weight: 1 };
    case 'rocket':
      return { key: 'rocket', weight: 2 };
    case 'fire':
      return { key: 'fire', weight: 3 };
    default:
      return null;
  }
}

async function main() {
  console.log('Scanning merged PRs for game submissions...');
  const pulls = await fetchAllPulls();

  // Map gameId -> aggregated counts
  const gameVotes: Record<string, { thumbs_up: number; rocket: number; fire: number; total: number }> = {};

  for (const pr of pulls) {
    if (!pr.merged_at) continue;
    // Fetch files changed in this PR and detect games/
    const files = await fetchAllFiles(pr.number);
    const gameIds = new Set<string>();
    for (const f of files) {
      if (typeof f.filename !== 'string') continue;
      if (!f.filename.startsWith('games/')) continue;
      const parts = f.filename.split('/');
      if (parts.length >= 3) {
        const id = `${parts[1]}/${parts[2]}`;
        gameIds.add(id);
      }
    }

    if (gameIds.size === 0) continue;

    // fetch reactions on the PR (issues endpoint)
    const reactions = await fetchAllReactions(pr.number);

    // count
    const counts = { thumbs_up: 0, rocket: 0, fire: 0 };
    for (const r of reactions) {
      if (!r || !r.content) continue;
      // ignore bots
      if (r.user && r.user.type && r.user.type.toLowerCase() === 'bot') continue;
      const mapped = mapReactionWeight(r.content);
      if (!mapped) continue;
      counts[mapped.key] += 1;
    }

    const total = counts.thumbs_up * 1 + counts.rocket * 2 + counts.fire * 3;

    for (const id of gameIds) {
      if (!gameVotes[id]) gameVotes[id] = { thumbs_up: 0, rocket: 0, fire: 0, total: 0 };
      gameVotes[id].thumbs_up += counts.thumbs_up;
      gameVotes[id].rocket += counts.rocket;
      gameVotes[id].fire += counts.fire;
      gameVotes[id].total += total;
    }
  }

  // Load existing data files
  const gamesRaw = await fs.readFile('data/games.json', 'utf8');
  const gamesData = JSON.parse(gamesRaw);

  const leaderboardRaw = await fs.readFile('data/leaderboard.json', 'utf8');
  const leaderboardData = JSON.parse(leaderboardRaw);

  // Update games.json
  const games = gamesData.games || [];
  for (const g of games) {
    const id = g.id;
    const v = gameVotes[id];
    if (v) {
      g.votes = v.total;
      g.vote_breakdown = {
        thumbs_up: v.thumbs_up,
        rocket: v.rocket,
        fire: v.fire,
      };
    } else {
      g.votes = g.votes || 0;
      g.vote_breakdown = g.vote_breakdown || { thumbs_up: 0, rocket: 0, fire: 0 };
    }
  }

  // Update leaderboard: simple aggregation for current_week
  const entries = games.map(g => ({ id: g.id, name: g.name, author: g.author, votes: g.votes || 0 }))
    .sort((a, b) => (b.votes || 0) - (a.votes || 0));

  const totalVotes = entries.reduce((s, e) => s + (e.votes || 0), 0);
  const totalGames = entries.filter(e => (e.votes || 0) > 0).length;

  leaderboardData.current_week = leaderboardData.current_week || {};
  leaderboardData.current_week.entries = entries;
  leaderboardData.current_week.total_votes = totalVotes;
  leaderboardData.current_week.total_games = totalGames;

  // update all_time_top
  leaderboardData.all_time_top = entries.slice(0, 10);

  // write files back
  gamesData.generated_at = new Date().toISOString();
  leaderboardData.generated_at = new Date().toISOString();

  await fs.writeFile('data/games.json', JSON.stringify(gamesData, null, 2) + '\n');
  await fs.writeFile('data/leaderboard.json', JSON.stringify(leaderboardData, null, 2) + '\n');

  console.log('Updated votes for games:', Object.keys(gameVotes).length);
  console.log('Wrote data/games.json and data/leaderboard.json');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
