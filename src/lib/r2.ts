/**
 * Shared Cloudflare R2 upload utility
 * Uses S3-compatible API via @aws-sdk/client-s3
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class R2UploadError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'R2UploadError';
  }
}

export interface R2UploadOptions {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface R2UploadResult {
  key: string;
  url: string;
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint) throw new R2UploadError('R2_ENDPOINT environment variable is not set');
  if (!accessKeyId) throw new R2UploadError('R2_ACCESS_KEY_ID environment variable is not set');
  if (!secretAccessKey) throw new R2UploadError('R2_SECRET_ACCESS_KEY environment variable is not set');

  s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  return s3Client;
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadToR2(options: R2UploadOptions): Promise<R2UploadResult> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new R2UploadError('R2_BUCKET_NAME environment variable is not set');

  const client = getS3Client();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType,
      })
    );
  } catch (error) {
    throw new R2UploadError(`Failed to upload ${options.key} to R2`, { cause: error });
  }

  return {
    key: options.key,
    url: getR2PublicUrl(options.key),
  };
}

/**
 * Get the public URL for an R2 object
 */
export function getR2PublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) throw new R2UploadError('R2_PUBLIC_URL environment variable is not set');
  return `${publicUrl}/${key}`;
}
