import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export function useDashboardStats() {
  return useQuery(
    trpc.admin.dashboardStats.queryOptions()
  );
}
