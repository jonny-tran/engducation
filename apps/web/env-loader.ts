import dotenv from "dotenv";
import fs from "fs";
import path from "path";

function findProjectRoot(startDir: string): string {
  let dir = path.normalize(path.resolve(startDir));
  while (dir !== path.dirname(dir)) {
    const checkPath = path.normalize(path.join(/*turbopackIgnore: true*/ dir, "pnpm-workspace.yaml"));
    if (!checkPath.startsWith(dir)) {
      throw new Error("Invalid path specified!");
    }
    if (fs.existsSync(checkPath)) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return dir;
}

const rootDir = findProjectRoot(process.cwd());

// Load in priority:
// 1. .env.local (gitignored local overrides) at root
// 2. .env (default fallback) at root
const envFiles = [
  path.join(/*turbopackIgnore: true*/ rootDir, ".env.local"),
  path.join(/*turbopackIgnore: true*/ rootDir, ".env"),
];

for (const file of envFiles) {
  const normalizedFile = path.normalize(path.resolve(file));
  if (!normalizedFile.startsWith(rootDir)) {
    throw new Error("Invalid path specified!");
  }
  if (fs.existsSync(normalizedFile)) {
    dotenv.config({ path: normalizedFile });
  }
}

// Map variables dynamically based on NODE_ENV
const rawNodeEnv = process.env.NODE_ENV || "development";
const envMode = rawNodeEnv.toLowerCase() === "production" ? "PRODUCTION" : "DEVELOPMENT";

const isProd = envMode === "PRODUCTION";

if (isProd) {
  if (process.env.DATABASE_URL_PRODUCTION) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_PRODUCTION;
  }
} else {
  if (process.env.DATABASE_URL_DEVELOPMENT && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_DEVELOPMENT;
  }
}

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


