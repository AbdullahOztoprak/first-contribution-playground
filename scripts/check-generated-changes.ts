import { execSync } from 'child_process';

const BASE = process.env.BASE_BRANCH || process.env.GITHUB_BASE_REF || 'main';
// treat any file under data/ as generated
const forbiddenPrefix = 'data/';

try {
  console.log(`Fetching origin/${BASE}...`);
  execSync(`git fetch origin ${BASE}`, { stdio: 'inherit' });
  const diff = execSync(`git diff --name-only origin/${BASE}...HEAD`, { encoding: 'utf8' });
  const files = diff.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const matches = files.filter(f => f.startsWith(forbiddenPrefix));
  if (matches.length > 0) {
    console.error('Detected changes to generated data files in this PR:');
    for (const m of matches) console.error(` - ${m}`);
    console.error('\nGenerated data files must not be committed. Run `npm run build:data` locally or let CI regenerate them on `main`.');
    process.exit(2);
  }
  console.log('No forbidden generated-file changes detected.');
  process.exit(0);
} catch (err: any) {
  console.error('Error while checking generated-file changes:', err?.message || err);
  process.exit(3);
}
