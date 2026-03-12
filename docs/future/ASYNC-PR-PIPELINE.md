# Async PR Processing Pipeline

> **⚠️ NOT BUILT YET — This is a design document for a potential future feature.**  
> Nothing described below exists in the current codebase.

> Queue-Based Architecture for Serverless PR Processing  
> Design Exploration Document

---

## Table of Contents

1. [System Architecture](#part-1-system-architecture)
2. [Producer Endpoint](#part-2-producer-endpoint)
3. [Consumer/Worker](#part-3-consumerworker)
4. [Failure Handling & DLQ](#part-4-failure-handling--dlq)
5. [GitHub Rate Limit Strategy](#part-5-github-rate-limit-strategy)
6. [Data Model](#part-6-data-model)
7. [Frontend Status System](#part-7-frontend-status-system)
8. [Scalability Plan](#part-8-scalability-plan)
9. [Edge Cases](#part-9-edge-cases)

---

## Part 1: System Architecture

### Why Queue is Mandatory

| Synchronous Problem | Queue Solution |
|---------------------|----------------|
| 10-15s execution time exceeds Vercel timeout | Worker processes independently, no timeout constraint |
| Partial failure (branch created, PR failed) | Checkpointed state enables resume |
| 500 concurrent users = 500 parallel GitHub calls | Queue serializes, respects rate limits |
| Secondary rate limit triggers abuse detection | Controlled throughput with backpressure |
| Cold start delays compound latency | Decoupled: user gets instant response |
| Retry logic blocks user | Background retry without user waiting |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    BROWSER CLIENT                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐           │
│   │   Code Editor   │────────▶│   Submit Form   │────────▶│  Status Panel   │           │
│   │   (Monaco)      │         │                 │         │  (Polling/SSE)  │           │
│   └─────────────────┘         └────────┬────────┘         └────────▲────────┘           │
│                                        │                           │                     │
│                                        │ POST /api/submit          │ GET /api/job/:id    │
│                                        │ {files, metadata}         │ every 2s            │
│                                        │                           │                     │
└────────────────────────────────────────┼───────────────────────────┼─────────────────────┘
                                         │                           │
═══════════════════════════════════════════════════════════════════════════════════════════
                                         │ VERCEL EDGE NETWORK       │
═══════════════════════════════════════════════════════════════════════════════════════════
                                         │                           │
┌────────────────────────────────────────┼───────────────────────────┼─────────────────────┐
│                                        ▼                           │                     │
│  ┌─────────────────────────────────────────────────────────────────┴──────────────────┐  │
│  │                         VERCEL SERVERLESS FUNCTIONS                                │  │
│  │                                                                                    │  │
│  │  ┌──────────────────────────────────┐    ┌──────────────────────────────────┐     │  │
│  │  │                                  │    │                                  │     │  │
│  │  │   /api/submit (PRODUCER)         │    │   /api/job/[id] (STATUS)         │     │  │
│  │  │                                  │    │                                  │     │  │
│  │  │   1. Auth check                  │    │   1. Look up job:{id}            │     │  │
│  │  │   2. Rate limit                  │    │   2. Return status + progress    │     │  │
│  │  │   3. Validate files              │    │   3. Include PR URL if done      │     │  │
│  │  │   4. Content scan                │    │                                  │     │  │
│  │  │   5. Generate jobId              │    └──────────────────────────────────┘     │  │
│  │  │   6. Store job:pending           │                                             │  │
│  │  │   7. Enqueue to QStash           │                                             │  │
│  │  │   8. Return jobId (< 200ms)      │                                             │  │
│  │  │                                  │                                             │  │
│  │  └───────────────┬──────────────────┘                                             │  │
│  │                  │                                                                │  │
│  └──────────────────┼────────────────────────────────────────────────────────────────┘  │
│                     │                                                                   │
│                     │ QStash Publish                                                    │
│                     │ { jobId, userId }                                                 │
│                     │                                                                   │
└─────────────────────┼───────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    UPSTASH QSTASH                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              MESSAGE QUEUE                                       │   │
│   │                                                                                  │   │
│   │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│   │   │  Job 1  │  │  Job 2  │  │  Job 3  │  │  Job 4  │  │  Job 5  │   ...        │   │
│   │   │ pending │  │ pending │  │ pending │  │ pending │  │ pending │              │   │
│   │   └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘              │   │
│   │                                                                                  │   │
│   │   Retry Policy: 3 attempts, exponential backoff                                  │   │
│   │   Delay: 0s initial, configurable                                               │   │
│   │   Timeout: 30s per delivery                                                      │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│                     │ HTTP POST callback                                                 │
│                     │ (with signature verification)                                      │
│                     ▼                                                                    │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                           DEAD LETTER QUEUE                                      │   │
│   │                                                                                  │   │
│   │   Jobs that failed 3+ times                                                      │   │
│   │   → Webhook to Slack                                                             │   │
│   │   → Manual review dashboard                                                       │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                      │
                      │ HTTP POST /api/workers/process-pr
                      │ Headers: Upstash-Signature
                      │ Body: { jobId, userId }
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              WORKER ENDPOINT                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                   │  │
│  │   /api/workers/process-pr (CONSUMER)                                              │  │
│  │                                                                                   │  │
│  │   1. Verify QStash signature                                                      │  │
│  │   2. Acquire lock: SET lock:job:{id} NX EX 60                                    │  │
│  │   3. Check job not already completed                                              │  │
│  │   4. Fetch job payload from Redis                                                 │  │
│  │   5. Get GitHub token from session store                                          │  │
│  │   6. Execute PR pipeline (checkpointed):                                          │  │
│  │      ├── Stage 1: Ensure fork ─────────────▶ status=fork_created                 │  │
│  │      ├── Stage 2: Sync fork ───────────────▶ status=fork_synced                  │  │
│  │      ├── Stage 3: Create branch ───────────▶ status=branch_created               │  │
│  │      ├── Stage 4: Create blobs ────────────▶ status=blobs_created                │  │
│  │      ├── Stage 5: Create tree ─────────────▶ status=tree_created                 │  │
│  │      ├── Stage 6: Create commit ───────────▶ status=commit_created               │  │
│  │      ├── Stage 7: Update ref ──────────────▶ status=ref_updated                  │  │
│  │      └── Stage 8: Open PR ─────────────────▶ status=completed                    │  │
│  │   7. Store PR URL                                                                 │  │
│  │   8. Release lock                                                                 │  │
│  │   9. Return 200 OK                                                                │  │
│  │                                                                                   │  │
│  │   On Error:                                                                       │  │
│  │   • Return 500 → QStash will retry                                               │  │
│  │   • Return 200 with status=failed → No retry (permanent failure)                 │  │
│  │                                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
└─────────────────────┬───────────────────────────────────────────────────────────────────┘
                      │
                      │ GitHub REST API
                      │ Bearer: user_access_token
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    GITHUB API                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   Rate Limits:                                                                           │
│   • 5,000 requests/hour per user token                                                  │
│   • Secondary rate limit: ~100 requests/minute for content creation                     │
│   • Abuse detection: Rapid concurrent requests                                          │
│                                                                                          │
│   Endpoints:                                                                             │
│   GET  /repos/{user}/{repo}              ─── Check fork                                 │
│   POST /repos/{owner}/{repo}/forks       ─── Create fork                                │
│   POST /repos/{user}/{repo}/merge-upstream ─ Sync fork                                  │
│   GET  /repos/{user}/{repo}/git/ref/heads/main ─ Get base SHA                           │
│   POST /repos/{user}/{repo}/git/refs     ─── Create branch                              │
│   POST /repos/{user}/{repo}/git/blobs    ─── Create blobs (parallel)                    │
│   POST /repos/{user}/{repo}/git/trees    ─── Create tree                                │
│   POST /repos/{user}/{repo}/git/commits  ─── Create commit                              │
│   PATCH /repos/{user}/{repo}/git/refs/{ref} ─ Update ref                                │
│   POST /repos/{upstream}/{repo}/pulls    ─── Open PR                                    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                      │
                      │ Updates
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   UPSTASH REDIS                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              JOB STATE STORE                                     │   │
│   │                                                                                  │   │
│   │   job:{jobId}                 ─── Full job payload (files, metadata)            │   │
│   │   job:{jobId}:status          ─── Current stage                                 │   │
│   │   job:{jobId}:attempts        ─── Retry counter                                 │   │
│   │   job:{jobId}:checkpoint      ─── Last successful stage                          │   │
│   │   job:{jobId}:result          ─── PR URL or error message                       │   │
│   │   job:{jobId}:created_at      ─── Timestamp                                     │   │
│   │                                                                                  │   │
│   │   lock:job:{jobId}            ─── Distributed lock (60s TTL)                    │   │
│   │                                                                                  │   │
│   │   user:{userId}:jobs          ─── ZSET of user's jobs (timestamp score)        │   │
│   │   user:{userId}:daily_count   ─── Counter for rate limiting                     │   │
│   │                                                                                  │   │
│   │   rate:github:{userId}        ─── Per-user API call counter                     │   │
│   │   rate:github:global          ─── Global API call counter                       │   │
│   │                                                                                  │   │
│   │   cache:fork:{userId}         ─── Fork existence (5min TTL)                     │   │
│   │   cache:upstream:sha          ─── Main branch SHA (1min TTL)                    │   │
│   │                                                                                  │   │
│   │   content_hash:{hash}         ─── Deduplication (24h TTL)                       │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                           SESSION TOKEN STORE                                    │   │
│   │                                                                                  │   │
│   │   token:{userId}              ─── Encrypted GitHub access token                 │   │
│   │                                                                                  │   │
│   │   ⚠️ Tokens stored encrypted with ENCRYPTION_KEY                                │   │
│   │   ⚠️ Never logged, never in queue message                                       │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Execution Semantics

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Exactly-once** | Message processed once and only once | Impossible in distributed systems without 2PC |
| **At-least-once** | Message may be delivered multiple times | ✅ Our choice — idempotency makes duplicates safe |
| **At-most-once** | Message may be lost | Unacceptable for user submissions |

**Our approach:** At-least-once delivery with idempotent operations. If a worker crashes mid-process, QStash retries. The checkpoint system ensures we don't repeat successful GitHub operations.

### Status Polling vs SSE vs Webhooks

| Method | Latency | Complexity | Serverless-Friendly |
|--------|---------|------------|---------------------|
| **Polling** | 2-5s | Low | ✅ Yes |
| **SSE** | Real-time | Medium | ⚠️ Requires long-running connection |
| **WebSocket** | Real-time | High | ❌ Not on Vercel |
| **Webhook** | Real-time | Medium | ✅ But requires user endpoint |

**Decision:** Start with polling (2s interval), add SSE in Phase 2 when user count justifies dedicated infrastructure.

---

## Part 2: Producer Endpoint

### Idempotent Job ID Generation

```typescript
// lib/job-id.ts
import { createHash } from 'crypto';

/**
 * Generate deterministic job ID from content.
 * Same user + same files = same jobId = idempotent submission.
 */
export function generateJobId(userId: string, files: Array<{ path: string; content: string }>): string {
  // Normalize file order for consistency
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
  
  const contentHash = createHash('sha256')
    .update(userId)
    .update('|')
    .update(JSON.stringify(sortedFiles.map(f => ({ p: f.path, c: f.content }))))
    .digest('hex')
    .slice(0, 16);
  
  // Include timestamp bucket (hourly) to allow resubmission after cooldown
  const hourBucket = Math.floor(Date.now() / (60 * 60 * 1000));
  
  return `job_${userId.slice(0, 8)}_${contentHash}_${hourBucket}`;
}

/**
 * Generate content hash for duplicate detection across users.
 */
export function generateContentHash(files: Array<{ path: string; content: string }>): string {
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
  
  return createHash('sha256')
    .update(JSON.stringify(sortedFiles.map(f => f.content)))
    .digest('hex');
}
```

### Producer Endpoint

```typescript
// app/api/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { getSessionUser } from '@/lib/auth';
import { validateFiles } from '@/lib/validation/files';
import { validateMetadata } from '@/lib/validation/metadata';
import { checkForSpam } from '@/lib/anti-spam';
import { generateJobId, generateContentHash } from '@/lib/job-id';
import { encryptToken, getEncryptedToken } from '@/lib/token-store';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export const runtime = 'edge';
export const maxDuration = 10; // 10s max, but target < 200ms

interface SubmitRequest {
  files: Array<{ path: string; content: string }>;
  gameName: string;
  category: 'cli' | 'web' | 'algorithm';
  description: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // ─────────────────────────────────────────────────────────────────
  // PHASE 1: Authentication (< 20ms)
  // ─────────────────────────────────────────────────────────────────
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ─────────────────────────────────────────────────────────────────
  // PHASE 2: Rate Limiting (< 10ms)
  // ─────────────────────────────────────────────────────────────────
  const rateLimitKey = `rate:submit:${user.id}`;
  const dailyCountKey = `user:${user.id}:daily_count`;
  
  // Sliding window: 5 submissions per hour
  const [hourlyCount, dailyCount] = await Promise.all([
    redis.incr(rateLimitKey),
    redis.incr(dailyCountKey),
  ]);
  
  if (hourlyCount === 1) {
    await redis.expire(rateLimitKey, 3600);
  }
  if (dailyCount === 1) {
    await redis.expire(dailyCountKey, 86400);
  }
  
  if (hourlyCount > 5) {
    const ttl = await redis.ttl(rateLimitKey);
    return NextResponse.json(
      { error: 'Rate limited (hourly)', retryAfter: ttl },
      { status: 429, headers: { 'Retry-After': String(ttl) } }
    );
  }
  
  if (dailyCount > 20) {
    return NextResponse.json(
      { error: 'Rate limited (daily)', count: dailyCount },
      { status: 429 }
    );
  }
  
  // ─────────────────────────────────────────────────────────────────
  // PHASE 3: Parse & Validate (< 50ms)
  // ─────────────────────────────────────────────────────────────────
  let body: SubmitRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  
  const { files, gameName, category, description } = body;
  
  if (!files?.length || !gameName || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  // File validation (runs synchronously, fast)
  const fileValidation = validateFiles(files, gameName, category);
  if (!fileValidation.valid) {
    return NextResponse.json(
      { error: 'Validation failed', errors: fileValidation.errors },
      { status: 400 }
    );
  }
  
  // Metadata validation
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
  
  // ─────────────────────────────────────────────────────────────────
  // PHASE 4: Spam & Duplicate Detection (< 20ms)
  // ─────────────────────────────────────────────────────────────────
  const spamCheck = await checkForSpam(user.id, user.username, files, redis);
  if (spamCheck.isSpam) {
    console.warn(`[SPAM] Blocked: user=${user.username}, score=${spamCheck.score}`);
    return NextResponse.json({ error: 'Submission flagged' }, { status: 403 });
  }
  
  // Content-based deduplication (same content from ANY user)
  const contentHash = generateContentHash(files);
  const duplicateKey = `content_hash:${contentHash}`;
  const existingSubmitter = await redis.get(duplicateKey);
  
  if (existingSubmitter && existingSubmitter !== user.id) {
    return NextResponse.json(
      { error: 'Duplicate content. This game was already submitted.' },
      { status: 409 }
    );
  }
  
  // ─────────────────────────────────────────────────────────────────
  // PHASE 5: Generate Job ID (deterministic)
  // ─────────────────────────────────────────────────────────────────
  const jobId = generateJobId(user.id, files);
  
  // Check if this exact job already exists
  const existingJob = await redis.get(`job:${jobId}:status`);
  if (existingJob) {
    // Return existing job instead of creating duplicate
    return NextResponse.json({
      jobId,
      status: existingJob,
      message: 'Job already submitted',
      pollingUrl: `/api/job/${jobId}`,
    });
  }
  
  // ─────────────────────────────────────────────────────────────────
  // PHASE 6: Store Job State (< 30ms)
  // ─────────────────────────────────────────────────────────────────
  const jobPayload = {
    id: jobId,
    userId: user.id,
    username: user.username,
    files,
    gameName,
    category,
    description,
    createdAt: Date.now(),
  };
  
  // Store job data (expires in 7 days)
  await Promise.all([
    redis.set(`job:${jobId}`, JSON.stringify(jobPayload), { ex: 604800 }),
    redis.set(`job:${jobId}:status`, 'pending', { ex: 604800 }),
    redis.set(`job:${jobId}:attempts`, 0, { ex: 604800 }),
    redis.zadd(`user:${user.id}:jobs`, { score: Date.now(), member: jobId }),
    redis.set(duplicateKey, user.id, { ex: 86400 }), // Mark content as submitted
  ]);
  
  // ─────────────────────────────────────────────────────────────────
  // PHASE 7: Enqueue to QStash (< 50ms)
  // ─────────────────────────────────────────────────────────────────
  // CRITICAL: Queue message contains ONLY jobId and userId
  // Token is fetched by worker from secure store
  const workerUrl = `${process.env.VERCEL_URL || process.env.NEXTAUTH_URL}/api/workers/process-pr`;
  
  try {
    await qstash.publishJSON({
      url: workerUrl,
      body: {
        jobId,
        userId: user.id,
      },
      retries: 3,
      // Callback for DLQ
      callback: `${workerUrl}/callback`,
      failureCallback: `${workerUrl}/failure`,
    });
  } catch (error) {
    // Queue failed - rollback job status
    await redis.set(`job:${jobId}:status`, 'queue_failed', { ex: 604800 });
    console.error('[ENQUEUE] Failed:', error);
    return NextResponse.json({ error: 'Failed to queue job' }, { status: 500 });
  }
  
  // ─────────────────────────────────────────────────────────────────
  // PHASE 8: Return immediately
  // ─────────────────────────────────────────────────────────────────
  const duration = Date.now() - startTime;
  console.log(`[SUBMIT] Queued: job=${jobId}, user=${user.username}, duration=${duration}ms`);
  
  return NextResponse.json({
    jobId,
    status: 'pending',
    pollingUrl: `/api/job/${jobId}`,
    estimatedTime: '30-60 seconds',
  });
}
```

### Why Token NOT in Queue

| Risk | If Token in Queue |
|------|-------------------|
| **Log exposure** | QStash logs may contain message bodies |
| **Replay attack** | Captured message can be replayed |
| **Persistence** | Message persisted until acknowledged |
| **Multi-tenant** | Queue infra may be shared |

**Solution:** Queue contains only `{ jobId, userId }`. Worker fetches encrypted token at execution time from secure Redis store.

---

## Part 3: Consumer/Worker

### Worker Endpoint

```typescript
// app/api/workers/process-pr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { Octokit } from '@octokit/rest';
import { getDecryptedToken } from '@/lib/token-store';
import { PRPipeline, PipelineStage } from '@/lib/github/pipeline';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const qstashReceiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export const runtime = 'edge';
export const maxDuration = 60; // 60s for worker (Vercel Pro)

interface WorkerPayload {
  jobId: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // ─────────────────────────────────────────────────────────────────
  // PHASE 1: Verify QStash Signature
  // ─────────────────────────────────────────────────────────────────
  const signature = request.headers.get('upstash-signature');
  const body = await request.text();
  
  if (!signature) {
    console.warn('[WORKER] Missing signature');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const isValid = await qstashReceiver.verify({
    signature,
    body,
  });
  
  if (!isValid) {
    console.warn('[WORKER] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const payload: WorkerPayload = JSON.parse(body);
  const { jobId, userId } = payload;
  
  console.log(`[WORKER] Processing: job=${jobId}`);
  
  // ─────────────────────────────────────────────────────────────────
  // PHASE 2: Acquire Distributed Lock
  // ─────────────────────────────────────────────────────────────────
  const lockKey = `lock:job:${jobId}`;
  const lockValue = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  const lockAcquired = await redis.set(lockKey, lockValue, { nx: true, ex: 60 });
  
  if (!lockAcquired) {
    // Another worker is processing this job
    console.log(`[WORKER] Lock held by another worker: job=${jobId}`);
    // Return 200 to prevent QStash retry (job is being processed)
    return NextResponse.json({ status: 'locked', message: 'Job being processed by another worker' });
  }
  
  try {
    // ─────────────────────────────────────────────────────────────────
    // PHASE 3: Check Job Status (Idempotency)
    // ─────────────────────────────────────────────────────────────────
    const currentStatus = await redis.get(`job:${jobId}:status`);
    
    if (currentStatus === 'completed') {
      console.log(`[WORKER] Job already completed: job=${jobId}`);
      return NextResponse.json({ status: 'already_completed' });
    }
    
    if (currentStatus === 'failed') {
      const attempts = await redis.get(`job:${jobId}:attempts`) || 0;
      if (Number(attempts) >= 3) {
        console.log(`[WORKER] Job permanently failed: job=${jobId}`);
        return NextResponse.json({ status: 'permanently_failed' });
      }
    }
    
    // ─────────────────────────────────────────────────────────────────
    // PHASE 4: Fetch Job Data
    // ─────────────────────────────────────────────────────────────────
    const jobData = await redis.get(`job:${jobId}`);
    if (!jobData) {
      console.error(`[WORKER] Job not found: job=${jobId}`);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    const job = typeof jobData === 'string' ? JSON.parse(jobData) : jobData;
    
    // ─────────────────────────────────────────────────────────────────
    // PHASE 5: Get GitHub Token (from secure store, not queue)
    // ─────────────────────────────────────────────────────────────────
    const token = await getDecryptedToken(userId);
    if (!token) {
      await updateJobStatus(jobId, 'failed', 'GitHub token expired');
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    // ─────────────────────────────────────────────────────────────────
    // PHASE 6: Check Rate Limits
    // ─────────────────────────────────────────────────────────────────
    const rateLimitOk = await checkGitHubRateLimit(userId);
    if (!rateLimitOk) {
      // Return 500 to trigger QStash retry with backoff
      console.warn(`[WORKER] Rate limited: job=${jobId}`);
      return NextResponse.json({ error: 'Rate limited' }, { status: 500 });
    }
    
    // ─────────────────────────────────────────────────────────────────
    // PHASE 7: Execute Pipeline
    // ─────────────────────────────────────────────────────────────────
    const octokit = new Octokit({ auth: token });
    const pipeline = new PRPipeline(octokit, redis, jobId);
    
    // Get checkpoint (resume from partial failure)
    const checkpoint = await redis.get(`job:${jobId}:checkpoint`);
    
    const result = await pipeline.execute(job, checkpoint as PipelineStage | null);
    
    // ─────────────────────────────────────────────────────────────────
    // PHASE 8: Store Result
    // ─────────────────────────────────────────────────────────────────
    if (result.success) {
      await Promise.all([
        redis.set(`job:${jobId}:status`, 'completed', { ex: 604800 }),
        redis.set(`job:${jobId}:result`, JSON.stringify({
          prNumber: result.prNumber,
          prUrl: result.prUrl,
          branch: result.branch,
        }), { ex: 604800 }),
      ]);
      
      console.log(`[WORKER] Success: job=${jobId}, pr=${result.prNumber}, duration=${Date.now() - startTime}ms`);
    } else {
      await incrementAttempts(jobId);
      throw new Error(result.error);
    }
    
    return NextResponse.json({ status: 'completed', pr: result.prUrl });
    
  } catch (error: any) {
    console.error(`[WORKER] Error: job=${jobId}`, error.message);
    
    // Increment attempt counter
    const attempts = await incrementAttempts(jobId);
    
    // Determine if error is retryable
    const isRetryable = isRetryableError(error);
    
    if (!isRetryable || attempts >= 3) {
      // Permanent failure
      await updateJobStatus(jobId, 'failed', error.message);
      // Return 200 to prevent QStash retry
      return NextResponse.json({ status: 'failed', error: error.message });
    }
    
    // Retryable failure - return 500 to trigger QStash retry
    await updateJobStatus(jobId, 'retrying', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
    
  } finally {
    // ─────────────────────────────────────────────────────────────────
    // PHASE 9: Release Lock
    // ─────────────────────────────────────────────────────────────────
    // Only release if we still hold the lock (compare-and-delete)
    const currentLock = await redis.get(lockKey);
    if (currentLock === lockValue) {
      await redis.del(lockKey);
    }
  }
}

async function updateJobStatus(jobId: string, status: string, message?: string): Promise<void> {
  await redis.set(`job:${jobId}:status`, status, { ex: 604800 });
  if (message) {
    await redis.set(`job:${jobId}:error`, message, { ex: 604800 });
  }
}

async function incrementAttempts(jobId: string): Promise<number> {
  return redis.incr(`job:${jobId}:attempts`);
}

async function checkGitHubRateLimit(userId: string): Promise<boolean> {
  const key = `rate:github:${userId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 3600); // 1 hour window
  }
  
  // Max 200 API calls per user per hour (conservative)
  return current <= 200;
}

function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // GitHub retryable statuses
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(error.status);
}
```

### Checkpointed Pipeline

```typescript
// lib/github/pipeline.ts
import { Octokit } from '@octokit/rest';
import { Redis } from '@upstash/redis';

export type PipelineStage = 
  | 'init'
  | 'fork_checked'
  | 'fork_created'
  | 'fork_synced'
  | 'branch_created'
  | 'blobs_created'
  | 'tree_created'
  | 'commit_created'
  | 'ref_updated'
  | 'pr_opened'
  | 'completed';

const STAGE_ORDER: PipelineStage[] = [
  'init',
  'fork_checked',
  'fork_created',
  'fork_synced',
  'branch_created',
  'blobs_created',
  'tree_created',
  'commit_created',
  'ref_updated',
  'pr_opened',
  'completed',
];

interface PipelineResult {
  success: boolean;
  prNumber?: number;
  prUrl?: string;
  branch?: string;
  error?: string;
}

interface JobData {
  id: string;
  userId: string;
  username: string;
  files: Array<{ path: string; content: string }>;
  gameName: string;
  category: string;
  description: string;
}

interface PipelineState {
  forkFullName?: string;
  baseSha?: string;
  branchName?: string;
  blobShas?: string[];
  treeSha?: string;
  commitSha?: string;
  prNumber?: number;
  prUrl?: string;
}

const UPSTREAM_OWNER = process.env.GITHUB_UPSTREAM_OWNER!;
const UPSTREAM_REPO = process.env.GITHUB_UPSTREAM_REPO!;

export class PRPipeline {
  private octokit: Octokit;
  private redis: Redis;
  private jobId: string;
  private state: PipelineState = {};
  
  constructor(octokit: Octokit, redis: Redis, jobId: string) {
    this.octokit = octokit;
    this.redis = redis;
    this.jobId = jobId;
  }
  
  async execute(job: JobData, resumeFrom: PipelineStage | null): Promise<PipelineResult> {
    // Load saved state if resuming
    if (resumeFrom) {
      const savedState = await this.redis.get(`job:${this.jobId}:state`);
      if (savedState) {
        this.state = typeof savedState === 'string' ? JSON.parse(savedState) : savedState;
      }
    }
    
    const startIndex = resumeFrom ? STAGE_ORDER.indexOf(resumeFrom) + 1 : 0;
    
    for (let i = startIndex; i < STAGE_ORDER.length - 1; i++) {
      const stage = STAGE_ORDER[i];
      
      try {
        await this.executeStage(stage, job);
        await this.checkpoint(stage);
        
        // Small delay between stages to avoid secondary rate limits
        await this.delay(100);
        
      } catch (error: any) {
        console.error(`[PIPELINE] Stage ${stage} failed:`, error.message);
        throw error;
      }
    }
    
    return {
      success: true,
      prNumber: this.state.prNumber,
      prUrl: this.state.prUrl,
      branch: this.state.branchName,
    };
  }
  
  private async executeStage(stage: PipelineStage, job: JobData): Promise<void> {
    await this.updateStatus(stage);
    
    switch (stage) {
      case 'fork_checked':
        await this.checkFork(job.username);
        break;
      case 'fork_created':
        await this.ensureFork(job.username);
        break;
      case 'fork_synced':
        await this.syncFork(job.username);
        break;
      case 'branch_created':
        await this.createBranch(job.username, job.gameName);
        break;
      case 'blobs_created':
        await this.createBlobs(job.username, job.files);
        break;
      case 'tree_created':
        await this.createTree(job.username, job.files);
        break;
      case 'commit_created':
        await this.createCommit(job.username, job.gameName, job.description);
        break;
      case 'ref_updated':
        await this.updateRef(job.username);
        break;
      case 'pr_opened':
        await this.openPR(job.username, job.gameName, job.description);
        break;
    }
  }
  
  private async checkFork(username: string): Promise<void> {
    // Check cache first
    const cached = await this.redis.get(`cache:fork:${username}`);
    if (cached === 'exists') {
      this.state.forkFullName = `${username}/${UPSTREAM_REPO}`;
      return;
    }
    
    try {
      const { data: repo } = await this.octokit.repos.get({
        owner: username,
        repo: UPSTREAM_REPO,
      });
      
      // Verify it's a fork of our repo
      if (repo.fork && repo.parent?.full_name === `${UPSTREAM_OWNER}/${UPSTREAM_REPO}`) {
        this.state.forkFullName = repo.full_name;
        await this.redis.set(`cache:fork:${username}`, 'exists', { ex: 300 }); // 5 min cache
        return;
      }
      
      throw new Error(`${username}/${UPSTREAM_REPO} exists but is not a fork`);
    } catch (error: any) {
      if (error.status === 404) {
        // Fork doesn't exist - will create in next stage
        return;
      }
      throw error;
    }
  }
  
  private async ensureFork(username: string): Promise<void> {
    if (this.state.forkFullName) {
      return; // Fork already exists
    }
    
    // Create fork
    const { data: fork } = await this.octokit.repos.createFork({
      owner: UPSTREAM_OWNER,
      repo: UPSTREAM_REPO,
    });
    
    // Wait for fork to be ready
    await this.waitForFork(username);
    
    this.state.forkFullName = fork.full_name;
    await this.redis.set(`cache:fork:${username}`, 'exists', { ex: 300 });
  }
  
  private async waitForFork(username: string, maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.octokit.repos.get({
          owner: username,
          repo: UPSTREAM_REPO,
        });
        return;
      } catch {
        await this.delay(2000);
      }
    }
    throw new Error('Fork creation timed out');
  }
  
  private async syncFork(username: string): Promise<void> {
    try {
      await this.octokit.repos.mergeUpstream({
        owner: username,
        repo: UPSTREAM_REPO,
        branch: 'main',
      });
    } catch (error: any) {
      // 409 = already up to date, that's fine
      if (error.status !== 409) {
        console.warn('[PIPELINE] Sync fork warning:', error.message);
      }
    }
    
    // Get base SHA
    const { data: ref } = await this.octokit.git.getRef({
      owner: username,
      repo: UPSTREAM_REPO,
      ref: 'heads/main',
    });
    
    this.state.baseSha = ref.object.sha;
  }
  
  private async createBranch(username: string, gameName: string): Promise<void> {
    // Generate branch name
    const slug = gameName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const timestamp = Date.now();
    this.state.branchName = `game/${slug}-${timestamp}`;
    
    // Check if branch already exists (idempotency)
    try {
      await this.octokit.git.getRef({
        owner: username,
        repo: UPSTREAM_REPO,
        ref: `heads/${this.state.branchName}`,
      });
      // Branch exists - likely a retry, skip creation
      return;
    } catch (error: any) {
      if (error.status !== 404) throw error;
    }
    
    // Create branch
    await this.octokit.git.createRef({
      owner: username,
      repo: UPSTREAM_REPO,
      ref: `refs/heads/${this.state.branchName}`,
      sha: this.state.baseSha!,
    });
  }
  
  private async createBlobs(
    username: string,
    files: Array<{ path: string; content: string }>
  ): Promise<void> {
    // Parallel blob creation (but throttled to avoid secondary limits)
    const batchSize = 3;
    const blobShas: string[] = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      const results = await Promise.all(
        batch.map(async (file) => {
          const { data: blob } = await this.octokit.git.createBlob({
            owner: username,
            repo: UPSTREAM_REPO,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          return blob.sha;
        })
      );
      
      blobShas.push(...results);
      
      // Small delay between batches
      if (i + batchSize < files.length) {
        await this.delay(50);
      }
    }
    
    this.state.blobShas = blobShas;
  }
  
  private async createTree(
    username: string,
    files: Array<{ path: string; content: string }>
  ): Promise<void> {
    const { data: tree } = await this.octokit.git.createTree({
      owner: username,
      repo: UPSTREAM_REPO,
      base_tree: this.state.baseSha!,
      tree: files.map((file, i) => ({
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: this.state.blobShas![i],
      })),
    });
    
    this.state.treeSha = tree.sha;
  }
  
  private async createCommit(
    username: string,
    gameName: string,
    description: string
  ): Promise<void> {
    const { data: commit } = await this.octokit.git.createCommit({
      owner: username,
      repo: UPSTREAM_REPO,
      message: `feat(game): add ${gameName}\n\n${description}\n\nSubmitted via Platform Browser IDE`,
      tree: this.state.treeSha!,
      parents: [this.state.baseSha!],
    });
    
    this.state.commitSha = commit.sha;
  }
  
  private async updateRef(username: string): Promise<void> {
    await this.octokit.git.updateRef({
      owner: username,
      repo: UPSTREAM_REPO,
      ref: `heads/${this.state.branchName}`,
      sha: this.state.commitSha!,
      force: false,
    });
  }
  
  private async openPR(
    username: string,
    gameName: string,
    description: string
  ): Promise<void> {
    // Check for existing PR (idempotency)
    const { data: existingPRs } = await this.octokit.pulls.list({
      owner: UPSTREAM_OWNER,
      repo: UPSTREAM_REPO,
      head: `${username}:${this.state.branchName}`,
      state: 'open',
    });
    
    if (existingPRs.length > 0) {
      // PR already exists
      this.state.prNumber = existingPRs[0].number;
      this.state.prUrl = existingPRs[0].html_url;
      return;
    }
    
    // Create PR
    const { data: pr } = await this.octokit.pulls.create({
      owner: UPSTREAM_OWNER,
      repo: UPSTREAM_REPO,
      title: `feat(game): ${gameName}`,
      body: this.generatePRBody(username, gameName, description),
      head: `${username}:${this.state.branchName}`,
      base: 'main',
    });
    
    this.state.prNumber = pr.number;
    this.state.prUrl = pr.html_url;
  }
  
  private generatePRBody(username: string, gameName: string, description: string): string {
    return `## Game Submission

**Name:** ${gameName}
**Author:** @${username}

### Description

${description || 'No description provided.'}

---

*Submitted via [Platform Browser IDE](https://platform.dev/editor)*
*This is an automatically generated PR - validation will run automatically*
`;
  }
  
  private async checkpoint(stage: PipelineStage): Promise<void> {
    await Promise.all([
      this.redis.set(`job:${this.jobId}:checkpoint`, stage, { ex: 604800 }),
      this.redis.set(`job:${this.jobId}:state`, JSON.stringify(this.state), { ex: 604800 }),
    ]);
  }
  
  private async updateStatus(stage: PipelineStage): Promise<void> {
    await this.redis.set(`job:${this.jobId}:status`, stage, { ex: 604800 });
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Part 4: Failure Handling & DLQ

### Retry Strategy

```typescript
// lib/retry.ts

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number; // 0-1
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.3,
};

/**
 * Calculate delay for exponential backoff with jitter.
 */
export function calculateBackoff(attempt: number, config = DEFAULT_RETRY_CONFIG): number {
  // Exponential: 1s, 2s, 4s, 8s...
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1);
  
  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  
  // Add jitter (±30% by default)
  const jitterRange = cappedDelay * config.jitterFactor;
  const jitter = (Math.random() * 2 - 1) * jitterRange;
  
  return Math.round(cappedDelay + jitter);
}

/**
 * Retry decision matrix.
 */
export function shouldRetry(error: any, attempt: number, config = DEFAULT_RETRY_CONFIG): boolean {
  // Max attempts exceeded
  if (attempt >= config.maxAttempts) {
    return false;
  }
  
  // Permanent failures (never retry)
  const permanentErrors = [
    'VALIDATION_ERROR',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',           // User deleted account/fork
    'ABUSE_DETECTED',      // GitHub abuse flag
  ];
  
  if (permanentErrors.includes(error.code)) {
    return false;
  }
  
  // GitHub-specific permanent failures
  if (error.status === 401 || error.status === 403 || error.status === 404) {
    // Check if abuse detection
    if (error.message?.includes('abuse')) {
      return false;
    }
    // Auth issues are not retryable
    if (error.status === 401) {
      return false;
    }
  }
  
  // Retryable errors
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  const retryableNetworkCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
  
  return retryableStatuses.includes(error.status) || 
         retryableNetworkCodes.includes(error.code);
}
```

### Dead Letter Queue Handler

```typescript
// app/api/workers/process-pr/failure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { jobId, userId, error, attempts } = body;
  
  console.error(`[DLQ] Job failed permanently: job=${jobId}, error=${error}`);
  
  // Store in DLQ
  await redis.zadd('dlq:jobs', { score: Date.now(), member: JSON.stringify({
    jobId,
    userId,
    error,
    attempts,
    failedAt: new Date().toISOString(),
  })});
  
  // Update job status
  await redis.set(`job:${jobId}:status`, 'failed', { ex: 604800 });
  await redis.set(`job:${jobId}:error`, error, { ex: 604800 });
  
  // Send alert
  await sendAlert({
    type: 'DLQ',
    jobId,
    error,
    userId,
    timestamp: new Date().toISOString(),
  });
  
  return NextResponse.json({ status: 'dlq_received' });
}

async function sendAlert(data: any): Promise<void> {
  // Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 *DLQ Alert*\nJob: \`${data.jobId}\`\nError: ${data.error}`,
        channel: '#platform-alerts',
      }),
    });
  }
}
```

### Error Classification

```typescript
// lib/errors.ts

export enum ErrorCategory {
  TRANSIENT = 'transient',      // Retry automatically
  RATE_LIMIT = 'rate_limit',    // Retry with longer delay
  PERMANENT = 'permanent',      // Don't retry, alert
  USER_ERROR = 'user_error',    // Don't retry, notify user
}

export function classifyError(error: any): ErrorCategory {
  // GitHub rate limit
  if (error.status === 403 && error.message?.includes('rate limit')) {
    return ErrorCategory.RATE_LIMIT;
  }
  
  // GitHub secondary rate limit
  if (error.status === 403 && error.message?.includes('secondary')) {
    return ErrorCategory.RATE_LIMIT;
  }
  
  // GitHub abuse detection
  if (error.status === 403 && error.message?.includes('abuse')) {
    return ErrorCategory.PERMANENT;
  }
  
  // Auth failures
  if (error.status === 401) {
    return ErrorCategory.USER_ERROR;
  }
  
  // Not found (user deleted repo/fork)
  if (error.status === 404) {
    return ErrorCategory.USER_ERROR;
  }
  
  // Network/server errors
  if ([408, 429, 500, 502, 503, 504].includes(error.status)) {
    return ErrorCategory.TRANSIENT;
  }
  
  // Unknown errors default to transient (will hit max retries if persistent)
  return ErrorCategory.TRANSIENT;
}
```

---

## Part 5: GitHub Rate Limit Strategy

### Rate Limit Math

```
Given:
- GitHub limit: 5,000 requests/hour per user token
- PR creation: ~15 API calls
- Safety margin: 80% utilization

Calculations:

Max PRs per user per hour:
  5,000 × 0.80 / 15 = 266 PRs/hour/user

With 5 PR/hour per-user limit (rate limit config):
  Never hit GitHub limits (266 >> 5)

Max concurrent users (burst):
  5,000 / 15 = 333 simultaneous PR creations

Secondary rate limit considerations:
  GitHub's secondary limit: ~100 content-creating requests/minute
  15 calls per PR, some content-creating
  Safe: ~6 PRs/minute = 360/hour

Global platform limit (conservative):
  Target: 300 PRs/hour peak
  With 15 calls each: 4,500 calls/hour (within single user's limit)
  Distribute across users: Easily sustainable
```

### Adaptive Throttling

```typescript
// lib/github/rate-limit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface RateLimitState {
  remaining: number;
  reset: number;
  isSecondaryLimited: boolean;
}

/**
 * Check if we should proceed with GitHub API call.
 */
export async function checkGitHubRateLimit(userId: string): Promise<boolean> {
  const keys = await Promise.all([
    redis.get(`rate:github:${userId}`),
    redis.get('rate:github:global'),
    redis.get('rate:github:secondary'),
  ]);
  
  const [userCalls, globalCalls, secondaryBlocked] = keys;
  
  // Check secondary rate limit block
  if (secondaryBlocked === 'blocked') {
    return false;
  }
  
  // Per-user limit: 200 calls/hour (well under 5,000)
  if (Number(userCalls || 0) >= 200) {
    return false;
  }
  
  // Global limit: 4,000 calls/hour across all users
  if (Number(globalCalls || 0) >= 4000) {
    return false;
  }
  
  return true;
}

/**
 * Record API call for rate tracking.
 */
export async function recordGitHubCall(userId: string): Promise<void> {
  const pipeline = redis.pipeline();
  
  // Per-user counter
  pipeline.incr(`rate:github:${userId}`);
  pipeline.expire(`rate:github:${userId}`, 3600);
  
  // Global counter
  pipeline.incr('rate:github:global');
  pipeline.expire('rate:github:global', 3600);
  
  await pipeline.exec();
}

/**
 * Handle rate limit response from GitHub.
 */
export async function handleRateLimitResponse(
  headers: Headers,
  isSecondary: boolean
): Promise<void> {
  if (isSecondary) {
    // Secondary rate limit - block all requests for 1 minute
    await redis.set('rate:github:secondary', 'blocked', { ex: 60 });
    console.warn('[RATE_LIMIT] Secondary rate limit hit, blocking for 60s');
    return;
  }
  
  // Primary rate limit - check headers
  const remaining = parseInt(headers.get('x-ratelimit-remaining') || '0');
  const reset = parseInt(headers.get('x-ratelimit-reset') || '0');
  
  if (remaining < 100) {
    // Getting close to limit, start throttling
    const throttleTime = Math.min(reset - Date.now() / 1000, 3600);
    await redis.set('rate:github:throttle', 'true', { ex: Math.ceil(throttleTime) });
    console.warn(`[RATE_LIMIT] Throttling enabled, ${remaining} remaining`);
  }
}

/**
 * Get delay to apply between API calls.
 */
export async function getAdaptiveDelay(): Promise<number> {
  const isThrottled = await redis.get('rate:github:throttle');
  
  if (isThrottled) {
    return 500; // 500ms delay when throttled
  }
  
  return 50; // Normal 50ms delay
}
```

### Batching Strategy

```typescript
// lib/github/batch.ts

/**
 * GitHub API doesn't support true batching, but we can:
 * 1. Parallel blob creation (with limits)
 * 2. Cache fork existence
 * 3. Cache branch SHA
 */

export async function createBlobsBatched(
  octokit: Octokit,
  owner: string,
  repo: string,
  files: Array<{ path: string; content: string }>,
  batchSize = 3,
  delayMs = 50
): Promise<string[]> {
  const shas: string[] = [];
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    // Parallel within batch
    const results = await Promise.all(
      batch.map(file =>
        octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        })
      )
    );
    
    shas.push(...results.map(r => r.data.sha));
    
    // Delay between batches
    if (i + batchSize < files.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  
  return shas;
}
```

---

## Part 6: Data Model

### Redis Schema

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    REDIS SCHEMA                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  JOB DATA                                                                                │
│  ────────                                                                                │
│                                                                                          │
│  job:{jobId}                    │ JSON │ TTL: 7 days                                    │
│  ├── id: string                 │      │ Full job payload                              │
│  ├── userId: string             │      │                                               │
│  ├── username: string           │      │                                               │
│  ├── files: Array<{path,content}> │    │                                               │
│  ├── gameName: string           │      │                                               │
│  ├── category: string           │      │                                               │
│  ├── description: string        │      │                                               │
│  └── createdAt: number          │      │                                               │
│                                                                                          │
│  job:{jobId}:status             │ string │ TTL: 7 days                                  │
│  └── "pending" | "fork_checked" | "branch_created" | ... | "completed" | "failed"      │
│                                                                                          │
│  job:{jobId}:attempts           │ number │ TTL: 7 days                                  │
│  └── 0, 1, 2, 3                 │        │ Retry counter                               │
│                                                                                          │
│  job:{jobId}:checkpoint         │ string │ TTL: 7 days                                  │
│  └── Last successful stage      │        │ For resume on retry                         │
│                                                                                          │
│  job:{jobId}:state              │ JSON │ TTL: 7 days                                    │
│  └── Pipeline intermediate state (shas, branch name, etc.)                             │
│                                                                                          │
│  job:{jobId}:result             │ JSON │ TTL: 7 days                                    │
│  └── { prNumber, prUrl, branch } on success                                            │
│                                                                                          │
│  job:{jobId}:error              │ string │ TTL: 7 days                                  │
│  └── Error message on failure   │        │                                             │
│                                                                                          │
│  ──────────────────────────────────────────────────────────────────────────────────────│
│                                                                                          │
│  LOCKS                                                                                   │
│  ─────                                                                                   │
│                                                                                          │
│  lock:job:{jobId}               │ string │ TTL: 60 seconds                              │
│  └── {timestamp}_{random}       │        │ Distributed lock for worker                 │
│                                                                                          │
│  ──────────────────────────────────────────────────────────────────────────────────────│
│                                                                                          │
│  USER DATA                                                                               │
│  ─────────                                                                               │
│                                                                                          │
│  user:{userId}:jobs             │ ZSET │ TTL: 30 days                                   │
│  └── score=timestamp, member=jobId                                                      │
│                                                                                          │
│  user:{userId}:daily_count      │ number │ TTL: 24 hours                                │
│  └── Daily submission counter   │        │                                             │
│                                                                                          │
│  token:{userId}                 │ string │ TTL: 7 days (session lifetime)               │
│  └── AES-256-GCM encrypted GitHub token                                                 │
│                                                                                          │
│  ──────────────────────────────────────────────────────────────────────────────────────│
│                                                                                          │
│  RATE LIMITING                                                                           │
│  ─────────────                                                                           │
│                                                                                          │
│  rate:submit:{userId}           │ number │ TTL: 1 hour                                  │
│  └── Hourly submission counter  │        │ (5/hour limit)                              │
│                                                                                          │
│  rate:github:{userId}           │ number │ TTL: 1 hour                                  │
│  └── Per-user GitHub API calls  │        │ (200/hour limit)                            │
│                                                                                          │
│  rate:github:global             │ number │ TTL: 1 hour                                  │
│  └── Global GitHub API calls    │        │ (4,000/hour limit)                          │
│                                                                                          │
│  rate:github:secondary          │ string │ TTL: 60 seconds                              │
│  └── "blocked" when secondary rate limit hit                                            │
│                                                                                          │
│  rate:github:throttle           │ string │ TTL: dynamic (until reset)                  │
│  └── "true" when approaching limits                                                     │
│                                                                                          │
│  ──────────────────────────────────────────────────────────────────────────────────────│
│                                                                                          │
│  CACHING                                                                                 │
│  ───────                                                                                 │
│                                                                                          │
│  cache:fork:{userId}            │ string │ TTL: 5 minutes                               │
│  └── "exists"                   │        │ Avoid repeated fork checks                  │
│                                                                                          │
│  cache:upstream:sha             │ string │ TTL: 1 minute                                │
│  └── Main branch SHA            │        │ Avoid repeated ref fetches                  │
│                                                                                          │
│  ──────────────────────────────────────────────────────────────────────────────────────│
│                                                                                          │
│  DEDUPLICATION                                                                           │
│  ─────────────                                                                           │
│                                                                                          │
│  content_hash:{hash}            │ string │ TTL: 24 hours                                │
│  └── userId of original submitter                                                       │
│                                                                                          │
│  ──────────────────────────────────────────────────────────────────────────────────────│
│                                                                                          │
│  DLQ                                                                                     │
│  ───                                                                                     │
│                                                                                          │
│  dlq:jobs                       │ ZSET │ TTL: none (manual cleanup)                     │
│  └── score=timestamp, member=JSON{jobId,error,userId,failedAt}                          │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### TTL Strategy

| Key Pattern | TTL | Rationale |
|-------------|-----|-----------|
| `job:*` | 7 days | Job history for user to view |
| `lock:*` | 60 seconds | Prevent stuck locks |
| `token:*` | 7 days | Match session lifetime |
| `rate:submit:*` | 1 hour | Sliding window |
| `rate:github:*` | 1 hour | Match GitHub's window |
| `cache:fork:*` | 5 minutes | Fork won't be deleted often |
| `cache:upstream:sha` | 1 minute | May update frequently |
| `content_hash:*` | 24 hours | Allow resubmit after cooldown |
| `dlq:jobs` | None | Manual cleanup |

---

## Part 7: Frontend Status System

### Status Polling Endpoint

```typescript
// app/api/job/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getSessionUser } from '@/lib/auth';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const runtime = 'edge';

interface Params {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const jobId = params.id;
  
  // Verify job belongs to user
  const jobData = await redis.get(`job:${jobId}`);
  if (!jobData) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  
  const job = typeof jobData === 'string' ? JSON.parse(jobData) : jobData;
  if (job.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Get status and result
  const [status, result, error, attempts] = await Promise.all([
    redis.get(`job:${jobId}:status`),
    redis.get(`job:${jobId}:result`),
    redis.get(`job:${jobId}:error`),
    redis.get(`job:${jobId}:attempts`),
  ]);
  
  const response: any = {
    jobId,
    status,
    attempts: Number(attempts || 0),
    gameName: job.gameName,
    createdAt: job.createdAt,
  };
  
  if (status === 'completed' && result) {
    const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
    response.pr = parsedResult;
  }
  
  if (status === 'failed' && error) {
    response.error = error;
  }
  
  // Add progress percentage for UI
  response.progress = calculateProgress(status as string);
  
  // Cache control - if completed/failed, can cache longer
  const isTerminal = status === 'completed' || status === 'failed';
  const cacheControl = isTerminal 
    ? 'public, max-age=60' 
    : 'private, no-cache';
  
  return NextResponse.json(response, {
    headers: { 'Cache-Control': cacheControl },
  });
}

function calculateProgress(status: string): number {
  const stages: Record<string, number> = {
    'pending': 0,
    'fork_checked': 10,
    'fork_created': 20,
    'fork_synced': 30,
    'branch_created': 40,
    'blobs_created': 60,
    'tree_created': 70,
    'commit_created': 80,
    'ref_updated': 90,
    'pr_opened': 95,
    'completed': 100,
    'failed': 100,
  };
  return stages[status] ?? 0;
}
```

### Frontend Hook

```typescript
// hooks/useJobStatus.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface JobStatus {
  jobId: string;
  status: string;
  progress: number;
  attempts: number;
  gameName: string;
  createdAt: number;
  pr?: {
    prNumber: number;
    prUrl: string;
    branch: string;
  };
  error?: string;
}

interface UseJobStatusOptions {
  pollingInterval?: number;
  maxPollingTime?: number;
}

export function useJobStatus(
  jobId: string | null,
  options: UseJobStatusOptions = {}
): {
  status: JobStatus | null;
  isPolling: boolean;
  error: Error | null;
} {
  const { pollingInterval = 2000, maxPollingTime = 120000 } = options;
  
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const pollStartRef = useRef<number>(0);
  const pollCountRef = useRef<number>(0);
  
  const fetchStatus = useCallback(async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`/api/job/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data);
      
      // Stop polling if terminal state
      if (data.status === 'completed' || data.status === 'failed') {
        setIsPolling(false);
        return true; // Signal to stop
      }
      
      return false;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, [jobId]);
  
  useEffect(() => {
    if (!jobId) {
      setStatus(null);
      setIsPolling(false);
      return;
    }
    
    setIsPolling(true);
    pollStartRef.current = Date.now();
    pollCountRef.current = 0;
    
    const poll = async () => {
      pollCountRef.current++;
      
      // Adaptive polling: slow down after initial burst
      const actualInterval = pollCountRef.current > 5 
        ? pollingInterval * 1.5 
        : pollingInterval;
      
      const shouldStop = await fetchStatus();
      
      if (shouldStop) return;
      
      // Check max polling time
      if (Date.now() - pollStartRef.current > maxPollingTime) {
        setIsPolling(false);
        setError(new Error('Polling timeout'));
        return;
      }
      
      // Schedule next poll
      setTimeout(poll, actualInterval);
    };
    
    // Initial fetch immediately
    poll();
    
    return () => {
      setIsPolling(false);
    };
  }, [jobId, pollingInterval, maxPollingTime, fetchStatus]);
  
  return { status, isPolling, error };
}
```

### Polling Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Fixed 1s polling | Hammers API | 2s minimum, increase over time |
| No max timeout | Polls forever | 2 minute max |
| Retry on error | Cascading failure | Exponential backoff |
| No cache headers | Unnecessary fetches | Cache terminal states |
| Multiple tabs polling | Multiplied load | SharedWorker or visibility API |

---

## Part 8: Scalability Plan

### Tier 1: 0-500 Users/Day

```
Architecture:
- Vercel Functions (producer)
- QStash (queue)
- Vercel Functions (worker)
- Upstash Redis (state)

Cost:
- Vercel: Free tier (100GB bandwidth)
- QStash: Free tier (500 messages/day)
- Redis: Free tier (10K commands/day)
Total: $0/month

Limits:
- ~100 PRs/day (QStash free tier)
- Upgrade when exceeding free tiers
```

### Tier 2: 500-2,000 Users/Day

```
Architecture:
- Same as Tier 1
- Vercel Pro (higher limits)
- Upstash Pro (more commands)

Cost:
- Vercel Pro: $20/month
- QStash: $1/1M messages
- Redis: $10/month (100K commands/day)
Total: ~$35/month

Limits:
- ~500 PRs/day
- Upgrade when queue latency > 30s
```

### Tier 3: 2,000-5,000 Users/Day

```
Architecture:
- Vercel Pro (producer)
- QStash Pro
- Dedicated worker (Railway/Render)
- Upstash Redis Pro

Changes:
- Move worker off Vercel (no 60s timeout)
- Add database (PlanetScale) for analytics
- Add Redis cluster mode

Cost:
- Vercel: $20/month
- Worker hosting: $20/month
- Redis: $50/month
- Database: $30/month
Total: ~$120/month

Limits:
- ~1,000 PRs/day
- Migrate to GitHub App for rate limits
```

### Tier 4: 5,000-10,000+ Users/Day

```
Architecture:
- GitHub App (organization-wide token)
- Dedicated Kubernetes workers
- Redis Cluster
- SQS/Kafka for queue (consider)
- Read replicas for status queries

Changes:
- GitHub App provides 5,000 req/hr × N installations
- Horizontal worker scaling
- Background PR processing with webhooks
- Event-driven architecture

Cost:
- Infrastructure: ~$500/month
- May need GitHub Enterprise for support

Consider:
- Multiple GitHub Apps for load distribution
- Webhook-based status updates (eliminate polling)
- Geographic distribution
```

### Migration Decision Tree

```
                    ┌──────────────────────────┐
                    │  Current Traffic Level?  │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
        < 500/day          500-2K/day          > 2K/day
              │                  │                  │
              ▼                  ▼                  ▼
        ┌─────────┐        ┌─────────┐        ┌─────────┐
        │  Free   │        │  Pro    │        │ Migrate │
        │  Tiers  │        │  Tiers  │        │  to     │
        │         │        │         │        │ GitHub  │
        │         │        │         │        │  App    │
        └─────────┘        └─────────┘        └─────────┘
                                 │                  │
                                 ▼                  ▼
                           ┌─────────┐        ┌─────────┐
                           │ Latency │        │ Workers │
                           │ > 30s?  │        │ on      │
                           │         │        │ Vercel? │
                           └────┬────┘        └────┬────┘
                                │                  │
                           Yes  │                  │ Yes
                                ▼                  ▼
                           ┌─────────┐        ┌─────────┐
                           │ Add     │        │ Move to │
                           │ Worker  │        │ Railway │
                           │ Caching │        │ /Render │
                           └─────────┘        └─────────┘
```

---

## Part 9: Edge Cases

### User Deletes Fork Mid-Process

```typescript
// In pipeline, wrap fork operations:
try {
  await this.octokit.repos.get({ owner: username, repo: UPSTREAM_REPO });
} catch (error: any) {
  if (error.status === 404) {
    // Fork was deleted - recreate or fail gracefully
    await this.redis.del(`cache:fork:${username}`);
    
    // Option 1: Recreate fork and restart
    if (this.checkpoint === 'fork_checked') {
      return this.execute(job, null); // Restart from beginning
    }
    
    // Option 2: Fail with user-friendly message
    throw new Error('Fork was deleted. Please try again.');
  }
  throw error;
}
```

### Main Repo Updated During PR Creation

```typescript
// In createCommit, check for divergence:
const { data: currentRef } = await this.octokit.git.getRef({
  owner: username,
  repo: UPSTREAM_REPO,
  ref: 'heads/main',
});

if (currentRef.object.sha !== this.state.baseSha) {
  // Main branch moved - need to rebase or sync
  console.warn('[PIPELINE] Base branch moved during PR creation');
  
  // Sync fork and retry
  await this.syncFork(username);
  this.state.baseSha = currentRef.object.sha;
  
  // Recreate branch from new base
  await this.octokit.git.updateRef({
    owner: username,
    repo: UPSTREAM_REPO,
    ref: `heads/${this.state.branchName}`,
    sha: currentRef.object.sha,
    force: true,
  });
  
  // Re-execute from blobs stage
  throw new RetryableError('Base branch updated, retrying');
}
```

### Identical Submissions from Multiple Users

```typescript
// Content-hash based deduplication
const contentHash = generateContentHash(files);
const duplicateKey = `content_hash:${contentHash}`;

const existingSubmitter = await redis.get(duplicateKey);

if (existingSubmitter && existingSubmitter !== userId) {
  // Another user submitted identical content
  return NextResponse.json({
    error: 'This exact game was already submitted by another user.',
    hint: 'If this is your original work, please make it unique.',
  }, { status: 409 });
}

// If same user, allow (they might be retrying)
if (existingSubmitter === userId) {
  // Check if they have a pending/completed job
  const existingJobId = generateJobId(userId, files);
  const existingStatus = await redis.get(`job:${existingJobId}:status`);
  
  if (existingStatus === 'completed') {
    return NextResponse.json({
      error: 'You already submitted this game.',
      jobId: existingJobId,
    }, { status: 409 });
  }
}
```

### Replay Attacks

```typescript
// In producer endpoint, add timestamp validation:
interface SubmitRequest {
  files: Array<{ path: string; content: string }>;
  gameName: string;
  // ...
  timestamp: number;  // Client must send
  nonce: string;      // Random string
}

// Validate timestamp is within 5 minutes
const now = Date.now();
if (Math.abs(now - body.timestamp) > 5 * 60 * 1000) {
  return NextResponse.json({ error: 'Request expired' }, { status: 400 });
}

// Check nonce hasn't been used
const nonceKey = `nonce:${body.nonce}`;
const nonceUsed = await redis.exists(nonceKey);
if (nonceUsed) {
  return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
}
await redis.set(nonceKey, '1', { ex: 600 }); // 10 minute TTL
```

### Redis Outage

```typescript
// Wrap Redis operations with circuit breaker:
import { CircuitBreaker } from '@/lib/circuit-breaker';

const redisBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000,
});

async function safeRedisGet(key: string): Promise<any> {
  return redisBreaker.execute(async () => {
    return redis.get(key);
  }, {
    fallback: async () => {
      // Return cached value from local memory or null
      return localCache.get(key) ?? null;
    },
  });
}

// In producer, fail gracefully:
try {
  await redis.set(`job:${jobId}:status`, 'pending');
} catch (error) {
  console.error('[REDIS] Outage detected:', error);
  
  // Option 1: Return 503 (temporary failure)
  return NextResponse.json({ 
    error: 'Service temporarily unavailable' 
  }, { status: 503 });
  
  // Option 2: Queue anyway, let worker handle
  // (risky - may lose job tracking)
}
```

### QStash Delivery Duplication

```typescript
// QStash has at-least-once delivery, so duplicates are possible

// In worker, use message ID for deduplication:
export async function POST(request: NextRequest) {
  const messageId = request.headers.get('upstash-message-id');
  
  if (messageId) {
    const dedupeKey = `qstash:msg:${messageId}`;
    const seen = await redis.set(dedupeKey, '1', { nx: true, ex: 86400 });
    
    if (!seen) {
      // Duplicate delivery
      console.log(`[WORKER] Duplicate message: ${messageId}`);
      return NextResponse.json({ status: 'duplicate' });
    }
  }
  
  // Continue with processing...
}
```

---

## Common Distributed System Mistakes

| Mistake | Consequence | Prevention |
|---------|-------------|------------|
| No idempotency keys | Duplicate PRs | Deterministic job IDs |
| Trusting queue order | Race conditions | Lock before process |
| Unbounded retries | Resource exhaustion | Max attempts + DLQ |
| Synchronous callbacks | Timeout failures | Async + polling |
| In-memory state | Lost on crash | Redis checkpointing |
| No backpressure | Cascading failure | Rate limiting + circuit breakers |
| Optimistic locking | Lost updates | Distributed locks |
| Fire-and-forget | Silent failures | DLQ + alerting |
| Shared mutable state | Data races | Immutable job payloads |
| No circuit breakers | Dependency failures propagate | Fail fast, fallback |
| Polling without jitter | Thundering herd | Randomized intervals |
| Logging tokens | Security breach | Redact sensitive data |

---

## Summary

```
PRODUCER (/api/submit)
├── Validate synchronously (< 200ms)
├── Generate deterministic job ID
├── Store job state in Redis
├── Enqueue to QStash (job ID only, no token)
└── Return immediately with polling URL

QUEUE (QStash)
├── At-least-once delivery
├── Exponential backoff (built-in)
├── 3 retry attempts
├── Failure callback → DLQ
└── Signature verification

WORKER (/api/workers/process-pr)
├── Verify QStash signature
├── Acquire distributed lock
├── Check idempotency (already completed?)
├── Fetch job data from Redis
├── Fetch token from secure store
├── Execute checkpointed pipeline
│   ├── fork_checked
│   ├── fork_created
│   ├── fork_synced
│   ├── branch_created
│   ├── blobs_created
│   ├── tree_created
│   ├── commit_created
│   ├── ref_updated
│   └── pr_opened
├── Store result
├── Release lock
└── Return 200 (success) or 500 (retry)

STATUS (/api/job/:id)
├── Verify ownership
├── Return current status + progress
├── Cache completed states
└── Include PR URL when done

FRONTEND
├── Poll every 2s initially
├── Increase interval after 5 polls
├── Stop at completed/failed
├── Max 2 minute timeout
└── Show progress bar + messages
```

**Total API calls per PR:** ~15  
**Max sustainable:** ~300 PRs/hour (conservative)  
**P99 latency:** < 60s for PR creation  
**Availability target:** 99.9% (queue ensures no lost submissions)
