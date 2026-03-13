import { execSync } from 'child_process';

const BASE = process.env.BASE_BRANCH || process.env.GITHUB_BASE_REF || 'main';
const forbidden = [
  'data/games.json',
  'data/contributors.json',
  'data/leaderboard.json',
];

try {
  console.log(`Fetching origin/${BASE}...`);
  execSync(`git fetch origin ${BASE}`, { stdio: 'inherit' });
  const diff = execSync(`git diff --name-only origin/${BASE}...HEAD`, { encoding: 'utf8' });
  const files = diff.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const matches = files.filter(f => forbidden.includes(f));
  if (matches.length > 0) {
    console.error('Detected changes to generated data files in this PR:');
    for (const m of matches) console.error(` - ${m}`);
    console.error('\nPlease remove these files from your branch. Generated data files are updated automatically on the main branch. See CONTRIBUTING.md for details.');
    process.exit(2);
  }
  console.log('No forbidden generated-file changes detected.');
  process.exit(0);
} catch (err: any) {
  console.error('Error while checking generated-file changes:', err?.message || err);
  process.exit(3);
}
