/** @format */

// Concurrency of 10 allows smooth processing while rate limiter ensures we stay within 14/sec
export const CONCURRENCY = 10;
export const QUEUE_NAME = "master-queue";

// Rate limit: 14 emails per second max
export const RATE_LIMIT = {
  max: 14,
  duration: 1000, // milliseconds
};
