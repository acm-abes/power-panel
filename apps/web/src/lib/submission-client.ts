/** @format */

import {
  createOrUpdateSubmission,
  SubmissionData,
} from "@/actions/submissions";

interface UploadResult {
  path: string;
  size: number;
  originalName: string;
}

interface CreateSubmissionParams {
  psId: string;
  documentFile: File;
  pptFile: File;
  additionalNotes?: string;
}

/**
 * Helper function to upload a single file to the API route
 */
async function uploadFile(
  file: File,
  errorMessage: string,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || errorMessage);
  }

  return response.json();
}

/**
 * Client helper function that handles the complete submission flow:
 * 1. Uploads files to the API route in parallel
 * 2. Calls the server action with the upload results
 */
export async function createOrUpdateSubmissionWithUpload(
  params: CreateSubmissionParams,
): Promise<Awaited<ReturnType<typeof createOrUpdateSubmission>>> {
  const { psId, documentFile, pptFile, additionalNotes } = params;

  // Upload both files in parallel
  const [documentUploadResult, pptUploadResult] = await Promise.all([
    uploadFile(documentFile, "Failed to upload document"),
    uploadFile(pptFile, "Failed to upload presentation"),
  ]);

  // Create submission with uploaded file details
  const submissionData: SubmissionData = {
    psId,
    documentPath: documentUploadResult.path,
    documentSize: documentUploadResult.size,
    pptPath: pptUploadResult.path,
    pptSize: pptUploadResult.size,
    additionalNotes,
  };

  return createOrUpdateSubmission(submissionData);
}
