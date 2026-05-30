import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createEnv } from "@t3-oss/env-core";
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
const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv === "production") {
  dotenv.config({ path: path.join(rootDir, ".env.production") });
} else {
  dotenv.config({ path: path.join(rootDir, ".env.development") });
}

// Fallback to local .env if any
dotenv.config();

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


