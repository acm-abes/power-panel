/** @format */

import { env } from "./config/storage";
import { StorageService } from "./interface";
import { S3StorageService, S3Config } from "./providers/s3.storage";

export function createStorageService(): StorageService {
  const provider = env.STORAGE_PROVIDER ?? "s3";

  if (provider === "s3") {
    const cfg: S3Config = {
      bucket: env.S3_BUCKET,
      region: env.S3_REGION,
    };

    if (!cfg.bucket)
      throw new Error("S3 storage configured but S3_BUCKET is not set");

    return new S3StorageService(cfg);
  }

  throw new Error(`Unsupported storage provider: ${provider}`);
}

export const storageService = createStorageService();
