import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { z } from "zod";

const cwd = /*turbopackIgnore: true*/ process.cwd();
const possibleDirs = [
  cwd,
  /*turbopackIgnore: true*/ path.join(cwd, "apps/server"),
];
let envDir = cwd;
for (const dir of possibleDirs) {
  if (/*turbopackIgnore: true*/ fs.existsSync(/*turbopackIgnore: true*/ path.join(dir, ".env")) || /*turbopackIgnore: true*/ fs.existsSync(/*turbopackIgnore: true*/ path.join(dir, ".env.local"))) {
    envDir = dir;
    break;
  }
}

const envFiles = [
  /*turbopackIgnore: true*/ path.join(envDir, ".env.local"),
  /*turbopackIgnore: true*/ path.join(envDir, ".env"),
];

for (const file of envFiles) {
  if (/*turbopackIgnore: true*/ fs.existsSync(file)) {
    /*turbopackIgnore: true*/ dotenv.config({ path: /*turbopackIgnore: true*/ file });
  }
}

// Map variables dynamically based on NODE_ENV
const rawNodeEnv = process.env.NODE_ENV || "development";
const isProd = rawNodeEnv.toLowerCase() === "production";

// For DATABASE_URL: development uses DATABASE_URL normally, production uses DATABASE_URL_PRODUCTION
if (isProd) {
  if (process.env.DATABASE_URL_PRODUCTION) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_PRODUCTION;
  }
} else {
  if (process.env.DATABASE_URL_DEVELOPMENT && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_DEVELOPMENT;
  }
}

// Map other variables dynamically based on NODE_ENV
const envMode = isProd ? "PRODUCTION" : "DEVELOPMENT";
const envKeysToMap = [
  "CORS_ORIGIN",
  "PUBLIC_URL",
  "BETTER_AUTH_URL",
  "DEV_PASS",
  "NEXT_PUBLIC_API_URL",
];

for (const key of envKeysToMap) {
  const envVal = process.env[`${key}_${envMode}`];
  if (envVal !== undefined) {
    process.env[key] = envVal;
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


