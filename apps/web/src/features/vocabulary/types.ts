import type { AppRouter } from "@engducation/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;

export type VocabularyItem = RouterOutput["userVocabulary"]["list"]["items"][number];
export type AdminVocabularyItem = RouterOutput["adminVocabulary"]["list"]["items"][number];
