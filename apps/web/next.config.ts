import "@engducation/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  env: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
    CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET ?? "",
  },
};

export default nextConfig;
