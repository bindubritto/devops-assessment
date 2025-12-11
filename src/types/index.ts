export interface S3ObjectInfo {
  bucket: string;
  key: string;
  size?: number;
}

export interface ProcessJsonOptions {
  bucket: string;
  key: string;
  deleteOriginal?: boolean;
  returnJsonData?: boolean;
}

export interface ProcessJsonResult {
  originalKey: string;
  zipKey: string;
  originalSize?: number;
  compressedSize: number;
  jsonData?: unknown;
}

export interface ProcessS3ObjectResult {
  originalKey: string;
  zipKey: string;
}

export interface ValidatedS3EventRecord {
  s3: {
    bucket: {
      name: string;
    };
    object: {
      key: string;
      size: number;
    };
  };
}

export interface S3Event {
  Records: ValidatedS3EventRecord[];
}

export interface ProcessingResult {
  key: string;
  status: string;
  error?: string;
}

export interface HandlerResponse {
  statusCode: number;
  body: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: {
    operation?: string;
    bucket?: string;
    key?: string;
    field?: string;
  };
}
