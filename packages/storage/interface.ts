/** @format */

import type {
  UploadInput,
  UploadResult,
  GetInput,
  GetResult,
  DeleteInput,
} from "./types";

export interface StorageService {
  upload(input: UploadInput): Promise<UploadResult>;
  get(input: GetInput): Promise<GetResult>;
  delete(input: DeleteInput): Promise<void>;
}
