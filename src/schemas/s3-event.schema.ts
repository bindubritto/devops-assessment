import { z } from "zod";

export const S3EventRecordSchema = z.object({
  s3: z.object({
    bucket: z.object({
      name: z.string().min(1),
    }),
    object: z.object({
      key: z.string().min(1),
      size: z.number().int().nonnegative(),
    }),
  }),
});

export const S3EventSchema = z.object({
  Records: z.array(S3EventRecordSchema).min(1),
});
