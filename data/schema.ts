/**
 * Platform Data Schema
 * TypeScript interfaces for all platform data structures
 * Used by both build scripts and web frontend
 */

// ============================================================
// GAME SCHEMA
// ============================================================

export interface GameMetadata {
  id: string;                    // Unique: category/folder-name
  name: string;
  author: string;                // GitHub username
  category: 'cli' | 'web' | 'algorithm';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  version: string;
  description: string;
  tags: string[];
  created_at: string;            // ISO date
  entry_point: string;
  // Computed fields (added at build time)
  path?: string;
  pr_number?: number;
  merged_at?: string;
  votes?: number;
  vote_breakdown?: {
    thumbs_up: number;
    rocket: number;
    fire: number;
  };
  play_url?: string;             // For web games
}

export interface GameIndex {
  version: number;
  generated_at: string;
  total_games: number;
  by_category: {
    cli: number;
    web: number;
    algorithm: number;
  };
  by_difficulty: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  games: GameMetadata[];
}

// ============================================================
// CONTRIBUTOR SCHEMA
// ============================================================

export interface ContributorStats {
  username: string;
  avatar_url: string;
  profile_url: string;
  // Contribution counts
  total_contributions: number;
  games_submitted: number;
  translations_submitted: number;
  issues_opened: number;
  reviews_given: number;
  // Gamification
  xp: number;
  level: number;
  rank: number;
  badges: Badge[];
  // Votes
  votes_received: number;
  votes_given: number;
  // Timestamps
  first_contribution: string;
  last_contribution: string;
  // Game list
  games: string[];               // Game IDs
}

export interface ContributorIndex {
  version: number;
  generated_at: string;
  total_contributors: number;
  contributors: ContributorStats[];
}

// ============================================================
// BADGE SCHEMA
// ============================================================

export type BadgeId = 
  | 'first-contribution'
  | 'game-master-5'
  | 'game-master-10'
  | 'translation-champion'
  | 'weekly-champion'
  | 'streak-4'
  | 'streak-12'
  | 'vote-magnet-50'
  | 'vote-magnet-100'
  | 'helpful-reviewer'
  | 'bug-hunter'
  | 'early-adopter'
  | 'challenge-winner';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;                 // Emoji or icon name
  earned_at: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const BADGE_DEFINITIONS: Record<BadgeId, Omit<Badge, 'earned_at'>> = {
  'first-contribution': {
    id: 'first-contribution',
    name: 'First Steps',
    description: 'Made your first contribution',
    icon: '🎉',
    rarity: 'common',
  },
  'game-master-5': {
    id: 'game-master-5',
    name: 'Game Developer',
    description: 'Submitted 5 games',
    icon: '🎮',
    rarity: 'rare',
  },
  'game-master-10': {
    id: 'game-master-10',
    name: 'Game Master',
    description: 'Submitted 10 games',
    icon: '👑',
    rarity: 'epic',
  },
  'translation-champion': {
    id: 'translation-champion',
    name: 'Polyglot',
    description: 'Contributed 3+ translations',
    icon: '🌍',
    rarity: 'rare',
  },
  'weekly-champion': {
    id: 'weekly-champion',
    name: 'Weekly Champion',
    description: 'Reached #1 on weekly leaderboard',
    icon: '🏆',
    rarity: 'epic',
  },
  'streak-4': {
    id: 'streak-4',
    name: 'On Fire',
    description: 'Contributed 4 weeks in a row',
    icon: '🔥',
    rarity: 'rare',
  },
  'streak-12': {
    id: 'streak-12',
    name: 'Unstoppable',
    description: 'Contributed 12 weeks in a row',
    icon: '⚡',
    rarity: 'legendary',
  },
  'vote-magnet-50': {
    id: 'vote-magnet-50',
    name: 'Popular',
    description: 'Received 50+ total votes',
    icon: '⭐',
    rarity: 'rare',
  },
  'vote-magnet-100': {
    id: 'vote-magnet-100',
    name: 'Community Favorite',
    description: 'Received 100+ total votes',
    icon: '💎',
    rarity: 'legendary',
  },
  'helpful-reviewer': {
    id: 'helpful-reviewer',
    name: 'Mentor',
    description: 'Gave 10+ helpful PR reviews',
    icon: '🧑‍🏫',
    rarity: 'rare',
  },
  'bug-hunter': {
    id: 'bug-hunter',
    name: 'Bug Hunter',
    description: 'Found and reported a significant bug',
    icon: '🐛',
    rarity: 'rare',
  },
  'early-adopter': {
    id: 'early-adopter',
    name: 'Pioneer',
    description: 'Joined in the first month',
    icon: '🚀',
    rarity: 'epic',
  },
  'challenge-winner': {
    id: 'challenge-winner',
    name: 'Challenge Victor',
    description: 'Won a monthly challenge',
    icon: '🎯',
    rarity: 'epic',
  },
};

// ============================================================
// LEADERBOARD SCHEMA
// ============================================================

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar_url: string;
  game_id: string;
  game_name: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  votes: number;
  pr_number: number;
  difficulty_multiplier: number;
  weighted_score: number;
}

export interface WeeklyLeaderboard {
  week_id: string;              // YYYY-WW format
  week_start: string;
  week_end: string;
  entries: LeaderboardEntry[];
  total_votes: number;
  total_games: number;
}

export interface LeaderboardData {
  version: number;
  generated_at: string;
  current_week: WeeklyLeaderboard;
  all_time_top: LeaderboardEntry[];
  history: WeeklyLeaderboard[];  // Last 12 weeks
}

// ============================================================
// CHALLENGE SCHEMA
// ============================================================

export interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  rules: string[];
  prizes: string[];
  submissions: string[];        // Game IDs
  winner?: string;              // Game ID
}

export interface ChallengeIndex {
  version: number;
  generated_at: string;
  current_challenge?: Challenge;
  upcoming: Challenge[];
  past: Challenge[];
}

// ============================================================
// GAMIFICATION CONSTANTS
// ============================================================

export const XP_REWARDS = {
  game_submitted: 100,
  game_merged: 50,
  translation_merged: 30,
  vote_received: 5,
  review_given: 20,
  issue_opened: 10,
  challenge_participation: 50,
  challenge_win: 200,
} as const;

export const DIFFICULTY_MULTIPLIERS = {
  beginner: 1.0,
  intermediate: 1.5,
  advanced: 2.0,
} as const;

export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2500,   // Level 7
  4000,   // Level 8
  6000,   // Level 9
  10000,  // Level 10
] as const;

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}
