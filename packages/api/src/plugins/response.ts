import { Elysia } from "elysia";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import {
  httpError,
  fromTRPCError,
  type ApiResponse,
} from "../utils/response-handler";

function isStandardizedResponse(res: unknown): res is ApiResponse {
  return (
    typeof res === "object" &&
    res !== null &&
    "success" in res &&
    typeof (res as { success: unknown }).success === "boolean"
  );
}

export function responsePlugin() {
  return new Elysia({ name: "engducation/response" })
    .onAfterHandle(({ response, path, set }) => {
      if (isStandardizedResponse(response)) return;
      if (set.status === 200 || set.status === 201 || set.status === 204) {
        return {
          success: true,
          data: response,
          message: "Thao tác thành công",
          code: "SUCCESS",
          path,
        };
      }
    })
    .onError(({ error, set }) => {
      const rawError = error as Error & { meta?: { code?: string }; code?: string };

      if (rawError.meta?.code) {
        const code = rawError.meta.code as TRPC_ERROR_CODE_KEY;
        const { message, code: errCode, status } = fromTRPCError(
          code,
          rawError.message || undefined,
        );
        set.status = status;
        return httpError(message, errCode, status);
      }

      if (rawError.code && typeof rawError.code === "string") {
        const { message, code: errCode, status } = fromTRPCError(
          rawError.code as TRPC_ERROR_CODE_KEY,
          (rawError as Error).message,
        );
        set.status = status;
        return httpError(message, errCode, status);
      }

      set.status = 500;
      console.error("[Lỗi server]", (error as Error).message || error);
      return httpError("Lỗi máy chủ nội bộ", "INTERNAL_SERVER_ERROR", 500);
    });
}
