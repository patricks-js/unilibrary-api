import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GOOGLE_BOOKS_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
