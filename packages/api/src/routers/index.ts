import { protectedProcedure, publicProcedure, router } from "../index";
import { adminContentRouter } from "./admin";
import { userContentRouter } from "./user";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  admin: adminContentRouter,
  user: userContentRouter,
});

export type AppRouter = typeof appRouter;
