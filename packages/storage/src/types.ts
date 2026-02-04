/** @format */

import { Readable } from "stream";

export interface UploadInput {
  path: string; // logical path (e.g. "ppt/team-123/file.pptx")
  contentType?: string;
  body: Buffer | Readable;
}

export interface UploadResult {
  path: string;
  size: number;
}

export interface GetInput {
  path: string;
}

export interface GetResult {
  body: Readable;
  contentType?: string;
}

export interface DeleteInput {
  path: string;
}
