// src/lib/api-endpoints.ts

export const API_ENDPOINTS = {
  AUTH: {
    SIGN_IN: "/auth/sign-in",
    SIGN_UP: "/auth/sign-up",
    SESSION: "/auth/session",
  },
  COURSES: {
    LIST: "/admin/content/courses",
    DETAIL: (id: string) => `/admin/content/courses/${id}`,
    CREATE: "/admin/content/courses/create",
    UPDATE: (id: string) => `/admin/content/courses/${id}/update`,
    DELETE: (id: string) => `/admin/content/courses/${id}/delete`,
  },
  AI_WRITING: {
    CHECK_GRAMMAR: "/ai/writing/check-grammar", // Trọng tâm xử lý kỹ năng viết (SRS 3.2)
    GET_HISTORY: "/ai/writing/history",
  },
  VOCABULARY: {
    LIST: "/vocabulary",
    ADD_NOTEBOOK: "/vocabulary/notebook/add",
  },
  // Supporting mapped trpc routes for actual communication with current backend
  TRPC: {
    SUBMIT_WRITING: "/trpc/user.submitWriting?batch=1",
    WRITING_HISTORY: (writingId: string) => `/trpc/user.writingSubmissionsHistory?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": { writingId } }))}`,
    WRITING_DETAIL: (writingId: string) => `/trpc/user.writingGetDetail?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": { writingId } }))}`,
  }
} as const;

// Ép kiểu để ngăn chặn việc ghi đè vô tình ở các file khác
export type ApiEndpoints = typeof API_ENDPOINTS;
