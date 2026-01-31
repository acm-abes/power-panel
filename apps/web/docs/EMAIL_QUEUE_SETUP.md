<!-- @format -->

# Email Queue System Setup Guide

## Overview

The email system now uses a queue-based architecture with Resend as the email provider:

- **Web App**: Enqueues email jobs
- **Worker**: Processes jobs and sends emails via Resend
- **Queue**: BullMQ (Redis-backed)

## Prerequisites

1. **Redis Server**: Must be running

   ```bash
   # Install Redis (if not installed)
   # Windows: Use WSL or Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Environment Variables**:

   **Web App** (`.env` in `apps/web/`):

   ```env
   REDIS_URL=redis://localhost:6379
   DATABASE_URL=postgresql://...
   ```

   **Worker** (`.env` in `apps/worker/`):

   ```env
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM="No Reply <noreply@yourdomain.com>"
   REDIS_URL=redis://localhost:6379
   DATABASE_URL=postgresql://...  # Must match web app
   ```

## How to Run

### 1. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or if installed locally
redis-server
```

### 2. Start the Worker

```bash
cd apps/worker
bun run index.ts
```

You should see:

```
📨 Email worker starting...
```

### 3. Start the Web App

```bash
cd apps/web
bun dev
```

### 4. Send Test Emails

1. Navigate to `/admin/email` in the web app
2. Load an email list (e.g., "Incomplete Teams")
3. Select email template (e.g., "Incomplete Team Alert")
4. Click "Send Emails"

The emails will be:

1. ✅ Enqueued in Redis
2. 📨 Picked up by the worker
3. 📧 Sent via Resend
4. 💾 Tracked in the database

## Monitoring

### Check Queue Status

```bash
# Using Redis CLI
redis-cli
> LLEN bullmq:email:wait    # Jobs waiting
> LLEN bullmq:email:active  # Jobs processing
> LLEN bullmq:email:failed  # Failed jobs
```

### Check Database

```sql
-- View email jobs
SELECT * FROM email_job ORDER BY created_at DESC;

-- Check success rate
SELECT
  status,
  COUNT(*) as count
FROM email_job
GROUP BY status;
```

## Architecture

### Flow Diagram

```
┌─────────────┐         ┌─────────┐         ┌─────────────┐
│  Web App    │ enqueue │  Redis  │ consume │   Worker    │
│ (Next.js)   ├────────►│ (Queue) ├────────►│  (BullMQ)   │
└─────────────┘         └─────────┘         └──────┬──────┘
                                                    │
                                                    │ send
                                                    ▼
                                            ┌───────────────┐
                                            │    Resend     │
                                            │  (Email API)  │
                                            └───────────────┘
```

### Key Files

**Web App**:

- `/src/lib/queue.ts` - Queue setup
- `/src/actions/send-emails.ts` - Email action (enqueues jobs)
- `/src/app/admin/email/page.tsx` - Email management UI

**Worker**:

- `/src/worker.ts` - Main worker process
- `/src/mailer.ts` - Resend integration
- `/src/queue.ts` - Queue reference
- `/src/redis.ts` - Redis connection

**Shared**:

- `/packages/queue/` - Queue factory and types

## Troubleshooting

### Worker not starting

- ✅ Check Redis is running: `redis-cli ping` (should return PONG)
- ✅ Check DATABASE_URL is correct
- ✅ Check RESEND_API_KEY is set

### Emails not sending

- ✅ Check worker logs for errors
- ✅ Verify Resend API key is valid
- ✅ Check email jobs table for error messages
- ✅ Check Redis queue: `redis-cli LLEN bullmq:email:wait`

### Jobs stuck in queue

- ✅ Restart the worker
- ✅ Check worker concurrency settings in `worker.ts`
- ✅ Check for rate limiting from Resend

## Configuration

### Concurrency

Edit `apps/worker/src/worker.ts`:

```typescript
const worker = new Worker<SendEmailJob>(
  EMAIL_QUEUE,
  async (job) => { ... },
  {
    connection,
    concurrency: 5, // <-- Adjust this (1-10)
  }
);
```

### Retry Policy

Add to worker options:

```typescript
{
  connection,
  concurrency: 5,
  settings: {
    maxReconnectionAttempts: 3,
    retries: 3, // Retry failed jobs 3 times
  }
}
```

## Development Tips

- Watch worker logs in real-time for debugging
- Use Resend dashboard to monitor delivery rates
- Check `email_job` table for campaign analytics
- Use `campaignId` to group related emails
