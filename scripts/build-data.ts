#!/usr/bin/env tsx
/**
 * Build Data Index
 * 
 * This script scans the repository and generates:
 * - data/games.json — All game metadata indexed
 * - data/contributors.json — All contributor stats
 * - data/leaderboard.json — Current and historical rankings
 * 
 * Run: npx tsx scripts/build-data.ts
 * Or:  npm run build:data
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  GameMetadata,
  GameIndex,
  ContributorStats,
  ContributorIndex,
  LeaderboardData,
  LeaderboardEntry,
  WeeklyLeaderboard,
  Badge,
  BadgeId,
  BADGE_DEFINITIONS,
  XP_REWARDS,
  DIFFICULTY_MULTIPLIERS,
  calculateLevel,
} from '../data/schema.js';

const ROOT = path.resolve(__dirname, '..');
const GAMES_DIR = path.join(ROOT, 'games');
const DATA_DIR = path.join(ROOT, 'data');

function loadExistingGames(): Map<string, Partial<GameMetadata>> {
  const existing = new Map<string, Partial<GameMetadata>>();
  const existingPath = path.join(DATA_DIR, 'games.json');
  if (!fs.existsSync(existingPath)) return existing;
  try {
    const raw = fs.readFileSync(existingPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const list = parsed?.games || [];
    for (const g of list) {
      if (g?.id) existing.set(g.id, g);
    }
  } catch (e) {
    console.warn('⚠️ Could not read existing games.json; votes will be reset');
  }
  return existing;
}

// ============================================================
// GAME INDEXING
// ============================================================

function scanGames(): GameMetadata[] {
  const games: GameMetadata[] = [];
  const categories = ['cli', 'web', 'algorithm'] as const;
  const existingGames = loadExistingGames();

  for (const category of categories) {
    const categoryPath = path.join(GAMES_DIR, category);
    if (!fs.existsSync(categoryPath)) continue;

    const folders = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter((d: fs.Dirent) => d.isDirectory() && !d.name.startsWith('.'));

    for (const folder of folders) {
      const gamePath = path.join(categoryPath, folder.name);
      const metadataPath = path.join(gamePath, 'metadata.json');

      if (!fs.existsSync(metadataPath)) {
        console.warn(`⚠️ Missing metadata.json: ${gamePath}`);
        continue;
      }

      try {
        const raw = fs.readFileSync(metadataPath, 'utf-8');
        const metadata = JSON.parse(raw) as Partial<GameMetadata>;

        const existing = existingGames.get(`${category}/${folder.name}`) || {};
        const game: GameMetadata = {
          id: `${category}/${folder.name}`,
          name: metadata.name || folder.name,
          author: metadata.author || 'unknown',
          category: category,
          difficulty: metadata.difficulty || 'beginner',
          language: metadata.language || 'unknown',
          version: metadata.version || '1.0.0',
          description: metadata.description || '',
          tags: metadata.tags || [],
          created_at: metadata.created_at || new Date().toISOString().split('T')[0],
          entry_point: metadata.entry_point || 'index.html',
          path: `games/${category}/${folder.name}`,
          votes: existing.votes || 0,
          vote_breakdown: existing.vote_breakdown || { thumbs_up: 0, rocket: 0, fire: 0 },
          pr_number: existing.pr_number,
          merged_at: existing.merged_at,
        };

        // Generate play URL for web games
        if (category === 'web') {
          game.play_url = `/play/${category}/${folder.name}`;
        }

        games.push(game);
      } catch (e) {
        console.error(`❌ Error parsing ${metadataPath}:`, e);
      }
    }
  }

  return games;
}

function buildGameIndex(games: GameMetadata[]): GameIndex {
  const index: GameIndex = {
    version: 1,
    generated_at: new Date().toISOString(),
    total_games: games.length,
    by_category: {
      cli: games.filter(g => g.category === 'cli').length,
      web: games.filter(g => g.category === 'web').length,
      algorithm: games.filter(g => g.category === 'algorithm').length,
    },
    by_difficulty: {
      beginner: games.filter(g => g.difficulty === 'beginner').length,
      intermediate: games.filter(g => g.difficulty === 'intermediate').length,
      advanced: games.filter(g => g.difficulty === 'advanced').length,
    },
    games: games.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  };

  return index;
}

// ============================================================
// CONTRIBUTOR INDEXING
// ============================================================

function buildContributorIndex(games: GameMetadata[]): ContributorIndex {
  const contributorMap = new Map<string, ContributorStats>();

  // Aggregate from games
  for (const game of games) {
    const username = game.author;
    if (!contributorMap.has(username)) {
      contributorMap.set(username, createEmptyContributor(username));
    }

    const contributor = contributorMap.get(username)!;
    contributor.games_submitted++;
    contributor.total_contributions++;
    contributor.games.push(game.id);
    contributor.xp += XP_REWARDS.game_submitted;

    // Update timestamps
    if (!contributor.first_contribution || game.created_at < contributor.first_contribution) {
      contributor.first_contribution = game.created_at;
    }
    if (!contributor.last_contribution || game.created_at > contributor.last_contribution) {
      contributor.last_contribution = game.created_at;
    }
  }

  // Calculate levels and assign badges
  const contributors = Array.from(contributorMap.values()).map(c => {
    c.level = calculateLevel(c.xp);
    c.badges = calculateBadges(c);
    return c;
  });

  // Sort by XP and assign ranks
  contributors.sort((a, b) => b.xp - a.xp);
  contributors.forEach((c, i) => c.rank = i + 1);

  return {
    version: 1,
    generated_at: new Date().toISOString(),
    total_contributors: contributors.length,
    contributors,
  };
}

function createEmptyContributor(username: string): ContributorStats {
  return {
    username,
    avatar_url: `https://github.com/${username}.png`,
    profile_url: `https://github.com/${username}`,
    total_contributions: 0,
    games_submitted: 0,
    translations_submitted: 0,
    issues_opened: 0,
    reviews_given: 0,
    xp: 0,
    level: 1,
    rank: 0,
    badges: [],
    votes_received: 0,
    votes_given: 0,
    first_contribution: '',
    last_contribution: '',
    games: [],
  };
}

function calculateBadges(contributor: ContributorStats): Badge[] {
  const badges: Badge[] = [];
  const now = new Date().toISOString();

  // First contribution
  if (contributor.total_contributions >= 1) {
    badges.push({ ...BADGE_DEFINITIONS['first-contribution'], earned_at: contributor.first_contribution });
  }

  // Game milestones
  if (contributor.games_submitted >= 5) {
    badges.push({ ...BADGE_DEFINITIONS['game-master-5'], earned_at: now });
  }
  if (contributor.games_submitted >= 10) {
    badges.push({ ...BADGE_DEFINITIONS['game-master-10'], earned_at: now });
  }

  // Translation milestones
  if (contributor.translations_submitted >= 3) {
    badges.push({ ...BADGE_DEFINITIONS['translation-champion'], earned_at: now });
  }

  // Vote milestones
  if (contributor.votes_received >= 50) {
    badges.push({ ...BADGE_DEFINITIONS['vote-magnet-50'], earned_at: now });
  }
  if (contributor.votes_received >= 100) {
    badges.push({ ...BADGE_DEFINITIONS['vote-magnet-100'], earned_at: now });
  }

  return badges;
}

// ============================================================
// LEADERBOARD BUILDING
// ============================================================

function buildLeaderboard(games: GameMetadata[]): LeaderboardData {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  const weekId = getWeekId(now);

  // Load existing leaderboard to preserve history
  let existingData: LeaderboardData | null = null;
  const leaderboardPath = path.join(DATA_DIR, 'leaderboard.json');
  if (fs.existsSync(leaderboardPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(leaderboardPath, 'utf-8'));
    } catch {}
  }

  // Build current week entries (votes come from GitHub Actions workflow)
  const entries: LeaderboardEntry[] = games
    .filter(g => g.votes && g.votes > 0)
    .map((g, i) => ({
      rank: 0,
      username: g.author,
      avatar_url: `https://github.com/${g.author}.png`,
      game_id: g.id,
      game_name: g.name,
      difficulty: g.difficulty,
      votes: g.votes || 0,
      pr_number: g.pr_number || 0,
      difficulty_multiplier: DIFFICULTY_MULTIPLIERS[g.difficulty],
      weighted_score: (g.votes || 0) * DIFFICULTY_MULTIPLIERS[g.difficulty],
    }))
    .sort((a, b) => b.weighted_score - a.weighted_score);

  // Assign ranks
  entries.forEach((e, i) => e.rank = i + 1);

  const currentWeek: WeeklyLeaderboard = {
    week_id: weekId,
    week_start: weekStart,
    week_end: weekEnd,
    entries: entries.slice(0, 10),
    total_votes: entries.reduce((sum, e) => sum + e.votes, 0),
    total_games: entries.length,
  };

  // Build all-time top 10
  const allTimeTop = [...entries].slice(0, 10);

  // Preserve history
  let history: WeeklyLeaderboard[] = existingData?.history || [];
  if (history.length > 0 && history[0].week_id !== weekId) {
    history = [existingData!.current_week, ...history].slice(0, 12);
  }

  return {
    version: 1,
    generated_at: now.toISOString(),
    current_week: currentWeek,
    all_time_top: allTimeTop,
    history,
  };
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getWeekEnd(date: Date): string {
  const d = new Date(getWeekStart(date));
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

function getWeekId(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const week = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  console.log('🔨 Building Platform data index...\n');

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Scan and index games
  console.log('📂 Scanning games...');
  const games = scanGames();
  console.log(`   Found ${games.length} games\n`);

  // Build game index
  console.log('🎮 Building game index...');
  const gameIndex = buildGameIndex(games);
  fs.writeFileSync(
    path.join(DATA_DIR, 'games.json'),
    JSON.stringify(gameIndex, null, 2)
  );
  console.log('   ✅ data/games.json\n');

  // Build contributor index
  console.log('👥 Building contributor index...');
  const contributorIndex = buildContributorIndex(games);
  fs.writeFileSync(
    path.join(DATA_DIR, 'contributors.json'),
    JSON.stringify(contributorIndex, null, 2)
  );
  console.log('   ✅ data/contributors.json\n');

  // Build leaderboard
  console.log('🏆 Building leaderboard...');
  const leaderboard = buildLeaderboard(games);
  fs.writeFileSync(
    path.join(DATA_DIR, 'leaderboard.json'),
    JSON.stringify(leaderboard, null, 2)
  );
  console.log('   ✅ data/leaderboard.json\n');

  console.log('✨ Data build complete!');
  console.log(`   Games: ${gameIndex.total_games}`);
  console.log(`   Contributors: ${contributorIndex.total_contributors}`);
  console.log(`   Generated: ${new Date().toISOString()}`);
}

main().catch(console.error);
