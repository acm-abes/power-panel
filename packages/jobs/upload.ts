/** @format */

import { storageService } from "../storage";

export const UPLOAD_JOB = "upload";

export type UploadJobData = {
  filePath: string;
  destinationPath: string;
  body: Buffer;
};

export async function uploadHandler(payload: UploadJobData) {
  await storageService.upload({
    path: payload.destinationPath,
    body: payload.body,
  });
}
