import archiver from "archiver";
import { Readable, PassThrough } from "stream";

export async function compressToZip(
  inputStream: Readable,
  fileName: string
): Promise<Readable> {
  return new Promise((resolve, reject) => {
    const passThrough = new PassThrough();

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.on("error", (err) => {
      reject(new Error(`Compression failed for ${fileName}: ${err}`));
    });

    passThrough.on("error", (err) => {
      reject(new Error(`Stream error for ${fileName}: ${err}`));
    });

    archive.pipe(passThrough);
    archive.append(inputStream, { name: fileName });
    archive.finalize();

    resolve(passThrough);
  });
}
