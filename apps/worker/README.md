<!-- @format -->

# Email Worker

Background worker for processing email sending queue using BullMQ and Resend.

## Setup

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your values:
   - `RESEND_API_KEY`: Your Resend API key
   - `EMAIL_FROM`: Default sender email address
   - `REDIS_URL`: Redis connection URL
   - `DATABASE_URL`: PostgreSQL database URL (same as main app)

3. **Start the worker:**
   ```bash
   bun run index.ts
   ```

## How It Works

The worker:

1. Connects to Redis and listens for jobs on the `email` queue
2. Processes email jobs sent from the web application
3. Sends emails via Resend API
4. Updates the database with delivery status (SENT/FAILED)
5. Tracks each email job with campaign ID for analytics

## Architecture

- **Queue**: BullMQ (Redis-backed)
- **Email Provider**: Resend
- **Database**: PostgreSQL (via Prisma)
- **Concurrency**: 5 emails at a time (configurable)

## Error Handling

- Failed jobs are logged to the database with error messages
- Worker automatically retries failed jobs based on BullMQ configuration
- Process gracefully shuts down on SIGTERM
