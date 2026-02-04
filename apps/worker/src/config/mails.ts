/** @format */

import { z } from "zod";

const CommonEnvSchema = z.object({
  EMAIL_FROM: z.string(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
});

const resendEnvSchema = z.object({
  MAIL_PROVIDER: z.literal("resend"),
  EMAIL_FROM: z.string(),
  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY is required when using Resend provider"),
});

const sesEnvSchema = z.object({
  MAIL_PROVIDER: z.literal("ses"),
  EMAIL_FROM: z.string(),
  AWS_REGION: z
    .string()
    .min(1, "AWS_REGION is required when using SES provider"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

const envSchema = z.intersection(
  CommonEnvSchema,
  z
    .discriminatedUnion("MAIL_PROVIDER", [resendEnvSchema, sesEnvSchema])
    .default({
      MAIL_PROVIDER: "resend" as const,
      EMAIL_FROM: "",
      RESEND_API_KEY: "",
    }),
);

/**
 * Validate environment variables based on the selected mail provider
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Environment validation failed:");
    console.error(result.error.format());
    throw new Error("Invalid environment variables");
  }

  console.log(
    `✅ Environment validated for provider: ${result.data.MAIL_PROVIDER}`,
  );

  return result.data;
}

export const mailsEnv = validateEnv();

export type MailsEnv = typeof mailsEnv;
