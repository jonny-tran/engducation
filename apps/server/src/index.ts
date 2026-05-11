import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { createContext } from "@engducation/api/context";
import { appRouter } from "@engducation/api/routers/index";
import { responsePlugin } from "@engducation/api";
import { auth } from "@engducation/auth";
import { env } from "@engducation/env/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";

new Elysia({ adapter: node() })
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  .use(responsePlugin())
  .all("/api/auth/*", async (context) => {
    const { request, status } = context;
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })
  .all("/trpc/*", async (context) => {
    const res = await fetchRequestHandler({
      endpoint: "/trpc",
      router: appRouter,
      req: context.request,
      createContext: () => createContext({ context }),
    });
    return res;
  })
  .get("/", () => "OK")
  .listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
