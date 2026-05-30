import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";

const nodeEnv = process.env.NODE_ENV || "development";
dotenv.config({
  path: path.resolve(__dirname, `../../.env.${nodeEnv}`),
});

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
