import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const cwd = /*turbopackIgnore: true*/ process.cwd();
const possibleDirs = [
  cwd,
  /*turbopackIgnore: true*/ path.join(cwd, "apps/web"),
];
let envDir = cwd;
for (const dir of possibleDirs) {
  const checkPath = /*turbopackIgnore: true*/ path.normalize(/*turbopackIgnore: true*/ path.join(dir, ".env"));
  if (/*turbopackIgnore: true*/ fs.existsSync(checkPath)) {
    envDir = dir;
    break;
  }
}

const envFiles = [
  /*turbopackIgnore: true*/ path.join(envDir, ".env.local"),
  /*turbopackIgnore: true*/ path.join(envDir, ".env"),
];

for (const file of envFiles) {
  const normalizedFile = /*turbopackIgnore: true*/ path.normalize(/*turbopackIgnore: true*/ path.resolve(file));
  if (/*turbopackIgnore: true*/ fs.existsSync(normalizedFile)) {
    /*turbopackIgnore: true*/ dotenv.config({ path: /*turbopackIgnore: true*/ normalizedFile });
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

// Explicitly map keys to avoid dynamic property lookup on process.env
const corsOriginVal = envMode === "PRODUCTION" ? process.env.CORS_ORIGIN_PRODUCTION : process.env.CORS_ORIGIN_DEVELOPMENT;
if (corsOriginVal !== undefined) {
  process.env.CORS_ORIGIN = corsOriginVal;
}

const publicUrlVal = envMode === "PRODUCTION" ? process.env.PUBLIC_URL_PRODUCTION : process.env.PUBLIC_URL_DEVELOPMENT;
if (publicUrlVal !== undefined) {
  process.env.PUBLIC_URL = publicUrlVal;
}

const betterAuthUrlVal = envMode === "PRODUCTION" ? process.env.BETTER_AUTH_URL_PRODUCTION : process.env.BETTER_AUTH_URL_DEVELOPMENT;
if (betterAuthUrlVal !== undefined) {
  process.env.BETTER_AUTH_URL = betterAuthUrlVal;
}

const devPassVal = envMode === "PRODUCTION" ? process.env.DEV_PASS_PRODUCTION : process.env.DEV_PASS_DEVELOPMENT;
if (devPassVal !== undefined) {
  process.env.DEV_PASS = devPassVal;
}

const nextPublicApiUrlVal = envMode === "PRODUCTION" ? process.env.NEXT_PUBLIC_API_URL_PRODUCTION : process.env.NEXT_PUBLIC_API_URL_DEVELOPMENT;
if (nextPublicApiUrlVal !== undefined) {
  process.env.NEXT_PUBLIC_API_URL = nextPublicApiUrlVal;
}


