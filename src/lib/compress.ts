import archiver from "archiver";
import { Readable, PassThrough } from "stream";
import { CompressionError } from "./errors.js";

export async function compressToZip(
  inputStream: Readable,
  fileName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const passThrough = new PassThrough();

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.on("error", (err) => {
      reject(
        new CompressionError(
          `Archive compression failed for file: ${fileName}`,
          fileName,
          err instanceof Error ? err : new Error(String(err))
        )
      );
    });

    passThrough.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    passThrough.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    passThrough.on("error", (err) => {
      reject(
        new CompressionError(
          `Stream processing failed during compression for file: ${fileName}`,
          fileName,
          err instanceof Error ? err : new Error(String(err))
        )
      );
    });

    archive.pipe(passThrough);
    archive.append(inputStream, { name: fileName });
    archive.finalize();
  });
}
