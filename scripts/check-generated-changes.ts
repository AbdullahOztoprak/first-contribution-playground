import { execSync } from 'child_process';

const BASE = process.env.BASE_BRANCH || process.env.GITHUB_BASE_REF || 'main';
const TOKEN = process.env.GITHUB_TOKEN;
const REPOSITORY = process.env.GITHUB_REPOSITORY;
const PR_NUMBER = process.env.PR_NUMBER;
// treat any file under data/ as generated
const forbiddenPrefix = 'data/';

async function getFilesFromPullRequest(): Promise<string[] | null> {
  if (!TOKEN || !REPOSITORY || !PR_NUMBER) return null;

  const [owner, repo] = REPOSITORY.split('/');
  if (!owner || !repo) return null;

  const files: string[] = [];
  let page = 1;

  while (true) {
    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/pulls/${PR_NUMBER}/files`);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'check-generated-changes',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub API error ${response.status}: ${text}`);
    }

    const pageData = (await response.json()) as Array<{ filename?: string }>;
    if (pageData.length === 0) break;

    files.push(
      ...pageData
        .map(file => file.filename)
        .filter((filename): filename is string => Boolean(filename))
    );
    page += 1;
  }

  return files;
}

function getFilesFromGitDiff(): string[] {
  console.log(`Fetching origin/${BASE}...`);
  execSync(`git fetch origin ${BASE}`, { stdio: 'inherit' });
  const diff = execSync(`git diff --name-only origin/${BASE}...HEAD`, { encoding: 'utf8' });
  return diff.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

async function main() {
  const files = await getFilesFromPullRequest() ?? getFilesFromGitDiff();
  console.log(`Checking ${files.length} changed file(s) for generated data changes.`);

  const matches = files.filter(f => f.startsWith(forbiddenPrefix));
  if (matches.length > 0) {
    console.error('Detected changes to generated data files in this PR:');
    for (const m of matches) console.error(` - ${m}`);
    console.error('\nGenerated data files must not be committed. Run `npm run build:data` locally or let CI regenerate them on `main`.');
    process.exit(2);
  }
  console.log('No forbidden generated-file changes detected.');
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Error while checking generated-file changes:', message);
  process.exit(3);
});
