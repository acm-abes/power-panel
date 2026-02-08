/** @format */

import { storageService } from "../storage";

export const DELETE_JOB = "delete-file";

export type DeleteJobData = {
  path: string;
  reason?: string;
};

export async function deleteHandler(payload: DeleteJobData) {
  console.log(`🗑️  Deleting file from storage: ${payload.path}`);

  if (payload.reason) {
    console.log(`   Reason: ${payload.reason}`);
  }

  await storageService.delete({
    path: payload.path,
  });

  console.log(`✅ File deleted: ${payload.path}`);
}
