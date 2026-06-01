import { protectedProcedure, publicProcedure, router } from "../index";
import { adminContentRouter, adminVocabularyRouter } from "./admin";
import { adminAdvancedRouter } from "./admin/advanced";
import { userContentRouter, userVocabularyRouter } from "./user";
import { mediaRouter } from "./media";

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
  adminAdvanced: adminAdvancedRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
