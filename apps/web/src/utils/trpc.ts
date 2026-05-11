import type { AppRouter } from "@engducation/api/routers/index";
import { env } from "@engducation/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

interface StandardizedError {
  success: false;
  data: null;
  message: string;
  code: string;
}

function isStandardizedError(err: unknown): err is StandardizedError {
  return (
    typeof err === "object" &&
    err !== null &&
    "success" in err &&
    (err as { success: unknown }).success === false &&
    "message" in err &&
    "code" in err
  );
}

function parseErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    try {
      const json = JSON.parse(error.message);
      if (isStandardizedError(json)) {
        return json.message;
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
      toast.error(parseErrorMessage(error), {
        action: {
          label: "Thử lại",
          onClick: () => query.invalidate(),
        },
      });
    },
  }),
});

const trpcClient = createTRPCClient<AppRouter>({
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
