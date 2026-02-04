/** @format */

import { storageEnv } from "../../../apps/worker/src/config/storage";
import { StorageService } from "./interface";
import { S3StorageService, S3Config } from "./providers/s3.storage";

function createStorageService(): StorageService {
  const provider = process.env.STORAGE_PROVIDER ?? "s3";

  if (provider === "s3") {
    const cfg: S3Config = {
      bucket: storageEnv.S3_BUCKET,
      region: storageEnv.S3_REGION,
      prefix: storageEnv.S3_PREFIX,
    };

    if (!cfg.bucket)
      throw new Error("S3 storage configured but S3_BUCKET is not set");

    return new S3StorageService(cfg);
  }

  throw new Error(`Unsupported storage provider: ${provider}`);
}

export const storageService: StorageService = createStorageService();
