import { createReadStream, createWriteStream, existsSync, statSync } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { compressToZip } from "./lib/compress.js";

const INPUT_JSON_PATH = "./10mb.json";
const OUTPUT_ZIP_PATH = "./10mb.json.zip";

async function compressJsonToZip() {
  const inputPath = join(process.cwd(), INPUT_JSON_PATH);
  const outputPath = join(process.cwd(), OUTPUT_ZIP_PATH);

  if (!existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  const fileName = INPUT_JSON_PATH.split("/").pop() || "file.json";

  try {
    const fileStats = statSync(inputPath);
    const originalSize = fileStats.size;
    console.log(`Original size: ${(originalSize / 1024).toFixed(2)} KB`);

    const inputStream = createReadStream(inputPath);
    const compressedStream = await compressToZip(inputStream, fileName);
    const outputStream = createWriteStream(outputPath);

    let compressedSize = 0;
    compressedStream.on("data", (chunk: Buffer) => {
      compressedSize += chunk.length;
    });

    await pipeline(compressedStream, outputStream);

    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

    console.log(`Compressed size: ${(compressedSize / 1024).toFixed(2)} KB`);
    console.log(`Compression ratio: ${compressionRatio}%`);
    console.log(`Output: ${outputPath}`);
  } catch (error) {
    console.error(`Error during compression:`, error);
    if (error instanceof Error) {
      console.error(`Message: ${error.message}`);
    }
    process.exit(1);
  }
}

compressJsonToZip();
