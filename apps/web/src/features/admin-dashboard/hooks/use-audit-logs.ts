"use client";

import { trpc } from "@/utils/trpc";

/**
 * Hook for fetching audit logs with React Query.
 * Pass `enabled` to prevent fetching when the audit tab is not visible.
 */
export function useAuditLogs(enabled = true) {
  return trpc.adminAdvanced.getAuditLogs.queryOptions(undefined, { enabled });
}
