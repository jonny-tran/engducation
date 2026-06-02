import "./src/env";
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: process.env.NODE_ENV === "production",
  // Explicitly use webpack (not turbopack) for this build so the webpack aliases below work.
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, "../../node_modules/react"),
      "react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
    };
    return config;
  },
  env: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
    CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET ?? "",
  },
};

export default nextConfig;
