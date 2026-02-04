/** @format */

import { Readable } from "stream";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { StorageService } from "../interface";
import type {
  UploadInput,
  UploadResult,
  GetInput,
  GetResult,
  DeleteInput,
} from "../types";

export interface S3Config {
  bucket: string;
  region?: string;
  prefix?: string;
}

export class S3StorageService implements StorageService {
  private client: S3Client;
  private bucket: string;
  private prefix: string;

  constructor(config: S3Config) {
    this.client = new S3Client({ region: config.region });
    this.bucket = config.bucket;
    this.prefix = config.prefix ?? "";
  }

  private toKey(path: string) {
    return this.prefix
      ? `${this.prefix.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
      : path;
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const Key = this.toKey(input.path);
    const Body = input.body as any;

    const params = {
      Bucket: this.bucket,
      Key,
      Body,
      ContentType: input.contentType,
    };

    const cmd = new PutObjectCommand(params as any);
    const res = await this.client.send(cmd);

    const size = Buffer.isBuffer(input.body) ? input.body.length : 0;

    return { path: input.path, size };
  }

  async get(input: GetInput): Promise<GetResult> {
    const Key = this.toKey(input.path);
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key });
    const res = await this.client.send(cmd);

    const body = res.Body as Readable;
    const contentType = res.ContentType;

    if (!body) throw new Error("S3: empty body");

    return { body, contentType };
  }

  async delete(input: DeleteInput): Promise<void> {
    const Key = this.toKey(input.path);
    const cmd = new DeleteObjectCommand({ Bucket: this.bucket, Key });
    await this.client.send(cmd);
  }
}
