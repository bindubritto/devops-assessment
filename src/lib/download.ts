import { GetObjectCommand, GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { s3Client } from "./s3-client.js";
import { Readable } from "stream";
import { S3OperationError } from "./errors.js";

export async function downloadFromS3(
  bucket: string,
  key: string
): Promise<GetObjectCommandOutput> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await s3Client.send(command);
  } catch (error) {
    const message = `Failed to download object from S3: s3://${bucket}/${key}`;
    throw new S3OperationError(
      message,
      "download",
      bucket,
      key,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

export async function downloadJsonFromS3(
  bucket: string,
  key: string
): Promise<any> {
  const jsonKey = key.endsWith(".json") ? key : `${key}.json`;

  try {
    const response = await downloadFromS3(bucket, jsonKey);

    if (!response.Body) {
      throw new S3OperationError(
        `Empty response body for JSON file: s3://${bucket}/${jsonKey}`,
        "download",
        bucket,
        jsonKey
      );
    }

    const body = response.Body as Readable;
    const content = body.toString();

    try {
      return JSON.parse(content);
    } catch (parseError) {
      throw new S3OperationError(
        `Failed to parse JSON content from s3://${bucket}/${jsonKey}`,
        "parse",
        bucket,
        jsonKey,
        parseError instanceof Error ? parseError : new Error(String(parseError))
      );
    }
  } catch (error) {
    if (error instanceof S3OperationError) {
      throw error;
    }
    throw new S3OperationError(
      `Failed to download JSON from S3: s3://${bucket}/${jsonKey}`,
      "download",
      bucket,
      jsonKey,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
