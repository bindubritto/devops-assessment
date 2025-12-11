import { Context } from "aws-lambda";
import { processS3Object, shouldSkipFile } from "./lib/processor.js";
import { compressJsonFromS3 } from "./lib/json-service.js";
import type {
  ProcessingResult,
  HandlerResponse,
  ErrorResponse,
} from "./types/index.js";
import {
  S3OperationError,
  CompressionError,
  ValidationError,
} from "./lib/errors.js";

export const handler = async (
  event: any,
  _context: Context
): Promise<HandlerResponse> => {
  const results: ProcessingResult[] = [];

  try {
    if (
      !event?.Records ||
      !Array.isArray(event.Records) ||
      event.Records.length === 0
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "InvalidEvent",
          message: "Event must contain a non-empty Records array",
        } as ErrorResponse),
      };
    }

    for (const record of event.Records) {
      const bucket = record.s3?.bucket?.name;
      const key = record.s3?.object?.key;

      if (!bucket || !key) {
        results.push({
          key: key || "unknown",
          status: "validation_failed",
          error: "Missing bucket or key",
        });
        continue;
      }

      let decodedKey: string;
      try {
        decodedKey = decodeURIComponent(key.replace(/\+/g, " "));
      } catch (error) {
        results.push({
          key: key,
          status: "validation_failed",
          error: `Failed to decode key: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
        continue;
      }

      try {
        if (shouldSkipFile(decodedKey)) {
          results.push({ key: decodedKey, status: "skipped" });
          continue;
        }

        const isJsonFile = decodedKey.toLowerCase().endsWith(".json");

        if (isJsonFile) {
          await compressJsonFromS3({
            bucket,
            key: decodedKey,
            deleteOriginal: true,
          });
          results.push({ key: decodedKey, status: "success" });
        } else {
          await processS3Object({ bucket, key: decodedKey });
          results.push({ key: decodedKey, status: "success" });
        }
      } catch (error) {
        let errorMessage = "Unknown error";

        if (error instanceof S3OperationError) {
          errorMessage = error.message;
          console.error(`S3 operation failed:`, {
            operation: error.operation,
            bucket: error.bucket,
            key: error.key,
            message: error.message,
            cause: error.cause?.message,
          });
        } else if (error instanceof CompressionError) {
          errorMessage = error.message;
          console.error(`Compression failed:`, {
            fileName: error.fileName,
            message: error.message,
            cause: error.cause?.message,
          });
        } else if (error instanceof ValidationError) {
          errorMessage = error.message;
          console.error(`Validation failed:`, {
            field: error.field,
            message: error.message,
          });
        } else if (error instanceof Error) {
          errorMessage = error.message;
          console.error(`Processing failed:`, {
            message: error.message,
            stack: error.stack,
          });
        } else {
          console.error(`Unknown error occurred:`, error);
        }

        results.push({
          key: decodedKey,
          status: "failed",
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const failureCount = results.filter((r) => r.status === "failed").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;

    const statusCode = failureCount > 0 ? 207 : 200;

    return {
      statusCode,
      body: JSON.stringify({
        message: "Processing complete",
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failureCount,
          skipped: skippedCount,
        },
      }),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(`Handler error:`, {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "InternalServerError",
        message: "An unexpected error occurred during processing",
        details: {
          error: errorMessage,
        },
      } as ErrorResponse),
    };
  }
};
