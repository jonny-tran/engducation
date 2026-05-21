import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../index";
import { z } from "zod";

export const mediaRouter = router({
  getCloudinarySignature: protectedProcedure
    .input(
      z.object({
        folder: z.string().min(1).default("engducation/general"),
        uploadPreset: z.string().min(1).default("engducation_video"),
        resourceType: z.enum(["image", "video", "raw", "auto"]).default("auto"),
      }),
    )
    .mutation(async ({ input }) => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Cloudinary chưa được cấu hình phía server",
        });
      }

      const timestamp = Math.round(Date.now() / 1000);
      const publicIdPrefix = `media_${crypto.randomUUID().slice(0, 8)}`;

      // Build parameters string for Cloudinary signature (alphabetically sorted)
      const toSign = [
        `folder=${input.folder}`,
        `public_id_prefix=${publicIdPrefix}`,
        `timestamp=${timestamp}`,
        `upload_preset=${input.uploadPreset}`,
      ]
        .sort()
        .join("&");

      const signature = crypto
        .createHash("sha256")
        .update(toSign + apiSecret)
        .digest("hex");

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${input.resourceType}/upload`;

      return {
        signature,
        timestamp,
        cloudName,
        apiKey,
        uploadUrl,
        folder: input.folder,
        publicIdPrefix,
        uploadPreset: input.uploadPreset,
      };
    }),
});
