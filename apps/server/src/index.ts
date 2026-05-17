import { Elysia } from "elysia";
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

// ── OpenAPI Spec — generated at startup (runtime) ───────────────────────────────
// generateOpenAPIDocument() runs once when the server starts. It uses the TypeScript
// compiler to statically analyse the AppRouter type — no procedures are executed.
// The result is a full OpenAPI 3.1 spec used in two ways:
//  1. Served at /openapi.json for any OpenAPI client
//  2. Embedded in the Swagger UI HTML (no extra HTTP fetch needed)
//
// tRPC routes: queries → GET /path, mutations → POST /path
// ─────────────────────────────────────────────────────────────────────────────

async function buildOpenAPISpec() {
  const { generateOpenAPIDocument } = await import("@trpc/openapi");

  const trpcSpec = await generateOpenAPIDocument(
    // Path to the file that exports appRouter. Used by the TypeScript compiler for
    // static analysis only — the file is never executed as code.
    "../../packages/api/src/routers/index.ts",
    { exportName: "appRouter", title: "Engducation API", version: "1.0.0" },
  );

  // Auth spec paths — mirrors Better Auth routes registered by createBetterAuthRoutes()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authPaths: Record<string, any> = {
    "/api/auth/sign-in/email": {
      post: {
        operationId: "signInEmail",
        summary: "Sign in with email and password",
        tags: ["Authentication"],
        security: [] as object[],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object" as const,
                required: ["email", "password"] as string[],
                properties: {
                  email: { type: "string" as const, format: "email" as const },
                  password: { type: "string" as const, format: "password" as const, minLength: 8 },
                  callbackURL: { type: "string" as const },
                  rememberMe: { type: "boolean" as const },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Sign-in successful" }, 401: { description: "Invalid credentials" } },
      },
    },
    "/api/auth/sign-up/email": {
      post: {
        operationId: "signUpEmail",
        summary: "Sign up with email and password",
        tags: ["Authentication"],
        security: [] as object[],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object" as const,
                required: ["email", "password", "name"] as string[],
                properties: {
                  email: { type: "string" as const, format: "email" as const },
                  password: { type: "string" as const, format: "password" as const, minLength: 8 },
                  name: { type: "string" as const, minLength: 1 },
                  callbackURL: { type: "string" as const },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Account created" }, 409: { description: "Email already exists" } },
      },
    },
    "/api/auth/sign-out": {
      post: {
        operationId: "signOut",
        summary: "Sign out the current session",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        responses: { 200: { description: "Signed out" } },
      },
    },
    "/api/auth/get-session": {
      get: {
        operationId: "getSession",
        summary: "Get current session information",
        tags: ["Authentication"],
        security: [] as object[],
        responses: {
          200: {
            description: "Current session (null if not authenticated)",
            content: {
              "application/json": {
                schema: {
                  type: "object" as const,
                  properties: {
                    session: {
                      type: "object" as const,
                      nullable: true as const,
                      properties: {
                        id: { type: "string" as const },
                        userId: { type: "string" as const },
                        expiresAt: { type: "string" as const },
                        token: { type: "string" as const },
                        user: {
                          type: "object" as const,
                          properties: {
                            id: { type: "string" as const },
                            name: { type: "string" as const },
                            email: { type: "string" as const },
                            emailVerified: { type: "boolean" as const },
                            image: { type: "string" as const, nullable: true as const },
                            createdAt: { type: "string" as const },
                            updatedAt: { type: "string" as const },
                            role: { type: "string" as const },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/sessions": {
      get: {
        operationId: "listSessions",
        summary: "List all active sessions",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        responses: { 200: { description: "Active sessions list" } },
      },
    },
    "/api/auth/session/revoke": {
      post: {
        operationId: "revokeSession",
        summary: "Revoke a specific session",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object" as const,
                required: ["sessionToken"] as string[],
                properties: { sessionToken: { type: "string" as const } },
              },
            },
          },
        },
        responses: { 200: { description: "Session revoked" } },
      },
    },
    "/api/auth/sessions/revoke": {
      post: {
        operationId: "revokeAllSessions",
        summary: "Revoke all sessions",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object" as const, properties: { excludeCurrent: { type: "boolean" as const } } },
            },
          },
        },
        responses: { 200: { description: "All sessions revoked" } },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        operationId: "forgotPassword",
        summary: "Send password reset email",
        tags: ["Authentication"],
        security: [] as object[],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object" as const,
                required: ["email"] as string[],
                properties: { email: { type: "string" as const, format: "email" as const }, redirectTo: { type: "string" as const } },
              },
            },
          },
        },
        responses: { 200: { description: "Reset email sent" } },
      },
    },
    "/api/auth/reset-password": {
      post: {
        operationId: "resetPassword",
        summary: "Reset password using token",
        tags: ["Authentication"],
        security: [] as object[],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object" as const,
                required: ["token", "password"] as string[],
                properties: { token: { type: "string" as const }, password: { type: "string" as const, format: "password" as const, minLength: 8 } },
              },
            },
          },
        },
        responses: { 200: { description: "Password reset" } },
      },
    },
    "/api/auth/change-password": {
      post: {
        operationId: "changePassword",
        summary: "Change password (authenticated)",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object" as const,
                required: ["currentPassword", "newPassword"] as string[],
                properties: { currentPassword: { type: "string" as const }, newPassword: { type: "string" as const, format: "password" as const, minLength: 8 } },
              },
            },
          },
        },
        responses: { 200: { description: "Password changed" } },
      },
    },
    "/api/auth/verification/send": {
      post: {
        operationId: "sendVerification",
        summary: "Send email verification",
        tags: ["Authentication"],
        security: [] as object[],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object" as const,
                required: ["email"] as string[],
                properties: { email: { type: "string" as const, format: "email" as const }, callbackURL: { type: "string" as const } },
              },
            },
          },
        },
        responses: { 200: { description: "Verification sent" } },
      },
    },
    "/api/auth/verification": {
      get: {
        operationId: "verifyEmail",
        summary: "Verify email address",
        tags: ["Authentication"],
        security: [] as object[],
        parameters: [{ name: "token", in: "query", required: true, schema: { type: "string" as const } }],
        responses: { 200: { description: "Email verified" } },
      },
    },
    "/api/auth/sign-in/{provider}": {
      get: {
        operationId: "signInOAuth",
        summary: "Initiate OAuth sign-in",
        tags: ["Authentication"],
        security: [] as object[],
        parameters: [{ name: "provider", in: "path", required: true, schema: { type: "string" as const }, description: "OAuth provider: google, github, etc." }],
        responses: { 302: { description: "Redirect to OAuth provider" } },
      },
    },
    "/api/auth/callback/{provider}": {
      get: {
        operationId: "oauthCallback",
        summary: "OAuth callback handler",
        tags: ["Authentication"],
        security: [] as object[],
        parameters: [
          { name: "provider", in: "path", required: true, schema: { type: "string" as const } },
          { name: "code", in: "query", schema: { type: "string" as const } },
          { name: "state", in: "query", schema: { type: "string" as const } },
          { name: "error", in: "query", schema: { type: "string" as const } },
          { name: "callbackURL", in: "query", schema: { type: "string" as const } },
        ],
        responses: { 302: { description: "OAuth callback handled" } },
      },
    },
    "/api/auth/account/link": {
      post: {
        operationId: "linkAccount",
        summary: "Link OAuth account",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object" as const,
                required: ["provider", "clientId", "clientSecret"] as string[],
                properties: { provider: { type: "string" as const }, clientId: { type: "string" as const }, clientSecret: { type: "string" as const } },
              },
            },
          },
        },
        responses: { 200: { description: "Account linked" } },
      },
    },
    "/api/auth/account/unlink": {
      post: {
        operationId: "unlinkAccount",
        summary: "Unlink account",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" as const, required: ["accountId"] as string[], properties: { accountId: { type: "string" as const } } },
            },
          },
        },
        responses: { 200: { description: "Account unlinked" } },
      },
    },
    "/api/auth/user/update": {
      patch: {
        operationId: "updateUser",
        summary: "Update user profile",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object" as const, properties: { name: { type: "string" as const }, image: { type: "string" as const } } },
            },
          },
        },
        responses: { 200: { description: "Profile updated" } },
      },
    },
    "/api/auth/user/delete": {
      post: {
        operationId: "deleteUser",
        summary: "Delete account",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object" as const, properties: { callbackURL: { type: "string" as const } } },
            },
          },
        },
        responses: { 200: { description: "Account deleted" } },
      },
    },
    "/api/auth/change-email": {
      post: {
        operationId: "changeEmail",
        summary: "Request email change",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object" as const,
                required: ["email"] as string[],
                properties: { email: { type: "string" as const, format: "email" as const }, callbackURL: { type: "string" as const } },
              },
            },
          },
        },
        responses: { 200: { description: "Email change requested" } },
      },
    },
    "/api/auth/admin/users": {
      get: {
        operationId: "adminListUsers",
        summary: "List users (admin)",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer" as const, minimum: 1, maximum: 100 } },
          { name: "cursor", in: "query", schema: { type: "string" as const } },
          { name: "search", in: "query", schema: { type: "string" as const } },
        ],
        responses: { 200: { description: "Users list" } },
      },
    },
    "/api/auth/admin/user/{userId}": {
      get: {
        operationId: "adminGetUser",
        summary: "Get user details (admin)",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" as const } }],
        responses: { 200: { description: "User details" } },
      },
      patch: {
        operationId: "adminUpdateUser",
        summary: "Update user (admin)",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" as const } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object" as const,
                properties: {
                  role: { type: "string" as const, enum: ["user", "admin"] as const },
                  banned: { type: "boolean" as const },
                  emailVerified: { type: "boolean" as const },
                },
              },
            },
          },
        },
        responses: { 200: { description: "User updated" } },
      },
      delete: {
        operationId: "adminDeleteUser",
        summary: "Delete user (admin)",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" as const } }],
        responses: { 200: { description: "User deleted" } },
      },
    },
    "/api/auth/admin/sessions": {
      get: {
        operationId: "adminListSessions",
        summary: "List all sessions (admin)",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        parameters: [
          { name: "userId", in: "query", schema: { type: "string" as const } },
          { name: "limit", in: "query", schema: { type: "integer" as const, minimum: 1, maximum: 100 } },
          { name: "cursor", in: "query", schema: { type: "string" as const } },
        ],
        responses: { 200: { description: "Sessions list" } },
      },
    },
    "/api/auth/admin/session/revoke": {
      post: {
        operationId: "adminRevokeSession",
        summary: "Revoke any session (admin)",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" as const, required: ["sessionToken"] as string[], properties: { sessionToken: { type: "string" as const } } },
            },
          },
        },
        responses: { 200: { description: "Session revoked" } },
      },
    },
    "/api/auth/admin/accounts": {
      get: {
        operationId: "adminListAccounts",
        summary: "List all accounts (admin)",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }] as object[],
        parameters: [
          { name: "userId", in: "query", schema: { type: "string" as const } },
          { name: "provider", in: "query", schema: { type: "string" as const } },
        ],
        responses: { 200: { description: "Accounts list" } },
      },
    },
  };

  const bearerAuth = {
    type: "http" as const,
    scheme: "bearer" as const,
    bearerFormat: "JWT" as const,
    description: "JWT token obtained from the session cookie via /api/auth/get-session",
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "Engducation API",
      version: "1.0.0",
      description: "Engducation platform — authentication and content management API",
    },
    servers: [{ url: env.PUBLIC_URL }],
    tags: [
      { name: "Content", description: "tRPC content management — courses, lessons, quizzes, and progress tracking" },
      { name: "Health", description: "Health check endpoints" },
      { name: "Authentication", description: "Better Auth — sign in, sign up, session, and admin management" },
    ],
    components: { securitySchemes: { bearerAuth } },
    paths: { ...(trpcSpec.paths ?? {}), ...authPaths },
  } as Spec;
}

// ── Server ────────────────────────────────────────────────────────────────────
async function start() {
  const [MERGED_SPEC] = await Promise.all([buildOpenAPISpec()]);

  // tRPC procedure paths — exclude from swagger()'s spec generation so they fall
  // through to fetchRequestHandler. The tRPC paths are in MERGED_SPEC.paths.
  const tRPCPaths = Object.keys(MERGED_SPEC.paths).filter(
    (p) =>
      p === "/healthCheck" ||
      p === "/privateData" ||
      p.startsWith("/admin.") ||
      p.startsWith("/user."),
  );

  const betterAuthSwaggerPlugin = createBetterAuthRoutes({ authInstance: auth });

  new Elysia({ adapter: node() })
    .use(betterAuthSwaggerPlugin)
    .use(
      cors({
        origin: env.CORS_ORIGIN,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "openai-ephemeral-user-id"],
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
    // ── OpenAPI JSON endpoint ────────────────────────────────────────────────────
    // This is our "dynamic endpoint" — it returns the pre-built OpenAPI spec JSON.
    // We use it as the `specUrl` for the Swagger UI HTML page below.
    // swagger() is also applied so Better Auth endpoints appear in its auto-generated spec.
    .get("/openapi.json", () => MERGED_SPEC, {
      detail: {
        summary: "OpenAPI 3.1 specification",
        description: "Full OpenAPI 3.1 specification for the Engducation API",
        hide: true,
      },
    })
    .use(
      swagger({
        path: "/swagger",
        documentation: MERGED_SPEC as unknown as object,
        exclude: ["/trpc", "/trpc/*", ...tRPCPaths],
        swaggerOptions: {
          withCredentials: true,
          persistAuthorization: true,
        },
      }),
    )
    .listen(3000, () => {
      const authCount = 24;
      const total = Object.keys(MERGED_SPEC.paths).length;
      console.log("Server running:  http://localhost:3000");
      console.log("Swagger UI:       http://localhost:3000/swagger");
      console.log("OpenAPI JSON:      http://localhost:3000/openapi.json");
      console.log(`API routes:       ${total} total  (${total - authCount} tRPC · ${authCount} auth)`);
    });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface Spec {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: { url: string }[];
  tags?: { name: string; description?: string }[];
  components?: { securitySchemes?: Record<string, object> };
  paths: Record<string, object>;
}
