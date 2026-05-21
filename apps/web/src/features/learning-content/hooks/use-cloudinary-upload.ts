import { env } from "@engducation/env/web";
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

      // Step 2: Upload directly to Cloudinary from the browser
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", sig.timestamp.toString());
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);
      formData.append("upload_preset", sig.uploadPreset);
      formData.append("public_id_prefix", sig.publicIdPrefix);

      return new Promise<UploadedVideo>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress({ loaded: e.loaded, total: e.total });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({
                publicId: response.public_id as string,
                secureUrl: response.secure_url as string,
              });
            } catch {
              reject(new Error("Phản hồi từ Cloudinary không hợp lệ"));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error?.message ?? "Upload thất bại"));
            } catch {
              reject(new Error(`Upload thất bại: HTTP ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
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
