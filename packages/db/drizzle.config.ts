import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

const rootDir = path.resolve(__dirname, "../..");

// Load in priority:
// 1. .env.local (gitignored local overrides) at root
// 2. .env (default fallback) at root
const envFiles = [
  path.join(rootDir, ".env.local"),
  path.join(rootDir, ".env"),
];

for (const file of envFiles) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file });
  }
}

// Map DATABASE_URL dynamically based on NODE_ENV
const rawNodeEnv = process.env.NODE_ENV || "development";
const isProd = rawNodeEnv.toLowerCase() === "production";

if (isProd) {
  if (process.env.DATABASE_URL_PRODUCTION) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_PRODUCTION;
  }
} else {
  if (process.env.DATABASE_URL_DEVELOPMENT && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_DEVELOPMENT;
  }
}

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
