import { Readable } from "stream";
import { downloadFromS3 } from "./download.js";
import { uploadToS3, deleteFromS3 } from "./upload.js";
import { compressToZip } from "./compress.js";
import type { S3ObjectInfo, ProcessS3ObjectResult } from "../types/index.js";

const SKIP_EXTENSIONS = [".zip", ".gz", ".tar", ".rar", ".7z"];
export const ZIP_PREFIX = "compressed/";

export function shouldSkipFile(key: string): boolean {
  if (key.startsWith(ZIP_PREFIX)) {
    return true;
  }

  const lowerKey = key.toLowerCase();
  for (const ext of SKIP_EXTENSIONS) {
    if (lowerKey.endsWith(ext)) {
      return true;
    }
  }

  return false;
}

export function generateZipKey(originalKey: string): string {
  const parts = originalKey.split("/");
  const fileName = parts[parts.length - 1];
  return `${ZIP_PREFIX}${fileName}.zip`;
}

export async function processS3Object(
  objectInfo: S3ObjectInfo
): Promise<ProcessS3ObjectResult> {
  const { bucket, key } = objectInfo;

  if (shouldSkipFile(key)) {
    throw new Error(`File should be skipped: ${key}`);
  }

  const response = await downloadFromS3(bucket, key);

  if (!response.Body) {
    throw new Error(`Empty response body for object: ${key}`);
  }

  const originalFileName = key.split("/").pop() || "file";
  const bodyStream = response.Body as Readable;

  const compressedBuffer = await compressToZip(bodyStream, originalFileName);
  const zipKey = generateZipKey(key);

  await uploadToS3(bucket, zipKey, compressedBuffer);
  await deleteFromS3(bucket, key);

  return { originalKey: key, zipKey };
}
