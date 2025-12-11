import type {
  S3ObjectInfo,
  ValidatedS3EventRecord,
  S3Event,
} from "../types/index.js";
import {
  S3EventRecordSchema,
  S3EventSchema,
  } from "../schemas/s3-event.schema.js";

export function validateS3Event(event: unknown): S3Event {
  return S3EventSchema.parse(event);
}

export function validateS3EventRecord(record: unknown): ValidatedS3EventRecord {
  return S3EventRecordSchema.parse(record);
}

export function recordToObjectInfo(
  record: ValidatedS3EventRecord
): S3ObjectInfo {
  const decodedKey = decodeURIComponent(
    record.s3.object.key.replace(/\+/g, " ")
  );

  return {
    bucket: record.s3.bucket.name,
    key: decodedKey,
    size: record.s3.object.size,
  };
}
