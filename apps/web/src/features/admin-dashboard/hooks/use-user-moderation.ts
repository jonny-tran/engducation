"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/** Shape of a user returned by the admin user list endpoint */
interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  banned: boolean | null;
  banReason: string | null;
  createdAt: string;
}

/**
 * Hook for user moderation actions: listing, banning, unbanning, and creating users.
 * Encapsulates all tRPC calls and local UI state for the moderation panel.
 */
export function useUserModeration(): {
  users: AdminUser[];
  isLoading: boolean;
  search: string;
  setSearch: (s: string) => void;
  banUser: (userId: string, reason?: string) => void;
  isBanning: boolean;
  unbanUser: (userId: string) => void;
  isUnbanning: boolean;
  createUser: (input: { name: string; email: string; password: string; role: "user" | "admin" }) => void;
  isCreating: boolean;
} {
  const queryClient = useQueryClient();

  // ─── Query ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");

  const getUsersOptions = trpc.adminAdvanced.getUsers.queryOptions(
    { search: search || undefined },
    { placeholderData: (prev) => prev }
  );

  const usersQuery = useQuery(getUsersOptions);

  const usersQueryKey = trpc.adminAdvanced.getUsers.queryOptions().queryKey;

  // ─── Mutations ────────────────────────────────────────────────────────────
  const banUserMutation = useMutation(
    trpc.adminAdvanced.banUser.mutationOptions({
      onSuccess: () => {
        toast.success("Đã khóa tài khoản & hủy phiên người dùng thành công!");
        queryClient.invalidateQueries({ queryKey: usersQueryKey });
      },
      onError: (err) => {
        toast.error(err.message || "Khóa tài khoản thất bại");
      },
    })
  );

  const unbanUserMutation = useMutation(
    trpc.adminAdvanced.unbanUser.mutationOptions({
      onSuccess: () => {
        toast.success("Đã mở khóa tài khoản thành công!");
        queryClient.invalidateQueries({ queryKey: usersQueryKey });
      },
      onError: (err) => {
        toast.error(err.message || "Mở khóa tài khoản thất bại");
      },
    })
  );

  const createUserMutation = useMutation(
    trpc.adminAdvanced.createUserByAdmin.mutationOptions({
      onSuccess: () => {
        toast.success("Tạo tài khoản thành công!");
        queryClient.invalidateQueries({ queryKey: usersQueryKey });
      },
      onError: (err) => {
        toast.error(err.message || "Tạo tài khoản thất bại");
      },
    })
  );

  // ─── Actions ─────────────────────────────────────────────────────────────
  const banUser = (userId: string, reason?: string) => {
    banUserMutation.mutate({ userId, reason });
  };

  const unbanUser = (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn mở khóa tài khoản này không?")) return;
    unbanUserMutation.mutate({ userId });
  };

  const createUser = (input: {
    name: string;
    email: string;
    password: string;
    role: "user" | "admin";
  }) => {
    createUserMutation.mutate(input);
  };

  return {
    // Query state
    users: (usersQuery.data ?? []) as AdminUser[],
    isLoading: usersQuery.isLoading,
    search,
    setSearch,

    // Mutation state & actions
    banUser,
    isBanning: banUserMutation.isPending,
    unbanUser,
    isUnbanning: unbanUserMutation.isPending,
    createUser,
    isCreating: createUserMutation.isPending,
  };
}
