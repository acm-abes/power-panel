/** @format */

import { storageService } from "../storage";

export const UPLOAD_JOB = "upload";

export type UploadJobData = {
  filePath: string;
  destinationPath: string;
  body: Buffer;
  contentType?: string;
};

export async function uploadHandler(payload: UploadJobData) {
  console.log(`📤 Uploading: ${payload.filePath} → ${payload.destinationPath}`);

  await storageService.upload({
    path: payload.destinationPath,
    body: payload.body,
    contentType: payload.contentType,
  });

  console.log(`✅ Upload complete: ${payload.destinationPath}`);
}
