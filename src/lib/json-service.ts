import { downloadJsonFromS3, downloadFromS3 } from "./download.js";
import { compressToZip } from "./compress.js";
import { Readable } from "stream";
import { shouldSkipFile, generateZipKey } from "./processor.js";
import type { ProcessJsonResult, ProcessJsonOptions } from "../types/index.js";

export async function compressJsonFromS3(
  options: ProcessJsonOptions
): Promise<ProcessJsonResult> {
  const {
    bucket,
    key,
    returnJsonData = false,
  } = options;

  const jsonKey = key.endsWith(".json") ? key : `${key}.json`;

  if (shouldSkipFile(jsonKey)) {
    throw new Error(`File should be skipped: ${jsonKey}`);
  }

  let jsonData: unknown | undefined;
  if (returnJsonData) {
    try {
      jsonData = await downloadJsonFromS3(bucket, jsonKey);
    } catch (error) {
      console.error(`Failed to download JSON from S3: ${jsonKey}`, error);
      throw new Error(`Failed to download JSON from S3: ${jsonKey}`);
    }
  }

  const response = await downloadFromS3(bucket, jsonKey);
  if (!response.Body) {
    throw new Error(`Empty response body for object: ${jsonKey}`);
  }

  const originalSize = response.ContentLength || undefined;
  const originalFileName = jsonKey.split("/").pop() || "file.json";
  const bodyStream = response.Body as Readable;

  const compressedBuffer = await compressToZip(bodyStream, originalFileName);
  const zipKey = generateZipKey(jsonKey);

  return {
    originalKey: jsonKey,
    zipKey,
    originalSize,
    compressedSize: compressedBuffer.length,
    jsonData,
  };
}
