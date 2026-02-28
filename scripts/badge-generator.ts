/**
 * SVG Badge Generator for Contributors
 * 
 * Generates dynamic SVG badges that can be embedded in GitHub profiles/READMEs
 * 
 * Usage: /api/badge/[username].svg
 */

interface BadgeConfig {
  username: string;
  level: number;
  xp: number;
  games: number;
  badges: number;
}

export function generateBadgeSVG(config: BadgeConfig): string {
  const { username, level, xp, games, badges } = config;
  
  // Level colors
  const levelColors: Record<number, string> = {
    1: '#6b7280',
    2: '#22c55e',
    3: '#3b82f6',
    4: '#a855f7',
    5: '#eab308',
  };
  
  const levelNames: Record<number, string> = {
    1: 'Newcomer',
    2: 'Contributor',
    3: 'Regular',
    4: 'Expert',
    5: 'Master',
  };
  
  const levelColor = levelColors[Math.min(level, 5)] || levelColors[1];
  const levelName = levelNames[Math.min(level, 5)] || levelNames[1];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="350" height="120" viewBox="0 0 350 120">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1b26" />
      <stop offset="100%" style="stop-color:#24283b" />
    </linearGradient>
    <linearGradient id="levelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${levelColor}" />
      <stop offset="100%" style="stop-color:${levelColor}dd" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="350" height="120" rx="10" fill="url(#bgGrad)" stroke="#30363d" stroke-width="1"/>
  
  <!-- Logo -->
  <circle cx="35" cy="60" r="22" fill="url(#levelGrad)"/>
  <text x="35" y="66" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">L${level}</text>
  
  <!-- Username & Level -->
  <text x="70" y="35" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#e6edf3">@${username}</text>
  <text x="70" y="52" font-family="system-ui, sans-serif" font-size="11" fill="${levelColor}">${levelName}</text>
  
  <!-- Stats -->
  <g transform="translate(70, 70)">
    <text font-family="system-ui, sans-serif" font-size="11" fill="#8b949e">
      <tspan x="0">🎮 ${games} games</tspan>
      <tspan x="80">✨ ${xp.toLocaleString()} XP</tspan>
      <tspan x="160">🏅 ${badges} badges</tspan>
    </text>
  </g>
  
  <!-- Progress bar -->
  <rect x="70" y="92" width="260" height="6" rx="3" fill="#30363d"/>
  <rect x="70" y="92" width="${Math.min(260, (xp / 1000) * 260)}" height="6" rx="3" fill="${levelColor}"/>
  
  <!-- Platform branding -->
  <text x="330" y="110" font-family="system-ui, sans-serif" font-size="8" fill="#484f58" text-anchor="end">Platform</text>
</svg>`;
}

// Example endpoint handler for Astro API routes
export async function GET({ params }: { params: { username: string } }) {
  const { username } = params;
  
  // In production, this would fetch from the contributors.json
  // For now, return a placeholder
  const config: BadgeConfig = {
    username,
    level: 1,
    xp: 0,
    games: 0,
    badges: 0,
  };
  
  // Try to load real data
  try {
    const data = await import('../data/contributors.json') as any;
    const contributors = data.default?.contributors || data.contributors || [];
    const contributor = contributors.find((c: any) => c.username === username);
    if (contributor) {
      config.level = contributor.level || 1;
      config.xp = contributor.xp || 0;
      config.games = contributor.games_submitted || 0;
      config.badges = contributor.badges?.length || 0;
    }
  } catch (e) {
    // Use defaults
  }
  
  return new Response(generateBadgeSVG(config), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
