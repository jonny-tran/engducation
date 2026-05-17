import { protectedProcedure, publicProcedure, router } from "../index";
import { adminContentRouter, adminVocabularyRouter } from "./admin";
import { userContentRouter, userVocabularyRouter } from "./user";

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
  adminVocabulary: adminVocabularyRouter,
  userVocabulary: userVocabularyRouter,
});

export type AppRouter = typeof appRouter;
