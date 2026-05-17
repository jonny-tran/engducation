import { Elysia } from "elysia";
import { t } from "elysia";

export interface BetterAuthPluginConfig {
  path?: string;
  excludedEndpoints?: string[];
  /** Pass the Better Auth instance to enable real request forwarding */
  authInstance?: { handler: (request: Request) => Promise<Response> };
}

interface EndpointDefinition {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body?: ReturnType<typeof t.Object>;
  query?: ReturnType<typeof t.Object>;
  params?: ReturnType<typeof t.Object>;
  response?: ReturnType<typeof t.Object>;
  description: string;
  requiresAuth?: boolean;
}

const betterAuthEndpoints: Record<string, EndpointDefinition> = {
  "sign-in-email": {
    method: "POST",
    path: "/sign-in/email",
    body: t.Object({
      email: t.String({ format: "email", description: "User email address" }),
      password: t.String({ minLength: 8, description: "User password" }),
      callbackURL: t.Optional(
        t.String({ description: "URL to redirect after successful sign-in" }),
      ),
      rememberMe: t.Optional(t.Boolean({ description: "Remember user session" })),
    }),
    description: "Sign in with email and password",
  },
  "sign-up-email": {
    method: "POST",
    path: "/sign-up/email",
    body: t.Object({
      email: t.String({ format: "email", description: "User email address" }),
      password: t.String({ minLength: 8, description: "User password" }),
      name: t.String({ minLength: 1, description: "User display name" }),
      callbackURL: t.Optional(
        t.String({ description: "URL to redirect after successful sign-up" }),
      ),
    }),
    description: "Sign up with email and password",
  },
  "sign-out": {
    method: "POST",
    path: "/sign-out",
    body: t.Optional(
      t.Object({
        callbackURL: t.Optional(
          t.String({ description: "URL to redirect after sign-out" }),
        ),
      }),
    ),
    description: "Sign out the current session",
    requiresAuth: true,
  },
  "get-session": {
    method: "GET",
    path: "/get-session",
    response: t.Object({
      session: t.Optional(
        t.Object({
          id: t.String(),
          userId: t.String(),
          expiresAt: t.String(),
          token: t.String(),
          user: t.Object({
            id: t.String(),
            name: t.String(),
            email: t.String(),
            emailVerified: t.Boolean(),
            image: t.Optional(t.String()),
            createdAt: t.String(),
            updatedAt: t.String(),
          }),
        }),
      ),
    }),
    description: "Get the current session information",
  },
  "list-sessions": {
    method: "GET",
    path: "/sessions",
    response: t.Object({
      sessions: t.Array(
        t.Object({
          id: t.String(),
          userId: t.String(),
          expiresAt: t.String(),
          token: t.String(),
          ipAddress: t.Optional(t.String()),
          userAgent: t.Optional(t.String()),
        }),
      ),
    }),
    description: "List all active sessions for the current user",
    requiresAuth: true,
  },
  "revoke-session": {
    method: "POST",
    path: "/session/revoke",
    body: t.Object({
      sessionToken: t.String({ description: "Token of session to revoke" }),
    }),
    description: "Revoke a specific session",
    requiresAuth: true,
  },
  "revoke-sessions": {
    method: "POST",
    path: "/sessions/revoke",
    body: t.Optional(
      t.Object({
        excludeCurrent: t.Optional(
          t.Boolean({ description: "Exclude current session from revocation" }),
        ),
      }),
    ),
    description: "Revoke all sessions except optionally the current one",
    requiresAuth: true,
  },
  "forgot-password": {
    method: "POST",
    path: "/forgot-password",
    body: t.Object({
      email: t.String({ format: "email", description: "User email address" }),
      redirectTo: t.Optional(
        t.String({ description: "URL to redirect after email is sent" }),
      ),
    }),
    description: "Send password reset email",
  },
  "reset-password": {
    method: "POST",
    path: "/reset-password",
    body: t.Object({
      token: t.String({ description: "Password reset token from email" }),
      password: t.String({ minLength: 8, description: "New password" }),
    }),
    description: "Reset password using token",
  },
  "change-password": {
    method: "POST",
    path: "/change-password",
    body: t.Object({
      currentPassword: t.String({ description: "Current password" }),
      newPassword: t.String({ minLength: 8, description: "New password" }),
    }),
    description: "Change password for authenticated user",
    requiresAuth: true,
  },
  "send-verification-email": {
    method: "POST",
    path: "/verification/send",
    body: t.Object({
      email: t.String({ format: "email", description: "Email to verify" }),
      callbackURL: t.Optional(
        t.String({ description: "URL to redirect after email is sent" }),
      ),
    }),
    description: "Send email verification",
  },
  "verify-email": {
    method: "GET",
    path: "/verification",
    query: t.Object({
      token: t.String({ description: "Verification token from email" }),
    }),
    description: "Verify email address using token",
  },
  "sign-in-oauth": {
    method: "GET",
    path: "/sign-in/:provider",
    params: t.Object({
      provider: t.String({ description: "OAuth provider name (google, github, etc.)" }),
    }),
    query: t.Object({
      callbackURL: t.Optional(t.String()),
      redirectTo: t.Optional(t.String()),
    }),
    description: "Initiate OAuth sign-in flow",
  },
  "oauth-callback": {
    method: "GET",
    path: "/callback/:provider",
    params: t.Object({
      provider: t.String({ description: "OAuth provider name" }),
    }),
    query: t.Object({
      code: t.Optional(t.String()),
      state: t.Optional(t.String()),
      error: t.Optional(t.String()),
      callbackURL: t.Optional(t.String()),
    }),
    description: "OAuth callback handler",
  },
  "link-account": {
    method: "POST",
    path: "/account/link",
    body: t.Object({
      provider: t.String(),
      clientId: t.String(),
      clientSecret: t.String(),
    }),
    description: "Link additional account (OAuth provider) to user",
    requiresAuth: true,
  },
  "unlink-account": {
    method: "POST",
    path: "/account/unlink",
    body: t.Object({
      accountId: t.String({ description: "ID of account to unlink" }),
    }),
    description: "Unlink an account from user",
    requiresAuth: true,
  },
  "update-user": {
    method: "PATCH",
    path: "/user/update",
    body: t.Optional(
      t.Object({
        name: t.Optional(t.String()),
        image: t.Optional(t.String()),
      }),
    ),
    description: "Update user profile information",
    requiresAuth: true,
  },
  "delete-user": {
    method: "POST",
    path: "/user/delete",
    body: t.Object({
      callbackURL: t.Optional(t.String()),
    }),
    description: "Delete user account",
    requiresAuth: true,
  },
  "change-email": {
    method: "POST",
    path: "/change-email",
    body: t.Object({
      email: t.String({ format: "email" }),
      callbackURL: t.Optional(t.String()),
    }),
    description: "Request email change",
    requiresAuth: true,
  },
  "admin-list-users": {
    method: "GET",
    path: "/admin/users",
    query: t.Object({
      limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      cursor: t.Optional(t.String()),
      search: t.Optional(t.String()),
    }),
    description: "List all users (admin only)",
    requiresAuth: true,
  },
  "admin-get-user": {
    method: "GET",
    path: "/admin/user/:userId",
    params: t.Object({
      userId: t.String({ description: "User ID" }),
    }),
    description: "Get user details (admin only)",
    requiresAuth: true,
  },
  "admin-update-user": {
    method: "PATCH",
    path: "/admin/user/:userId",
    params: t.Object({
      userId: t.String({ description: "User ID" }),
    }),
    body: t.Object({
      role: t.Optional(
        t.String({ enum: ["user", "admin"], description: "User role" }),
      ),
      banned: t.Optional(t.Boolean({ description: "Ban status" })),
      emailVerified: t.Optional(
        t.Boolean({ description: "Email verified status" }),
      ),
    }),
    description: "Update user (admin only)",
    requiresAuth: true,
  },
  "admin-delete-user": {
    method: "DELETE",
    path: "/admin/user/:userId",
    params: t.Object({
      userId: t.String({ description: "User ID" }),
    }),
    description: "Delete user (admin only)",
    requiresAuth: true,
  },
  "admin-list-sessions": {
    method: "GET",
    path: "/admin/sessions",
    query: t.Object({
      userId: t.Optional(t.String()),
      limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      cursor: t.Optional(t.String()),
    }),
    description: "List all sessions (admin only)",
    requiresAuth: true,
  },
  "admin-revoke-session": {
    method: "POST",
    path: "/admin/session/revoke",
    body: t.Object({
      sessionToken: t.String(),
    }),
    description: "Revoke any session (admin only)",
    requiresAuth: true,
  },
  "admin-list-accounts": {
    method: "GET",
    path: "/admin/accounts",
    query: t.Object({
      userId: t.Optional(t.String()),
      provider: t.Optional(t.String()),
    }),
    description: "List all accounts (admin only)",
    requiresAuth: true,
  },
};

export type BetterAuthEndpoints = keyof typeof betterAuthEndpoints;

export function createBetterAuthRoutes(config: BetterAuthPluginConfig = {}) {
  const { path = "/api/auth", excludedEndpoints = [], authInstance } = config;
  const basePath = path.replace(/\/$/, "");
  const auth = authInstance;

  const app = new Elysia({ name: "better-auth-swagger" });

  for (const [key, endpoint] of Object.entries(betterAuthEndpoints)) {
    if (excludedEndpoints.includes(key)) continue;

    const routePath = `${basePath}${endpoint.path}`;
    const detail = {
      tags: ["Authentication"],
      summary: endpoint.description,
      deprecated: false,
      security: endpoint.requiresAuth ? [{ bearerAuth: [] }] : undefined,
    };

    const routeOptions = {
      ...(endpoint.body && { body: endpoint.body }),
      ...(endpoint.query && { query: endpoint.query }),
      ...(endpoint.params && { params: endpoint.params }),
      ...(endpoint.response && { response: { 200: endpoint.response } }),
      detail,
    };

    // Route handler that forwards to Better Auth
    // Note: We must NOT call request.clone() here.
    // Elysia's body parser consumes the request body stream eagerly (when the
    // body is defined in the route schema). If we clone the request after that,
    // the clone's body stream is already consumed. Better Auth internally
    // calls request.clone() again, which hits the "body disturbed" error
    // from the edge runtime's fetch polyfill.
    //
    // Instead, for GET/HEAD requests (no body), use the original request.
    // For requests with a body, construct a new Request using the body content
    // that Elysia has already parsed and validated. Better Auth will call
    // clone() on this new Request, which has a fresh, unconsumed body stream.
    const handler = async ({
      request,
      body,
      set,
    }: {
      request: Request;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set: any;
    }) => {
      if (!auth) {
        set.status = 500;
        return new Response(JSON.stringify({ error: "Auth instance not configured" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      let authResponse: Response;

      if (body !== undefined) {
        // For requests with a body (POST/PATCH/PUT): construct a new Request
        // with the already-parsed body. Better Auth will call clone() on this,
        // and the clone's body stream will be fresh (not consumed).
        const newRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(body),
          credentials: "include",
        });
        authResponse = await auth.handler(newRequest);
      } else {
        // For GET/HEAD requests: use the original request directly.
        // Better Auth will call clone() on it, and since there's no body
        // stream, there's no conflict.
        authResponse = await auth.handler(request);
      }

      if (!authResponse) {
        set.status = 500;
        return new Response(JSON.stringify({ error: "No response from auth handler" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Sync HTTP Status code and headers (including Set-Cookie) from Better Auth
      set.status = authResponse.status;
      authResponse.headers.forEach((value, key) => {
        set.headers[key] = value;
      });

      // Consume the body and return a proper Response to avoid double-consumption
      const bodyText = await authResponse.text();
      return new Response(bodyText, {
        status: authResponse.status,
        headers: authResponse.headers,
      });
    };

    switch (endpoint.method) {
      case "GET":
        app.get(routePath, handler, routeOptions);
        break;
      case "POST":
        app.post(routePath, handler, routeOptions);
        break;
      case "PATCH":
        app.patch(routePath, handler, routeOptions);
        break;
      case "DELETE":
        app.delete(routePath, handler, routeOptions);
        break;
    }
  }

  return app;
}

