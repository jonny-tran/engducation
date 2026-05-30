import dotenv from "dotenv";
import path from "path";
import fs from "fs";

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
dotenv.config(); // Fallback

import "@engducation/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  env: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
    CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET ?? "",
  },
};

export default nextConfig;
