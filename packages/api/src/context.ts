import { auth } from "@engducation/auth";
import { createDb } from "@engducation/db";
import type { Context as ElysiaContext } from "elysia";

export type CreateContextOptions = {
  context: ElysiaContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.request.headers,
  });
  return {
    auth: null,
    session,
    db: createDb(),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
