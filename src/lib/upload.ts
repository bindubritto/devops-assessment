import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./s3-client.js";
import { S3OperationError } from "./errors.js";

export async function uploadToS3(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string = "application/zip"
): Promise<void> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
  } catch (error) {
    const message = `Failed to upload file to S3: s3://${bucket}/${key}`;
    throw new S3OperationError(
      message,
      "upload",
      bucket,
      key,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Deletes an object from an S3 bucket permanently. This operation cannot be undone
 * and is used to remove the original file after it has been compressed and uploaded.
 *
 * Input:
 *   - bucket: Name of the S3 bucket containing the object to delete
 *   - key: S3 object key (file path) of the object to delete
 *
 * Output: Promise that resolves to void when deletion completes successfully
 *
 * Throws: Error if bucket doesn't exist, if key is invalid, if object doesn't exist,
 *         if deletion fails, or if there are permission issues.
 */
export async function deleteFromS3(bucket: string, key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    const message = `Failed to delete object from S3: s3://${bucket}/${key}`;
    throw new S3OperationError(
      message,
      "delete",
      bucket,
      key,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
