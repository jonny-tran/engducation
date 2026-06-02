import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

const envFiles = [
  path.normalize(path.join(__dirname, ".env.local")),
  path.normalize(path.join(__dirname, ".env")),
  path.normalize(path.resolve(__dirname, "../../apps/server/.env.local")),
  path.normalize(path.resolve(__dirname, "../../apps/server/.env")),
];

for (const file of envFiles) {
  const normalizedFile = path.normalize(file);
  if (fs.existsSync(normalizedFile)) {
    dotenv.config({ path: normalizedFile });
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
