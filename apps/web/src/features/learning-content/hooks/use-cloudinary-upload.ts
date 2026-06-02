import { env } from "@/env";
import { trpcClient } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export interface UploadProgress {
  loaded: number;
  total: number;
}

export interface UploadedVideo {
  publicId: string;
  secureUrl: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  uploadPreset?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
}

export function useCloudinaryUpload(options?: CloudinaryUploadOptions) {
  const upload = useMutation({
    mutationFn: async (params: {
      file: File;
      onProgress?: (progress: UploadProgress) => void;
    }): Promise<UploadedVideo> => {
      const { file, onProgress } = params;

      const autoResourceType = file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("image/")
          ? "image"
          : "auto";

      const folder = options?.folder ?? "engducation/lessons";
      const uploadPreset = options?.uploadPreset ?? env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "engducation_video";
      const resourceType = options?.resourceType ?? autoResourceType;

      // Step 1: Get server-generated signed parameters (avoids exposing API_SECRET to browser)
      const sig = await trpcClient.media.getCloudinarySignature.mutate({
        folder,
        uploadPreset,
        resourceType,
      });

      console.log("[Cloudinary Upload] Signature response:", {
        uploadUrl: sig.uploadUrl,
        folder: sig.folder,
        uploadPreset: sig.uploadPreset,
        timestamp: sig.timestamp,
        apiKey: sig.apiKey,
        signatureLength: sig.signature?.length,
        signaturePrefix: sig.signature?.substring(0, 20),
      });

      // Step 2: Upload directly to Cloudinary from the browser
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", sig.timestamp.toString());
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);
      formData.append("upload_preset", sig.uploadPreset);

      // Log what we're sending (without the actual file)
      console.log("[Cloudinary Upload] FormData entries:");
      console.log("  api_key:", sig.apiKey);
      console.log("  timestamp:", sig.timestamp);
      console.log("  signature:", sig.signature);
      console.log("  folder:", sig.folder);
      console.log("  upload_preset:", sig.uploadPreset);
      console.log("  resourceType:", resourceType);
      console.log("  file type:", file.type, "size:", file.size);

      return new Promise<UploadedVideo>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress({ loaded: e.loaded, total: e.total });
          }
        });

        xhr.addEventListener("load", () => {
          console.log("[Cloudinary Upload] Response status:", xhr.status);
          console.log("[Cloudinary Upload] Raw response body:", JSON.stringify(xhr.responseText));
          console.log("[Cloudinary Upload] Response body length:", xhr.responseText?.length);

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log("[Cloudinary Upload] Success response:", response);
              resolve({
                publicId: response.public_id as string,
                secureUrl: response.secure_url as string,
              });
            } catch {
              reject(new Error("Phản hồi từ Cloudinary không hợp lệ: " + xhr.responseText));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText || "{}");
              console.error("[Cloudinary Upload] Upload error response:", error);
              // Also check for Cloudinary-specific error formats
              const message = error.error?.message
                || error.message
                || error.error
                || `Upload thất bại (HTTP ${xhr.status}). Response: ${xhr.responseText}`;
              reject(new Error(message));
            } catch {
              reject(new Error(`Upload thất bại: HTTP ${xhr.status}. Body: ${xhr.responseText}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          console.error("[Cloudinary Upload] Network error");
          reject(new Error("Lỗi mạng khi upload video"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload bị hủy"));
        });

        xhr.open("POST", sig.uploadUrl);
        xhr.send(formData);
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return { upload };
}
