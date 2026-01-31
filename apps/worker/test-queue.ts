#!/usr/bin/env bun
/** @format */

/**
 * Quick test script to verify email queue connectivity
 * Run: bun run test-queue.ts
 */

import IORedis from "ioredis";
import { createEmailQueue } from "@power/queue/src/factory";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

async function testQueue() {
  console.log("🧪 Testing Email Queue Connection...\n");

  const redis = new IORedis(REDIS_URL);

  try {
    // Test Redis connection
    console.log("1️⃣ Testing Redis connection...");
    const pong = await redis.ping();
    if (pong === "PONG") {
      console.log("   ✅ Redis connected successfully\n");
    } else {
      throw new Error("Redis ping failed");
    }

    // Create queue
    console.log("2️⃣ Creating email queue...");
    const emailQueue = createEmailQueue(redis);
    console.log("   ✅ Email queue created\n");

    // Test enqueue (dry run - won't actually send)
    console.log("3️⃣ Testing job enqueue (dry run)...");
    const testJob = await emailQueue.enqueue({
      to: "kunal.23b0121032@abes.ac.in",
      subject: "Test Email",
      html: "<p>This is a test</p>",
      campaignId: "test-campaign-123",
      userId: "test-user-123",
    });
    console.log(`   ✅ Job enqueued: ${testJob.id}\n`);

    // Get queue stats
    console.log("4️⃣ Queue statistics:");
    const waitingCount = await redis.llen("bullmq:email:wait");
    const activeCount = await redis.llen("bullmq:email:active");
    console.log(`   📊 Waiting jobs: ${waitingCount}`);
    console.log(`   📊 Active jobs: ${activeCount}\n`);

    console.log("✨ All tests passed! Email queue is ready.\n");
    console.log("Next steps:");
    console.log("  1. Start the worker: cd apps/worker && bun start");
    console.log("  2. Start the web app: cd apps/web && bun dev");
    console.log("  3. Navigate to /admin/email to send emails\n");

    // Cleanup
    await emailQueue.close();
    await redis.disconnect();
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.error("\nTroubleshooting:");
    console.error("  • Ensure Redis is running: redis-cli ping");
    console.error("  • Check REDIS_URL in .env");
    console.error("  • Start Redis: docker run -d -p 6379:6379 redis:alpine\n");
    await redis.disconnect();
    process.exit(1);
  }
}

testQueue();
