import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const endpoint = process.env.S3_ENDPOINT;
    s3Client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      ...(endpoint
        ? {
            endpoint,
            forcePathStyle: true,
          }
        : {}),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
      },
    });
  }
  return s3Client;
}

const getBucket = () => process.env.S3_BUCKET || "pixelstock-media";

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return getCdnUrl(key);
}

export async function downloadFromS3(key: string): Promise<Buffer> {
  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
  const chunks: Uint8Array[] = [];
  const stream = response.Body as any;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteFromS3(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300
): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export function getCdnUrl(key: string): string {
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || process.env.S3_ENDPOINT;
  const bucket = getBucket();
  return `${cdnBase}/${bucket}/${key}`;
}

export function getPhotoSrcUrls(photoId: string) {
  return {
    original: getCdnUrl(`photos/${photoId}/original.jpg`),
    large2x: getCdnUrl(`photos/${photoId}/large2x.jpg`),
    large: getCdnUrl(`photos/${photoId}/large.jpg`),
    medium: getCdnUrl(`photos/${photoId}/medium.jpg`),
    small: getCdnUrl(`photos/${photoId}/small.jpg`),
    portrait: getCdnUrl(`photos/${photoId}/portrait.jpg`),
    landscape: getCdnUrl(`photos/${photoId}/landscape.jpg`),
    tiny: getCdnUrl(`photos/${photoId}/tiny.jpg`),
  };
}
