/** @format */

// Export connection options for BullMQ. Set `maxRetriesPerRequest: null`
// so blocking commands are allowed (see BullMQ redis-connection checks).
// We intentionally export a plain connection options object rather than
// an ioredis instance to avoid the `maxRetriesPerRequest` validation error.
export const connection = {
  url: process.env.REDIS_URL,
  maxRetriesPerRequest: null,
};
