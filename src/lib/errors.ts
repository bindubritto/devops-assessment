export class S3OperationError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly bucket?: string,
    public readonly key?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "S3OperationError";
  }
}

export class CompressionError extends Error {
  constructor(
    message: string,
    public readonly fileName?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "CompressionError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}
