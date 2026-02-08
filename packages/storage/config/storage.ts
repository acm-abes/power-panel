/** @format */

import { z } from "zod";

const envSchema = z.object({
  S3_BUCKET: z.string(),
  S3_REGION: z.string(),
  STORAGE_PROVIDER: z.string(),
});

/**
 * Validate environment variables based on the selected mail provider
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Environment validation error:", result.error.format());
    throw new Error("Invalid environment variables");
  }

  return result.data;
}

export const env = validateEnv();

export type StorageEnv = typeof env;
