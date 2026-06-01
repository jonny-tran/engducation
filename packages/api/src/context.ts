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
  
  const headers = context.request.headers;
  const ipAddress = headers.get("x-forwarded-for") || headers.get("x-real-ip") || null;

  return {
    auth: null,
    session,
    db: createDb(),
    headers,
    ipAddress,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
