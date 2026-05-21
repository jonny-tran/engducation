import type { AppRouter } from "@engducation/api/routers/index";
import { env } from "@engducation/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  TRPCClientError,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

/**
 * Error shapes returned by our tRPC backend (via the response-plugin wrapper).
 * The `data.code` field contains the tRPC error code (e.g. "UNAUTHORIZED").
 */
interface TRPCErrorShape {
  data: {
    code: string;
    message: string;
    httpStatus: number;
  };
}

function getErrorCode(error: unknown): string | null {
  if (error instanceof TRPCClientError) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed === "object" && "data" in parsed) {
        return (parsed as TRPCErrorShape).data?.code ?? null;
      }
    } catch {
      // not JSON
    }
  }
  return null;
}

function parseErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    try {
      const json = JSON.parse(error.message);
      if (json && typeof json === "object" && "data" in json) {
        return (json as TRPCErrorShape).data?.message ?? error.message;
      }
    } catch {
      // not JSON, fall through
    }
    if (error.message.length < 200) {
      return error.message;
    }
  }
  if (error instanceof Error && error.message.length < 200) {
    return error.message;
  }
  return "Đã xảy ra lỗi không xác định";
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const code = getErrorCode(error);

      // Auth errors → redirect to login
      if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
        toast.error("Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.");
        window.location.href = "/login";
        return;
      }

      // For other errors, show toast with retry action
      toast.error(parseErrorMessage(error), {
        action: {
          label: "Thử lại",
          onClick: () => query.invalidate(),
        },
      });
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
