import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";
import { responsePlugin } from "./plugins/response";

export { responsePlugin };
export type { ApiResponse } from "./utils/response-handler";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Vui lòng đăng nhập để tiếp tục",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Bạn không có quyền quản trị viên",
    });
  }
  return next({ ctx });
});
