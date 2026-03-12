# GitHub Integration Security Architecture

> **⚠️ NOT BUILT YET — This is a design document for a potential future feature.**  
> Nothing described below exists in the current codebase.

> OAuth & PR Pipeline for Browser IDE  
> Design Exploration Document

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Part 1: OAuth Flow (Secure)](#part-1-oauth-flow-secure)
3. [Part 2: PR Creation Pipeline](#part-2-pr-creation-pipeline)
4. [Part 3: Security Hardening](#part-3-security-hardening)
5. [Part 4: Backend Structure](#part-4-backend-structure)
6. [Part 5: Scalability & Rate Limits](#part-5-scalability--rate-limits)
7. [Part 6: Implementation](#part-6-implementation)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    TRUST BOUNDARY                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                              BROWSER (UNTRUSTED)                              │   │
│  │                                                                               │   │
│  │    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │   │
│  │    │   Monaco    │    │   Preview   │    │   Submit    │                     │   │
│  │    │   Editor    │    │   Panel     │    │   Button    │                     │   │
│  │    └──────┬──────┘    └─────────────┘    └──────┬──────┘                     │   │
│  │           │                                      │                            │   │
│  │           │ files[]                              │ files[], metadata          │   │
│  │           └──────────────────┬───────────────────┘                            │   │
│  │                              │                                                │   │
│  │                              │ ⚠️ NEVER: access_token, user secrets          │   │
│  │                              │ ✅ ONLY: file contents, metadata               │   │
│  │                              │                                                │   │
│  └──────────────────────────────┼────────────────────────────────────────────────┘   │
│                                 │                                                    │
│ ════════════════════════════════╪════════════════════════════════════════════════════│
│                                 │ HTTPS + CSRF Token                                 │
│ ════════════════════════════════╪════════════════════════════════════════════════════│
│                                 │                                                    │
│  ┌──────────────────────────────┼────────────────────────────────────────────────┐   │
│  │                              ▼                                                │   │
│  │                     VERCEL EDGE (TRUSTED)                                     │   │
│  │                                                                               │   │
│  │    ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │    │                        MIDDLEWARE                                    │   │   │
│  │    │  • CSRF validation                                                   │   │   │
│  │    │  • Rate limit (Upstash Redis)                                       │   │   │
│  │    │  • Session validation                                               │   │   │
│  │    │  • Request sanitization                                             │   │   │
│  │    └──────────────────────────────┬──────────────────────────────────────┘   │   │
│  │                                   │                                          │   │
│  │    ┌──────────────────────────────┼──────────────────────────────────────┐   │   │
│  │    │                              ▼                                      │   │   │
│  │    │                     API ROUTES (SERVER-ONLY)                        │   │   │
│  │    │                                                                     │   │   │
│  │    │   /api/auth/*          NextAuth handlers                            │   │   │
│  │    │   /api/github/fork     Fork creation                                │   │   │
│  │    │   /api/github/submit   PR pipeline                                  │   │   │
│  │    │                                                                     │   │   │
│  │    │   ┌─────────────────────────────────────────────────────────────┐   │   │   │
│  │    │   │               SESSION STORE (Encrypted)                     │   │   │   │
│  │    │   │                                                             │   │   │   │
│  │    │   │   access_token: encrypted in JWT or httpOnly cookie         │   │   │   │
│  │    │   │   user_id: from GitHub                                      │   │   │   │
│  │    │   │   expires_at: token expiry                                  │   │   │   │
│  │    │   │                                                             │   │   │   │
│  │    │   │   ⚠️ NEVER exposed to browser JavaScript                   │   │   │   │
│  │    │   └─────────────────────────────────────────────────────────────┘   │   │   │
│  │    └─────────────────────────────────────────────────────────────────────┘   │   │
│  │                                   │                                          │   │
│  └───────────────────────────────────┼──────────────────────────────────────────┘   │
│                                      │                                              │
└──────────────────────────────────────┼──────────────────────────────────────────────┘
                                       │
                                       │ User's access_token (Bearer)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              GITHUB API (EXTERNAL)                                   │
│                                                                                      │
│   Rate Limits:                                                                       │
│   • 5,000 requests/hour per user token                                              │
│   • 60 requests/hour unauthenticated                                                │
│                                                                                      │
│   Endpoints Used:                                                                    │
│   • POST /repos/{owner}/{repo}/forks                                                │
│   • GET  /repos/{owner}/{repo}                                                      │
│   • POST /repos/{owner}/{repo}/git/refs                                             │
│   • POST /repos/{owner}/{repo}/git/blobs                                            │
│   • POST /repos/{owner}/{repo}/git/trees                                            │
│   • POST /repos/{owner}/{repo}/git/commits                                          │
│   • PATCH /repos/{owner}/{repo}/git/refs/{ref}                                      │
│   • POST /repos/{owner}/{repo}/pulls                                                │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: OAuth Flow (Secure)

### 1.1 GitHub OAuth App vs GitHub App

| Aspect | OAuth App | GitHub App |
|--------|-----------|------------|
| **Authentication** | User-level token | Installation token + user token |
| **Rate Limits** | 5,000/hour per user | 5,000/hour per installation × users |
| **Scope Control** | Coarse (`public_repo`) | Fine-grained (per-repo) |
| **Token Lifetime** | Until revoked | 1 hour (refreshable) |
| **Setup Complexity** | Low | Medium |
| **Webhook Support** | Manual | Built-in |
| **Org Permissions** | User grants | Admin approves installation |

**Decision: Start with OAuth App**

Rationale:
1. Simpler initial setup
2. Direct user attribution (PRs show user as author)
3. No installation approval needed
4. Easier to debug
5. Migrate to GitHub App when hitting 2,000+ DAU

**Migration trigger:** When rate limits become the bottleneck OR when you need fine-grained repository permissions.

### 1.2 OAuth Security Risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Token Leakage** | Token exposed in logs, errors, frontend | Never log tokens; httpOnly cookies |
| **CSRF Attack** | Attacker initiates OAuth flow | State parameter validation |
| **Session Fixation** | Attacker fixes session before login | Regenerate session on login |
| **Replay Attack** | Reusing authorization code | Codes are single-use (GitHub enforces) |
| **Scope Escalation** | Requesting more perms than needed | Hardcode minimal scopes |
| **Token in URL** | Code in URL visible to referrer | POST callback, short-lived codes |
| **Compromised Client Secret** | Secret exposed in frontend | Server-only, env vars |

### 1.3 Minimal Scopes

```
public_repo    # Read/write public repos (required for fork + PR)
read:user      # Read user profile (username, avatar)
user:email     # Read email (commit author)
```

**Why NOT `repo`:** Grants access to private repositories. Principle of least privilege — we only need public repo access.

**Why NOT `write:org`:** We don't create org resources. Fork goes to user's account.

### 1.4 Token Storage Strategy

**Option A: Encrypted JWT (Recommended for Vercel)**

```typescript
// Tokens stored in encrypted JWT, sent as httpOnly cookie
// Pros: Stateless, scales infinitely
// Cons: Cannot revoke individual sessions without blocklist

Session Cookie:
  Name: __Secure-next-auth.session-token
  Flags: httpOnly, Secure, SameSite=Lax
  Content: Encrypted JWT containing { access_token, user_id, expires_at }
```

**Option B: Server-Side Session (Alternative)**

```typescript
// Token stored in Redis, session ID in cookie
// Pros: Can revoke immediately, smaller cookie
// Cons: Requires Redis, adds latency
```

**Recommendation:** Encrypted JWT for MVP (Vercel Edge-compatible), migrate to Redis sessions if revocation becomes critical.

### 1.5 NextAuth Configuration

```typescript
// lib/auth.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

// Encryption key for JWT (32 bytes, base64)
// Generate: openssl rand -base64 32
const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET!;

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          // CRITICAL: Minimal scopes only
          scope: 'public_repo read:user user:email',
        },
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign-in: store access token
      if (account && profile) {
        token.accessToken = account.access_token;
        token.userId = (profile as any).id;
        token.username = (profile as any).login;
        token.tokenExpiresAt = account.expires_at 
          ? account.expires_at * 1000 
          : Date.now() + 365 * 24 * 60 * 60 * 1000; // OAuth tokens don't expire by default
      }
      return token;
    },
    
    async session({ session, token }) {
      // CRITICAL: Never expose access token to frontend
      // Only expose non-sensitive user info
      session.user.id = token.userId as string;
      session.user.username = token.username as string;
      // session.accessToken = token.accessToken; // ❌ NEVER DO THIS
      return session;
    },
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      },
    },
  },
  
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  
  events: {
    async signIn({ user, account }) {
      // Log sign-in for audit (without sensitive data)
      console.log(`[AUTH] Sign-in: user=${user.id} provider=${account?.provider}`);
    },
    async signOut({ token }) {
      console.log(`[AUTH] Sign-out: user=${token.userId}`);
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
};

// Type augmentation for session
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    userId: string;
    username: string;
    tokenExpiresAt: number;
  }
}
```

### 1.6 Server-Only Token Access

```typescript
// lib/github-token.ts
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';
import { authOptions } from './auth';

/**
 * Get GitHub access token from session.
 * ONLY callable from server-side code (API routes, server components).
 * NEVER import this in client components.
 */
export async function getGitHubToken(): Promise<string | null> {
  // Method 1: From JWT token directly (faster)
  const token = await getToken({
    req: {
      cookies: Object.fromEntries(
        cookies().getAll().map((c) => [c.name, c.value])
      ),
    } as any,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  if (!token?.accessToken) {
    return null;
  }
  
  // Check expiry (if applicable)
  if (token.tokenExpiresAt && Date.now() > token.tokenExpiresAt) {
    console.warn('[AUTH] Token expired');
    return null;
  }
  
  return token.accessToken;
}

/**
 * Get user info from session.
 * Safe to use anywhere.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
```

### 1.7 CSRF Protection

NextAuth handles CSRF automatically via:
1. **State parameter** in OAuth flow (validated on callback)
2. **CSRF token** in forms (for signIn/signOut)
3. **SameSite=Lax** cookies (prevents cross-origin requests)

Additional hardening:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Verify origin for mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // In production, origin must match host
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        `https://${host}`,
        'https://platform.dev', // Your domain
      ];
      
      if (origin && !allowedOrigins.includes(origin)) {
        console.warn(`[SECURITY] Origin mismatch: ${origin} vs ${host}`);
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 1.8 Token Revocation

**If token is compromised:**

1. User can revoke from GitHub Settings → Applications → Authorized OAuth Apps
2. Programmatically via GitHub API (limited):

```typescript
// Cannot revoke user tokens programmatically with OAuth App
// Only GitHub Apps can revoke installation tokens

// Best defense: Short session lifetime + session blocklist
async function blockSession(userId: string) {
  // Add to Redis blocklist
  await redis.sadd('blocked-sessions', userId);
  await redis.expire('blocked-sessions', 7 * 24 * 60 * 60);
}

async function isSessionBlocked(userId: string): Promise<boolean> {
  return redis.sismember('blocked-sessions', userId);
}
```

### 1.9 Environment Variables

```bash
# .env.local (development)
# .env.production.local (production - NEVER commit)

# NextAuth Core
NEXTAUTH_URL=https://platform.dev
NEXTAUTH_SECRET=<openssl rand -base64 32>

# GitHub OAuth App
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Upstream Repository
GITHUB_UPSTREAM_OWNER=AbdullahOztoprak
GITHUB_UPSTREAM_REPO=Platform

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxx

# Optional: Sentry for error tracking
SENTRY_DSN=https://xxx@sentry.io/xxx
```

**Vercel Configuration:**
- Add all secrets via Vercel Dashboard → Settings → Environment Variables
- Use "Sensitive" flag for `GITHUB_CLIENT_SECRET` and `NEXTAUTH_SECRET`
- Set different values for Preview vs Production

### 1.10 Callback URL Configuration

In GitHub OAuth App settings:
```
Authorization callback URL: https://platform.dev/api/auth/callback/github
```

**For Vercel Preview Deployments:**
```
https://*.vercel.app/api/auth/callback/github
```
Note: GitHub only allows one callback URL per OAuth App. For previews, either:
1. Create separate OAuth App for development
2. Use local tunnel (ngrok) during development
3. Don't test OAuth in preview (test locally only)

---

## Part 2: PR Creation Pipeline

### 2.1 Why Fork-Based Workflow

**Direct Push (Rejected):**
```
User → Push to main repo
```
Problems:
- Requires write access to main repo
- If token compromised, attacker can push anything
- No review gate
- Cannot revoke per-user

**Fork-Based (Approved):**
```
User → Fork → Branch → Commit → PR to upstream
```
Benefits:
- User only writes to their fork
- Upstream requires maintainer approval
- Each user isolated
- Can block abusive users via GitHub

### 2.2 Complete PR Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PR CREATION PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  STEP 1: Check Fork Exists                                                       │
│  ─────────────────────────                                                       │
│  GET /repos/{username}/{repo}                                                    │
│  ├─ 200: Fork exists → continue                                                  │
│  └─ 404: Fork not found → create fork                                           │
│                                                                                  │
│  STEP 2: Create Fork (if needed)                                                 │
│  ──────────────────────────────                                                  │
│  POST /repos/{upstream_owner}/{upstream_repo}/forks                              │
│  Response: { full_name, default_branch }                                         │
│  ⚠️ Fork creation is async! Poll until ready.                                   │
│                                                                                  │
│  STEP 3: Sync Fork with Upstream                                                 │
│  ─────────────────────────────                                                   │
│  POST /repos/{username}/{repo}/merge-upstream                                    │
│  { branch: "main" }                                                              │
│  └─ Ensures fork is up-to-date before branching                                 │
│                                                                                  │
│  STEP 4: Get Base Commit SHA                                                     │
│  ───────────────────────────                                                     │
│  GET /repos/{username}/{repo}/git/ref/heads/main                                 │
│  Response: { object: { sha } }                                                   │
│                                                                                  │
│  STEP 5: Create Branch                                                           │
│  ─────────────────────                                                           │
│  POST /repos/{username}/{repo}/git/refs                                          │
│  { ref: "refs/heads/{branch_name}", sha: {base_sha} }                           │
│                                                                                  │
│  STEP 6: Create Blobs (for each file)                                            │
│  ────────────────────────────────────                                            │
│  POST /repos/{username}/{repo}/git/blobs                                         │
│  { content: base64, encoding: "base64" }                                         │
│  Response: { sha }                                                               │
│  ⚠️ Parallelize for performance                                                 │
│                                                                                  │
│  STEP 7: Create Tree                                                             │
│  ─────────────────                                                               │
│  POST /repos/{username}/{repo}/git/trees                                         │
│  { base_tree: {base_sha}, tree: [{ path, mode, type, sha }] }                   │
│  Response: { sha }                                                               │
│                                                                                  │
│  STEP 8: Create Commit                                                           │
│  ────────────────────                                                            │
│  POST /repos/{username}/{repo}/git/commits                                       │
│  { message, tree: {tree_sha}, parents: [{base_sha}] }                           │
│  Response: { sha }                                                               │
│                                                                                  │
│  STEP 9: Update Branch Reference                                                 │
│  ───────────────────────────────                                                 │
│  PATCH /repos/{username}/{repo}/git/refs/heads/{branch_name}                     │
│  { sha: {commit_sha}, force: false }                                            │
│                                                                                  │
│  STEP 10: Create Pull Request                                                    │
│  ────────────────────────────                                                    │
│  POST /repos/{upstream_owner}/{upstream_repo}/pulls                              │
│  { title, body, head: "{username}:{branch}", base: "main" }                     │
│  Response: { number, html_url }                                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 API Implementation

```typescript
// lib/github/client.ts
import { Octokit } from '@octokit/rest';

const UPSTREAM_OWNER = process.env.GITHUB_UPSTREAM_OWNER!;
const UPSTREAM_REPO = process.env.GITHUB_UPSTREAM_REPO!;

export function createOctokit(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
    userAgent: 'platform-ide/1.0',
    timeZone: 'UTC',
    log: {
      debug: () => {},
      info: () => {},
      warn: console.warn,
      error: console.error,
    },
  });
}

// lib/github/fork.ts
interface ForkResult {
  exists: boolean;
  created: boolean;
  fullName: string;
}

export async function ensureForkExists(
  octokit: Octokit,
  username: string
): Promise<ForkResult> {
  // Step 1: Check if fork exists
  try {
    const { data: repo } = await octokit.repos.get({
      owner: username,
      repo: UPSTREAM_REPO,
    });
    
    // Verify it's actually a fork of our repo
    if (repo.fork && repo.parent?.full_name === `${UPSTREAM_OWNER}/${UPSTREAM_REPO}`) {
      return { exists: true, created: false, fullName: repo.full_name };
    }
    
    // User has a repo with same name but it's not a fork
    throw new Error(`Repository ${username}/${UPSTREAM_REPO} exists but is not a fork`);
  } catch (error: any) {
    if (error.status !== 404) throw error;
  }
  
  // Step 2: Create fork
  const { data: fork } = await octokit.repos.createFork({
    owner: UPSTREAM_OWNER,
    repo: UPSTREAM_REPO,
  });
  
  // Step 3: Wait for fork to be ready (async operation)
  await waitForFork(octokit, username, UPSTREAM_REPO);
  
  return { exists: false, created: true, fullName: fork.full_name };
}

async function waitForFork(
  octokit: Octokit,
  owner: string,
  repo: string,
  maxAttempts = 10,
  delayMs = 2000
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await octokit.repos.get({ owner, repo });
      return; // Fork is ready
    } catch (error: any) {
      if (error.status !== 404) throw error;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Fork creation timed out');
}
```

```typescript
// lib/github/pr.ts
import { Octokit } from '@octokit/rest';
import { createHash } from 'crypto';

interface FileToCommit {
  path: string;      // e.g., "games/cli/my-game/main.py"
  content: string;   // file content
}

interface PRCreationParams {
  files: FileToCommit[];
  gameName: string;
  category: 'cli' | 'web' | 'algorithm';
  description: string;
  username: string;
}

interface PRCreationResult {
  prNumber: number;
  prUrl: string;
  branchName: string;
}

export async function createPullRequest(
  octokit: Octokit,
  params: PRCreationParams
): Promise<PRCreationResult> {
  const { files, gameName, category, description, username } = params;
  
  // Generate unique branch name
  const timestamp = Date.now();
  const contentHash = createHash('sha256')
    .update(files.map(f => f.content).join(''))
    .digest('hex')
    .slice(0, 8);
  const branchName = `game/${gameName}-${timestamp}-${contentHash}`;
  
  // Step 1: Sync fork with upstream
  try {
    await octokit.repos.mergeUpstream({
      owner: username,
      repo: UPSTREAM_REPO,
      branch: 'main',
    });
  } catch (error: any) {
    // 409 means already up-to-date, that's fine
    if (error.status !== 409) {
      console.warn('[PR] Could not sync fork:', error.message);
    }
  }
  
  // Step 2: Get base commit SHA
  const { data: ref } = await octokit.git.getRef({
    owner: username,
    repo: UPSTREAM_REPO,
    ref: 'heads/main',
  });
  const baseSha = ref.object.sha;
  
  // Step 3: Check if branch already exists (idempotency)
  try {
    await octokit.git.getRef({
      owner: username,
      repo: UPSTREAM_REPO,
      ref: `heads/${branchName}`,
    });
    // Branch exists - this is a duplicate request
    throw new DuplicatePRError(`Branch ${branchName} already exists`);
  } catch (error: any) {
    if (error.status !== 404) throw error;
    // 404 means branch doesn't exist - good, continue
  }
  
  // Step 4: Create branch
  await octokit.git.createRef({
    owner: username,
    repo: UPSTREAM_REPO,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });
  
  // Step 5: Create blobs (parallel)
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner: username,
        repo: UPSTREAM_REPO,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      });
      return { path: file.path, sha: blob.sha };
    })
  );
  
  // Step 6: Create tree
  const { data: tree } = await octokit.git.createTree({
    owner: username,
    repo: UPSTREAM_REPO,
    base_tree: baseSha,
    tree: blobs.map((blob) => ({
      path: blob.path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: blob.sha,
    })),
  });
  
  // Step 7: Create commit
  const { data: commit } = await octokit.git.createCommit({
    owner: username,
    repo: UPSTREAM_REPO,
    message: `feat(game): add ${gameName}\n\n${description}\n\nSubmitted via Platform Browser IDE`,
    tree: tree.sha,
    parents: [baseSha],
  });
  
  // Step 8: Update branch to point to commit
  await octokit.git.updateRef({
    owner: username,
    repo: UPSTREAM_REPO,
    ref: `heads/${branchName}`,
    sha: commit.sha,
    force: false,
  });
  
  // Step 9: Create PR
  const { data: pr } = await octokit.pulls.create({
    owner: UPSTREAM_OWNER,
    repo: UPSTREAM_REPO,
    title: `feat(game): ${gameName}`,
    body: generatePRBody(params),
    head: `${username}:${branchName}`,
    base: 'main',
  });
  
  return {
    prNumber: pr.number,
    prUrl: pr.html_url,
    branchName,
  };
}

function generatePRBody(params: PRCreationParams): string {
  return `## Game Submission

**Name:** ${params.gameName}
**Category:** ${params.category}
**Author:** @${params.username}

### Description

${params.description || 'No description provided.'}

### Files

${params.files.map(f => `- \`${f.path}\``).join('\n')}

---

*Submitted via [Platform Browser IDE](https://platform.dev/editor)*
*Auto-generated PR - validation will run automatically*
`;
}

class DuplicatePRError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicatePRError';
  }
}
```

### 2.4 Branch Naming Strategy

```typescript
// Pattern: game/{slug}-{timestamp}-{contentHash}
// Example: game/snake-game-1709312400000-a1b2c3d4

function generateBranchName(gameName: string, files: FileToCommit[]): string {
  // Slugify game name
  const slug = gameName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  
  // Timestamp for uniqueness
  const timestamp = Date.now();
  
  // Content hash for idempotency detection
  const contentHash = createHash('sha256')
    .update(JSON.stringify(files.map(f => ({ path: f.path, content: f.content }))))
    .digest('hex')
    .slice(0, 8);
  
  return `game/${slug}-${timestamp}-${contentHash}`;
}
```

**Why this pattern:**
1. **`game/` prefix:** Easy to identify IDE-created branches
2. **slug:** Human-readable
3. **timestamp:** Prevents collisions
4. **contentHash:** Enables idempotency check (same files = same hash)

### 2.5 Error Handling & Retry Logic

```typescript
// lib/github/errors.ts
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public retryable: boolean
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // GitHub errors
  const retryableStatuses = [
    408, // Request Timeout
    429, // Rate Limited
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ];
  
  return retryableStatuses.includes(error.status);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      
      if (isLastAttempt || !isRetryableError(error)) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      
      console.warn(
        `[RETRY] Attempt ${attempt + 1}/${maxRetries} failed: ${error.message}. ` +
        `Retrying in ${Math.round(delay)}ms...`
      );
      
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  
  throw new Error('Unreachable');
}
```

### 2.6 Race Condition Prevention

**Problem:** User double-clicks submit, or has multiple tabs.

**Solutions:**

```typescript
// 1. Client-side: Disable button after click
const [isSubmitting, setIsSubmitting] = useState(false);

// 2. Server-side: Redis lock
async function acquireSubmitLock(userId: string): Promise<boolean> {
  const lockKey = `submit-lock:${userId}`;
  const acquired = await redis.set(lockKey, '1', { nx: true, ex: 30 });
  return acquired === 'OK';
}

async function releaseSubmitLock(userId: string): Promise<void> {
  await redis.del(`submit-lock:${userId}`);
}

// 3. Idempotency via content hash
async function checkDuplicateSubmission(
  userId: string,
  contentHash: string
): Promise<boolean> {
  const key = `submission:${userId}:${contentHash}`;
  const exists = await redis.exists(key);
  if (!exists) {
    await redis.set(key, '1', { ex: 3600 }); // 1 hour
    return false;
  }
  return true;
}
```

---

## Part 3: Security Hardening

### 3.1 File Validation Rules

```typescript
// lib/validation/files.ts

const VALIDATION_RULES = {
  // Size limits
  MAX_FILE_SIZE: 50 * 1024,        // 50KB per file
  MAX_TOTAL_SIZE: 200 * 1024,      // 200KB total
  MAX_FILES: 5,
  MAX_LINE_LENGTH: 500,
  MAX_LINES_PER_FILE: 2000,
  
  // Path rules
  ALLOWED_EXTENSIONS: ['.py', '.js', '.html', '.css', '.json', '.md'],
  ALLOWED_DIRECTORIES: ['games/cli/', 'games/web/', 'games/algorithm/'],
  
  // Content rules
  FORBIDDEN_PATTERNS: [
    /eval\s*\(/gi,                    // eval()
    /exec\s*\(/gi,                    // exec()
    /import\s+os/gi,                  // import os
    /import\s+subprocess/gi,          // import subprocess
    /import\s+socket/gi,              // import socket
    /require\s*\(\s*['"]child_process/gi, // require('child_process')
    /require\s*\(\s*['"]fs/gi,        // require('fs')
    /__import__/gi,                   // __import__
    /open\s*\([^)]*['"][wa]/gi,       // open() with write mode
    /fetch\s*\(/gi,                   // fetch() - block network
    /XMLHttpRequest/gi,               // XHR
    /WebSocket/gi,                    // WebSocket
    /localStorage/gi,                 // localStorage access
    /sessionStorage/gi,               // sessionStorage access
    /document\.cookie/gi,             // Cookie access
    /window\.location/gi,             // Redirect attempts
  ],
  
  // Filename rules
  FILENAME_PATTERN: /^[a-zA-Z0-9_\-\.]+$/,
  FORBIDDEN_FILENAMES: [
    '.git', '.gitignore', '.env', '.env.local',
    'package.json', 'package-lock.json', 'node_modules',
    '.github', 'workflows', 'CNAME', '_config.yml',
  ],
};

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: 'size' | 'path' | 'content' | 'structure';
  file?: string;
  message: string;
  severity: 'error' | 'critical';
}

interface ValidationWarning {
  type: string;
  file?: string;
  message: string;
}

export function validateFiles(
  files: Array<{ path: string; content: string }>,
  gameName: string,
  category: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Rule 1: File count
  if (files.length > VALIDATION_RULES.MAX_FILES) {
    errors.push({
      type: 'structure',
      message: `Too many files: ${files.length} (max ${VALIDATION_RULES.MAX_FILES})`,
      severity: 'error',
    });
  }
  
  if (files.length === 0) {
    errors.push({
      type: 'structure',
      message: 'No files provided',
      severity: 'critical',
    });
    return { valid: false, errors, warnings };
  }
  
  // Rule 2: Total size
  const totalSize = files.reduce((sum, f) => sum + f.content.length, 0);
  if (totalSize > VALIDATION_RULES.MAX_TOTAL_SIZE) {
    errors.push({
      type: 'size',
      message: `Total size too large: ${(totalSize / 1024).toFixed(1)}KB (max ${VALIDATION_RULES.MAX_TOTAL_SIZE / 1024}KB)`,
      severity: 'error',
    });
  }
  
  // Validate each file
  for (const file of files) {
    // Rule 3: Individual file size
    if (file.content.length > VALIDATION_RULES.MAX_FILE_SIZE) {
      errors.push({
        type: 'size',
        file: file.path,
        message: `File too large: ${(file.content.length / 1024).toFixed(1)}KB (max ${VALIDATION_RULES.MAX_FILE_SIZE / 1024}KB)`,
        severity: 'error',
      });
    }
    
    // Rule 4: Path validation
    const pathErrors = validatePath(file.path, gameName, category);
    errors.push(...pathErrors);
    
    // Rule 5: Content validation
    const contentErrors = validateContent(file.path, file.content);
    errors.push(...contentErrors);
    
    // Rule 6: Line validation
    const lines = file.content.split('\n');
    if (lines.length > VALIDATION_RULES.MAX_LINES_PER_FILE) {
      errors.push({
        type: 'size',
        file: file.path,
        message: `Too many lines: ${lines.length} (max ${VALIDATION_RULES.MAX_LINES_PER_FILE})`,
        severity: 'error',
      });
    }
    
    const longLines = lines.filter(l => l.length > VALIDATION_RULES.MAX_LINE_LENGTH);
    if (longLines.length > 0) {
      warnings.push({
        type: 'style',
        file: file.path,
        message: `${longLines.length} lines exceed ${VALIDATION_RULES.MAX_LINE_LENGTH} characters (possible minification/obfuscation)`,
      });
    }
  }
  
  // Rule 7: Required files
  const requiredFiles = getRequiredFiles(category);
  for (const required of requiredFiles) {
    const hasFile = files.some(f => f.path.endsWith(required));
    if (!hasFile) {
      errors.push({
        type: 'structure',
        message: `Missing required file: ${required}`,
        severity: 'error',
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validatePath(path: string, gameName: string, category: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Path traversal check
  if (path.includes('..') || path.includes('//') || path.startsWith('/')) {
    errors.push({
      type: 'path',
      file: path,
      message: 'Path traversal detected',
      severity: 'critical',
    });
    return errors;
  }
  
  // Must be in correct directory
  const expectedPrefix = `games/${category}/${gameName}/`;
  if (!path.startsWith(expectedPrefix)) {
    errors.push({
      type: 'path',
      file: path,
      message: `Invalid path. Expected: ${expectedPrefix}*`,
      severity: 'critical',
    });
  }
  
  // Extension check
  const ext = '.' + path.split('.').pop()?.toLowerCase();
  if (!VALIDATION_RULES.ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push({
      type: 'path',
      file: path,
      message: `Invalid extension: ${ext}. Allowed: ${VALIDATION_RULES.ALLOWED_EXTENSIONS.join(', ')}`,
      severity: 'error',
    });
  }
  
  // Filename check
  const filename = path.split('/').pop() || '';
  if (!VALIDATION_RULES.FILENAME_PATTERN.test(filename)) {
    errors.push({
      type: 'path',
      file: path,
      message: 'Invalid filename. Use only alphanumeric, dash, underscore, dot.',
      severity: 'error',
    });
  }
  
  // Forbidden filenames
  if (VALIDATION_RULES.FORBIDDEN_FILENAMES.includes(filename.toLowerCase())) {
    errors.push({
      type: 'path',
      file: path,
      message: `Forbidden filename: ${filename}`,
      severity: 'critical',
    });
  }
  
  return errors;
}

function validateContent(path: string, content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const pattern of VALIDATION_RULES.FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      errors.push({
        type: 'content',
        file: path,
        message: `Forbidden pattern detected: ${pattern.source.slice(0, 30)}...`,
        severity: 'critical',
      });
    }
    // Reset regex lastIndex
    pattern.lastIndex = 0;
  }
  
  // Check for extremely long single lines (possible obfuscation)
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 1000) {
      errors.push({
        type: 'content',
        file: path,
        message: `Line ${i + 1} is extremely long (${lines[i].length} chars). Possible obfuscation.`,
        severity: 'error',
      });
    }
  }
  
  return errors;
}

function getRequiredFiles(category: string): string[] {
  switch (category) {
    case 'cli':
      return ['main.py', 'metadata.json', 'README.md'];
    case 'web':
      return ['index.html', 'metadata.json', 'README.md'];
    case 'algorithm':
      return ['solution.py', 'metadata.json', 'README.md'];
    default:
      return ['metadata.json', 'README.md'];
  }
}
```

### 3.2 Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limits for different operations
export const rateLimits = {
  // PR submission: 5 per hour, 20 per day
  submit: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    prefix: 'ratelimit:submit',
    analytics: true,
  }),
  
  // Validation endpoint: 30 per minute
  validate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    prefix: 'ratelimit:validate',
  }),
  
  // Fork check: 60 per hour
  forkCheck: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 h'),
    prefix: 'ratelimit:fork',
  }),
  
  // Global: 100 requests per minute per user
  global: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'ratelimit:global',
  }),
};

export type RateLimitType = keyof typeof rateLimits;

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export async function checkRateLimit(
  type: RateLimitType,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = rateLimits[type];
  const result = await limiter.limit(identifier);
  
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
  };
}

// Daily limit (separate tracking)
export async function checkDailyLimit(userId: string): Promise<{ allowed: boolean; count: number }> {
  const key = `daily-submit:${userId}:${new Date().toISOString().split('T')[0]}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 86400); // 24 hours
  }
  
  const MAX_DAILY = 20;
  return {
    allowed: count <= MAX_DAILY,
    count,
  };
}
```

### 3.3 Anti-Spam PR Measures

```typescript
// lib/anti-spam.ts
interface SpamCheckResult {
  isSpam: boolean;
  reasons: string[];
  score: number;
}

export async function checkForSpam(
  userId: string,
  username: string,
  files: Array<{ path: string; content: string }>,
  redis: Redis
): Promise<SpamCheckResult> {
  const reasons: string[] = [];
  let score = 0;
  
  // Check 1: Account age (requires GitHub API call)
  // Skip for performance - rely on GitHub's spam detection
  
  // Check 2: Recent submission rate
  const recentKey = `recent-submissions:${userId}`;
  const recentCount = await redis.incr(recentKey);
  if (recentCount === 1) {
    await redis.expire(recentKey, 300); // 5 minutes
  }
  if (recentCount > 3) {
    score += 30;
    reasons.push('High submission frequency');
  }
  
  // Check 3: Content analysis
  const totalContent = files.map(f => f.content).join('\n');
  
  // Repetitive content
  const words = totalContent.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRatio = words.length > 10 ? uniqueWords.size / words.length : 1;
  if (repetitionRatio < 0.3) {
    score += 40;
    reasons.push('Highly repetitive content');
  }
  
  // Minimal content (likely empty template)
  const meaningfulContent = totalContent.replace(/\s+/g, '').length;
  if (meaningfulContent < 200) {
    score += 20;
    reasons.push('Minimal content');
  }
  
  // Check 4: Known spam patterns
  const spamPatterns = [
    /buy\s+now/gi,
    /free\s+download/gi,
    /click\s+here/gi,
    /crypto\s*currency/gi,
    /nft\s+mint/gi,
    /bit\.ly|tinyurl|t\.co/gi,
  ];
  
  for (const pattern of spamPatterns) {
    if (pattern.test(totalContent)) {
      score += 50;
      reasons.push(`Spam pattern: ${pattern.source.slice(0, 20)}`);
    }
    pattern.lastIndex = 0;
  }
  
  // Check 5: Duplicate content hash
  const contentHash = createHash('sha256').update(totalContent).digest('hex');
  const duplicateKey = `content-hash:${contentHash}`;
  const isDuplicate = await redis.exists(duplicateKey);
  if (isDuplicate) {
    score += 100;
    reasons.push('Duplicate content detected');
  } else {
    await redis.set(duplicateKey, userId, { ex: 86400 }); // 24 hours
  }
  
  return {
    isSpam: score >= 50,
    reasons,
    score,
  };
}
```

### 3.4 Metadata Validation

```typescript
// lib/validation/metadata.ts
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

const metadataSchema = {
  type: 'object',
  required: ['name', 'author', 'category', 'difficulty', 'description'],
  properties: {
    name: {
      type: 'string',
      pattern: '^[a-z0-9-]+$',
      minLength: 3,
      maxLength: 50,
    },
    author: {
      type: 'string',
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 39, // GitHub username max
    },
    category: {
      type: 'string',
      enum: ['cli', 'web', 'algorithm'],
    },
    difficulty: {
      type: 'string',
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    language: {
      type: 'string',
      enum: ['Python', 'JavaScript', 'HTML/CSS/JS'],
    },
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
    },
    description: {
      type: 'string',
      minLength: 10,
      maxLength: 500,
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^[a-z0-9-]+$',
        maxLength: 20,
      },
      maxItems: 5,
    },
    entry_point: {
      type: 'string',
      pattern: '^[a-zA-Z0-9_.-]+$',
    },
  },
  additionalProperties: false,
};

const validateMetadataSchema = ajv.compile(metadataSchema);

export function validateMetadata(
  metadata: unknown,
  expectedAuthor: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Schema validation
  const isValid = validateMetadataSchema(metadata);
  if (!isValid) {
    errors.push(
      ...validateMetadataSchema.errors!.map(
        (e) => `${e.instancePath || 'root'}: ${e.message}`
      )
    );
    return { valid: false, errors };
  }
  
  const data = metadata as Record<string, any>;
  
  // Author must match authenticated user
  if (data.author !== expectedAuthor) {
    errors.push(`Author mismatch: expected ${expectedAuthor}, got ${data.author}`);
  }
  
  // Entry point must match category
  const expectedEntry = {
    cli: 'main.py',
    web: 'index.html',
    algorithm: 'solution.py',
  }[data.category];
  
  if (data.entry_point && data.entry_point !== expectedEntry) {
    errors.push(`Entry point must be ${expectedEntry} for ${data.category} category`);
  }
  
  return { valid: errors.length === 0, errors };
}
```

---

## Part 4: Backend Structure

### 4.1 API Route Structure

```
app/
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts          # NextAuth handler
│   ├── github/
│   │   ├── fork/
│   │   │   └── route.ts          # Check/create fork
│   │   ├── submit/
│   │   │   └── route.ts          # Full PR pipeline
│   │   └── validate/
│   │       └── route.ts          # Pre-submit validation
│   └── user/
│       └── me/
│           └── route.ts          # Current user info
```

### 4.2 API Implementation

```typescript
// app/api/github/fork/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGitHubToken, getSessionUser } from '@/lib/github-token';
import { createOctokit } from '@/lib/github/client';
import { ensureForkExists } from '@/lib/github/fork';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // 1. Authentication
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Rate limiting
  const rateLimit = await checkRateLimit('forkCheck', user.id);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limited', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    );
  }
  
  // 3. Get token (server-side only)
  const token = await getGitHubToken();
  if (!token) {
    return NextResponse.json({ error: 'Token expired' }, { status: 401 });
  }
  
  // 4. Check fork
  try {
    const octokit = createOctokit(token);
    const result = await ensureForkExists(octokit, user.username);
    
    return NextResponse.json({
      hasFork: result.exists || result.created,
      created: result.created,
      fullName: result.fullName,
    });
  } catch (error: any) {
    console.error('[FORK]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check fork' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/github/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGitHubToken, getSessionUser } from '@/lib/github-token';
import { createOctokit } from '@/lib/github/client';
import { ensureForkExists } from '@/lib/github/fork';
import { createPullRequest } from '@/lib/github/pr';
import { validateFiles } from '@/lib/validation/files';
import { validateMetadata } from '@/lib/validation/metadata';
import { checkRateLimit, checkDailyLimit } from '@/lib/rate-limit';
import { checkForSpam } from '@/lib/anti-spam';
import { redis } from '@/lib/redis';

export const runtime = 'edge';
export const maxDuration = 30; // 30 second timeout

interface SubmitRequest {
  files: Array<{ path: string; content: string }>;
  gameName: string;
  category: 'cli' | 'web' | 'algorithm';
  description: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // 1. Authentication
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Rate limiting (hourly)
  const hourlyLimit = await checkRateLimit('submit', user.id);
  if (!hourlyLimit.success) {
    return NextResponse.json(
      {
        error: 'Rate limited (hourly)',
        remaining: hourlyLimit.remaining,
        retryAfter: hourlyLimit.retryAfter,
      },
      { status: 429, headers: { 'Retry-After': String(hourlyLimit.retryAfter) } }
    );
  }
  
  // 3. Rate limiting (daily)
  const dailyLimit = await checkDailyLimit(user.id);
  if (!dailyLimit.allowed) {
    return NextResponse.json(
      { error: 'Daily submission limit reached (20/day)', count: dailyLimit.count },
      { status: 429 }
    );
  }
  
  // 4. Parse request
  let body: SubmitRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  
  const { files, gameName, category, description } = body;
  
  // 5. Basic validation
  if (!files?.length || !gameName || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  // 6. File validation
  const fileValidation = validateFiles(files, gameName, category);
  if (!fileValidation.valid) {
    return NextResponse.json(
      { error: 'Validation failed', errors: fileValidation.errors },
      { status: 400 }
    );
  }
  
  // 7. Metadata validation
  const metadataFile = files.find(f => f.path.endsWith('metadata.json'));
  if (metadataFile) {
    try {
      const metadata = JSON.parse(metadataFile.content);
      const metaValidation = validateMetadata(metadata, user.username);
      if (!metaValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid metadata', errors: metaValidation.errors },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Invalid metadata JSON' }, { status: 400 });
    }
  }
  
  // 8. Anti-spam check
  const spamCheck = await checkForSpam(user.id, user.username, files, redis);
  if (spamCheck.isSpam) {
    console.warn(`[SPAM] User ${user.username}: score=${spamCheck.score}, reasons=${spamCheck.reasons.join(', ')}`);
    return NextResponse.json(
      { error: 'Submission flagged as potential spam' },
      { status: 403 }
    );
  }
  
  // 9. Acquire submission lock (prevent double-submit)
  const lockKey = `submit-lock:${user.id}`;
  const lockAcquired = await redis.set(lockKey, '1', { nx: true, ex: 30 });
  if (!lockAcquired) {
    return NextResponse.json(
      { error: 'A submission is already in progress' },
      { status: 409 }
    );
  }
  
  try {
    // 10. Get GitHub token
    const token = await getGitHubToken();
    if (!token) {
      return NextResponse.json({ error: 'GitHub token expired' }, { status: 401 });
    }
    
    const octokit = createOctokit(token);
    
    // 11. Ensure fork exists
    await ensureForkExists(octokit, user.username);
    
    // 12. Create PR
    const result = await createPullRequest(octokit, {
      files,
      gameName,
      category,
      description,
      username: user.username,
    });
    
    const duration = Date.now() - startTime;
    console.log(`[SUBMIT] Success: user=${user.username}, pr=${result.prNumber}, duration=${duration}ms`);
    
    return NextResponse.json({
      success: true,
      pr: {
        number: result.prNumber,
        url: result.prUrl,
      },
      branch: result.branchName,
    });
  } catch (error: any) {
    console.error(`[SUBMIT] Error: user=${user.username}`, error);
    
    // Map known errors to user-friendly messages
    const errorMap: Record<string, { status: number; message: string }> = {
      DuplicatePRError: { status: 409, message: 'A similar submission already exists' },
      'Not Found': { status: 404, message: 'Repository not found' },
      'Bad credentials': { status: 401, message: 'GitHub authentication failed' },
    };
    
    const mapped = errorMap[error.name] || errorMap[error.message];
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }
    
    return NextResponse.json(
      { error: 'Failed to create PR' },
      { status: 500 }
    );
  } finally {
    // Always release lock
    await redis.del(lockKey);
  }
}
```

```typescript
// app/api/github/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/github-token';
import { validateFiles } from '@/lib/validation/files';
import { validateMetadata } from '@/lib/validation/metadata';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

interface ValidateRequest {
  files: Array<{ path: string; content: string }>;
  gameName: string;
  category: 'cli' | 'web' | 'algorithm';
}

export async function POST(request: NextRequest) {
  // 1. Authentication
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Rate limiting
  const rateLimit = await checkRateLimit('validate', user.id);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limited', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }
  
  // 3. Parse request
  let body: ValidateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  
  const { files, gameName, category } = body;
  
  // 4. Validate files
  const fileResult = validateFiles(files || [], gameName, category);
  
  // 5. Validate metadata
  let metadataResult = { valid: true, errors: [] as string[] };
  const metadataFile = files?.find(f => f.path.endsWith('metadata.json'));
  if (metadataFile) {
    try {
      const metadata = JSON.parse(metadataFile.content);
      metadataResult = validateMetadata(metadata, user.username);
    } catch {
      metadataResult = { valid: false, errors: ['Invalid JSON in metadata.json'] };
    }
  }
  
  return NextResponse.json({
    valid: fileResult.valid && metadataResult.valid,
    files: {
      valid: fileResult.valid,
      errors: fileResult.errors,
      warnings: fileResult.warnings,
    },
    metadata: {
      valid: metadataResult.valid,
      errors: metadataResult.errors,
    },
  });
}
```

### 4.3 Separation of Concerns

| Component | Runs Where | Sees Token | Purpose |
|-----------|------------|------------|---------|
| `getSessionUser()` | Server | No | Get public user info |
| `getGitHubToken()` | Server | Yes | Get token for API calls |
| `validateFiles()` | Server | No | Security validation |
| `createOctokit()` | Server | Yes | API client |
| Monaco Editor | Browser | No | Code editing |
| Preview iframe | Browser | No | Game preview |

**Never import `getGitHubToken` in client components.** It will throw at build time if imported client-side.

---

## Part 5: Scalability & Rate Limits

### 5.1 GitHub API Rate Limits

| Token Type | Limit | Per | Notes |
|------------|-------|-----|-------|
| User OAuth | 5,000 | Hour | Shared across all apps using that user's token |
| GitHub App Installation | 5,000 | Hour | Per installation, not per user |
| Unauthenticated | 60 | Hour | By IP |

**Per-Operation Cost:**

| Operation | API Calls | Cacheable |
|-----------|-----------|-----------|
| Check fork exists | 1 | Yes (5 min) |
| Create fork | 1 + polling (3-5) | No |
| Create PR (6 files) | 1 (sync) + 1 (ref) + 6 (blobs) + 1 (tree) + 1 (commit) + 1 (ref update) + 1 (PR) = 12 | No |

**Total per submission:** ~12-17 API calls

**Max submissions per user per hour:** 5,000 / 17 ≈ 294 (but we limit to 5)

### 5.2 Scaling Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SCALING TIERS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TIER 1: 0-500 Users/Day                                                     │
│  ────────────────────────                                                    │
│  • Direct GitHub API with user tokens                                        │
│  • Upstash Redis for rate limiting                                           │
│  • Vercel Free Tier                                                          │
│  • Cost: $0-20/mo                                                            │
│  • API calls/hour: ~500 users × 1 submit × 15 calls = 7,500                 │
│      → Within user token limits (each has 5,000/hr)                         │
│                                                                              │
│  TIER 2: 500-2,000 Users/Day                                                 │
│  ──────────────────────────                                                  │
│  • Add Redis caching (fork status, branch SHA)                               │
│  • Add request queuing (prevent burst)                                       │
│  • Vercel Pro ($20/mo)                                                       │
│  • Upstash Pro ($10/mo)                                                      │
│  • Cost: ~$50/mo                                                             │
│  • Consider: GitHub App for higher limits                                    │
│                                                                              │
│  TIER 3: 2,000-10,000 Users/Day                                              │
│  ─────────────────────────────                                               │
│  • Migrate to GitHub App                                                     │
│  • Background job queue (Inngest/Trigger.dev)                                │
│  • Database for submission tracking                                          │
│  • Multiple App installations for load distribution                          │
│  • Cost: ~$200/mo                                                            │
│                                                                              │
│  TIER 4: 10,000+ Users/Day                                                   │
│  ──────────────────────────                                                  │
│  • Multiple GitHub Apps                                                      │
│  • Dedicated queue infrastructure                                            │
│  • Custom retry/backoff system                                               │
│  • Rate limit pooling                                                        │
│  • Cost: ~$500+/mo                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Caching Strategy

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache fork existence (reduces API calls)
export async function getCachedForkStatus(username: string): Promise<boolean | null> {
  const cached = await redis.get(`fork:${username}`);
  return cached === null ? null : cached === '1';
}

export async function setCachedForkStatus(username: string, exists: boolean): Promise<void> {
  await redis.set(`fork:${username}`, exists ? '1' : '0', { ex: 300 }); // 5 minutes
}

// Cache main branch SHA (reduces API calls)
export async function getCachedMainSha(): Promise<string | null> {
  return redis.get('upstream:main:sha');
}

export async function setCachedMainSha(sha: string): Promise<void> {
  await redis.set('upstream:main:sha', sha, { ex: 60 }); // 1 minute
}

// User submission history (for analytics)
export async function recordSubmission(userId: string, prNumber: number): Promise<void> {
  const key = `user:${userId}:submissions`;
  await redis.zadd(key, { score: Date.now(), member: String(prNumber) });
  await redis.expire(key, 30 * 24 * 60 * 60); // 30 days
}
```

### 5.4 Cost Estimation

| Component | Free Tier | Pro Tier | Notes |
|-----------|-----------|----------|-------|
| Vercel | 100GB bandwidth | $20/mo | Edge functions |
| Upstash Redis | 10K commands/day | $10/mo | Rate limiting |
| GitHub API | Free | Free | Within rate limits |
| Domain | - | ~$15/yr | Optional |
| Sentry | 5K events/mo | $26/mo | Error tracking |

**Estimated Monthly Cost:**
- 0-500 users: $0-20
- 500-2,000 users: $50-100
- 2,000-10,000 users: $150-300
- 10,000+ users: $500+

---

## Part 6: Implementation

### 6.1 Migration to GitHub App (Future)

**When to migrate:**
1. Hitting rate limits consistently
2. Need fine-grained permissions
3. Want webhook integration
4. Need to act on behalf of org

**Migration steps:**
1. Create GitHub App in org settings
2. Add webhook endpoint for PR events
3. Implement installation token refresh
4. Update auth flow (users still login, but use app for API)
5. Gradual rollout with feature flag

### 6.2 Common Mistakes to Avoid

| Mistake | Why Bad | Fix |
|---------|---------|-----|
| Token in URL | Visible in logs, referrer | POST requests, body params |
| Token in localStorage | XSS can steal | httpOnly cookies |
| Logging full errors | May contain token | Sanitize before logging |
| Trusting client validation | Can be bypassed | Always validate server-side |
| No rate limiting | DoS, spam | Redis-based limits |
| Direct branch push | No review gate | Fork-based workflow |
| Generic error messages | Leaks internal info | Map to safe messages |
| Long session lifetime | Token compromise window | 7 days max |
| Missing CSRF | Silent form submission | State parameter, SameSite |

### 6.3 Security Checklist

```markdown
## Pre-Launch Security Checklist

### Authentication
- [ ] OAuth scopes are minimal (public_repo, read:user, user:email)
- [ ] Tokens stored in httpOnly cookies
- [ ] Session lifetime is reasonable (7 days)
- [ ] State parameter validated in OAuth callback
- [ ] SameSite=Lax on all cookies

### API Security
- [ ] All mutating endpoints require authentication
- [ ] Rate limiting on all endpoints
- [ ] Request origin validation
- [ ] Input validation on all params
- [ ] No tokens in logs or errors

### File Security
- [ ] Path traversal protection
- [ ] Extension whitelist
- [ ] Size limits enforced
- [ ] Content pattern scanning
- [ ] Metadata schema validation

### Infrastructure
- [ ] Environment variables not in code
- [ ] Different secrets for dev/prod
- [ ] HTTPS enforced
- [ ] Error tracking configured
- [ ] Audit logging enabled

### GitHub Integration
- [ ] Fork-based workflow (not direct push)
- [ ] Branch naming is deterministic
- [ ] Duplicate PR detection
- [ ] Submission locking
- [ ] Spam detection
```

### 6.4 Monitoring & Alerts

```typescript
// lib/monitoring.ts
interface SubmissionMetrics {
  userId: string;
  duration: number;
  success: boolean;
  errorType?: string;
  apiCallCount: number;
}

export async function recordMetrics(metrics: SubmissionMetrics): Promise<void> {
  // Log for analysis
  console.log(JSON.stringify({
    event: 'submission',
    ...metrics,
    timestamp: new Date().toISOString(),
  }));
  
  // Update counters in Redis for dashboards
  const date = new Date().toISOString().split('T')[0];
  await redis.hincrby(`metrics:${date}`, 'total', 1);
  await redis.hincrby(`metrics:${date}`, metrics.success ? 'success' : 'failure', 1);
  
  // Alert on high error rate
  const stats = await redis.hgetall(`metrics:${date}`);
  const errorRate = (stats?.failure || 0) / (stats?.total || 1);
  if (errorRate > 0.1 && stats?.total > 10) {
    // Trigger alert (Sentry, PagerDuty, etc.)
    console.error(`[ALERT] High error rate: ${(errorRate * 100).toFixed(1)}%`);
  }
}
```

---

## Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Auth** | OAuth App + NextAuth | Simpler setup, direct user attribution |
| **Token Storage** | Encrypted JWT in httpOnly cookie | Stateless, secure, Vercel-compatible |
| **PR Flow** | Fork → Branch → Commit → PR | Isolated, reviewable, revocable |
| **Validation** | Server-side only | Client can be bypassed |
| **Rate Limiting** | Upstash Redis | Edge-compatible, sliding window |
| **Scaling** | Start simple, migrate to GitHub App at 2K users | Avoid premature optimization |

**Total implementation time:** 
- MVP (basic flow): 1-2 weeks
- Production-ready (full security): 3-4 weeks
- Scale-ready (GitHub App, queues): 6-8 weeks
