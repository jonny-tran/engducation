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


export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
