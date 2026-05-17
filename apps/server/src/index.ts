import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { createContext } from "@engducation/api/context";
import { appRouter } from "@engducation/api/routers/index";
import { responsePlugin } from "@engducation/api";
import { auth } from "@engducation/auth";
import { env } from "@engducation/env/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createBetterAuthRoutes } from "./plugins";

const betterAuthSwaggerPlugin = createBetterAuthRoutes({ authInstance: auth });

new Elysia({ adapter: node() })
  .use(
    openapi({
      documentation: {
        info: {
          title: "Engducation API",
          version: "1.0.0",
          description: "API documentation for Engducation platform",
        },
        tags: [
          { name: "API", description: "API endpoints" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description: "JWT token from session",
            },
          },
        },
      },
      exclude: {
        paths: ["/openapi", "/openapi/json", "/trpc", "/trpc/*"],
      },
    }),
  )
  .use(
    swagger({
      provider: "swagger-ui",
      swaggerOptions: {
        withCredentials: true,
        persistAuthorization: true,
      },
    }),
  )
  .use(betterAuthSwaggerPlugin)
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  .use(responsePlugin())
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
    console.log("API Documentation: http://localhost:3000/openapi");
  });
