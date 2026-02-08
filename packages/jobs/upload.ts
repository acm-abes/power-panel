/** @format */

import { storageService } from "../storage";

export const UPLOAD_JOB = "upload";

export type UploadJobData = {
  filePath: string;
  destinationPath: string;
  body: Buffer | string; // Can be Buffer or base64 string
  contentType?: string;
};

export async function uploadHandler(payload: UploadJobData) {
  console.log(`📤 Uploading: ${payload.filePath} → ${payload.destinationPath}`);

  // Convert base64 string back to Buffer if needed
  const body =
    typeof payload.body === "string"
      ? Buffer.from(payload.body, "base64")
      : payload.body;

  await storageService.upload({
    path: payload.destinationPath,
    body,
    contentType: payload.contentType,
  });

  console.log(`✅ Upload complete: ${payload.destinationPath}`);
}
