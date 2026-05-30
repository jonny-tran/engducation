import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { z } from "zod";

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return startDir;
}

const rootDir = findProjectRoot(process.cwd());
dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config(); // Fallback

// Map production overrides if NODE_ENV is production
if (process.env.NODE_ENV === "production") {
  if (process.env.DATABASE_PRODCUTION_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_PRODCUTION_URL;
  }
  if (process.env.CORS_ORIGIN_PROD) {
    process.env.CORS_ORIGIN = process.env.CORS_ORIGIN_PROD;
  }
  if (process.env.PUBLIC_URL_PROD) {
    process.env.PUBLIC_URL = process.env.PUBLIC_URL_PROD;
  }
  if (process.env.BETTER_AUTH_URL_PROD) {
    process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL_PROD;
  }
  if (process.env.PROD_PASS) {
    process.env.DEV_PASS = process.env.PROD_PASS;
  }
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().min(1),
    CORS_ORIGIN: z.string().min(1),
    PUBLIC_URL: z
      .string()
      .min(1)
      .default("http://localhost:3000"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});


