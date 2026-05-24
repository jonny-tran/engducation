"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { VocabularyCard } from "./vocabulary-card";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Skeleton } from "@engducation/ui/components/skeleton";
import { Search, Filter, X, ChevronLeft, ChevronRight, BookOpen, Bookmark } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
type CefrLevel = typeof CEFR_LEVELS[number];
const PAGE_SIZE = 8; // Beautiful grid layout

export function StudentNotebookView() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const queryClient = useQueryClient();

  // Page States
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Fetch Bookmarked List of Vocabularies
  const { data, isLoading } = useQuery(
    trpc.userVocabulary.getPersonalNotebook.queryOptions(
      {
        page: currentPage,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
      },
      {
        enabled: !!session, // Execute query only if authenticated
        staleTime: 5000, // Frequent updates on notebook
      }
    )
  );

  // Toggle Save Mutation with Optimistic Hide & Sonner Undo action
  const toggleSave = useMutation(
    trpc.userVocabulary.toggleSave.mutationOptions({
      onMutate: async ({ vocabularyId }: { vocabularyId: string }) => {
        const filterKey = {
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: debouncedSearch || undefined,
        };

        const queryKey = trpc.userVocabulary.getPersonalNotebook.queryKey(filterKey);

        // Cancel outgoing fetches
        await queryClient.cancelQueries({ queryKey });

        // Snapshot current cache
        const previousData = queryClient.getQueryData<any>(queryKey);

        let removedItem: any = null;

        // Optimistically hide from Personal Notebook immediately
        if (previousData) {
          removedItem = previousData.items.find((item: any) => item.id === vocabularyId);

          queryClient.setQueryData(queryKey, {
            ...previousData,
            items: previousData.items.filter((item: any) => item.id !== vocabularyId),
            pagination: {
              ...previousData.pagination,
              total: previousData.pagination.total - 1,
              totalPages: Math.ceil((previousData.pagination.total - 1) / PAGE_SIZE),
            },
          });
        }

        return { previousData, queryKey, removedItem };
      },
      onError: (err: any, variables: any, context: any) => {
        // Rollback on failure
        if (context?.previousData && context?.queryKey) {
          queryClient.setQueryData(context.queryKey, context.previousData);
        }
      },
      onSuccess: (res: any, variables: any, context: any) => {
        // If un-saved successfully (saved === false), show Toast with "Undo" button
        if (!res.saved && context?.removedItem) {
          toast("Đã hủy lưu từ vựng khỏi sổ tay", {
            action: {
              label: "Hoàn tác",
              onClick: () => {
                // Restore it by calling toggleSave again
                toggleSave.mutate({ vocabularyId: variables.vocabularyId });
              },
            },
          });
        } else if (res.saved) {
          toast.success("Đã hoàn tác và thêm lại từ vựng!");
        }
      },
      onSettled: () => {
        // Synchronize in the background
        queryClient.invalidateQueries({
          queryKey: trpc.userVocabulary.getPersonalNotebook.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.userVocabulary.list.queryKey(),
        });
      },
    })
  );

  const handleToggleBookmark = async (id: string) => {
    if (!session) {
      toast.error("Vui lòng đăng nhập để thao tác!");
      router.push("/login");
      return;
    }
    toggleSave.mutate({ vocabularyId: id });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    const timer = setTimeout(() => setDebouncedSearch(value), 400);
    return () => clearTimeout(timer);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // If loading session, return clean visual skeleton
  if (isSessionPending) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Redirect if guest visits personal notebook directly
  if (!session) {
    router.push("/login");
    return null;
  }

  const hasFilters = !!search;
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Navigation Sub-tabs */}
      <div className="flex border-b border-border">
        <Link href={"/vocabulary" as any} className="px-4 py-2.5 border-b-2 border-transparent text-xs font-bold uppercase text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" /> Từ điển hệ thống
        </Link>
        <Link href={"/vocabulary/my-notebook" as any} className="px-4 py-2.5 border-b-2 border-primary text-xs font-black uppercase text-foreground flex items-center gap-1.5 transition-all">
          <Bookmark className="h-3.5 w-3.5 text-primary" /> Sổ tay của tôi
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm trong từ vựng đã lưu..."
            className="pl-9 h-9 text-xs rounded-xl border-border bg-card shadow-sm"
          />
        </div>

        {/* Filters pills and select dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-[10px] font-bold gap-1 rounded-full text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" /> Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
            <Skeleton key={idx} className="h-44 rounded-2xl bg-card border" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 border border-dashed border-border rounded-3xl bg-muted/5 flex flex-col items-center justify-center text-center space-y-3">
          <span className="text-4xl">🔖</span>
          <div className="font-bold text-sm text-foreground">Sổ tay của bạn đang trống</div>
          <p className="text-[11px] text-muted-foreground max-w-sm leading-relaxed">
            {hasFilters 
              ? "Không có từ vựng nào đã lưu đáp ứng bộ lọc của bạn."
              : "Bạn chưa lưu từ vựng nào. Hãy truy cập học các khóa học để lưu lại từ vựng đã học."}
          </p>
          {hasFilters ? (
            <Button variant="outline" onClick={clearFilters} className="text-xs font-bold rounded-xl mt-2">
              Khôi phục bộ lọc
            </Button>
          ) : (
            <Link href={"/courses" as any}>
              <Button className="text-xs font-bold rounded-xl mt-2 bg-primary hover:bg-primary/95 text-primary-foreground">
                Đến các khóa học
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((vocab) => (
              <VocabularyCard
                key={vocab.id}
                vocabulary={{ ...vocab, isSaved: true }}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-[10px] font-bold text-muted-foreground font-mono">
                Trang {currentPage} / {totalPages} — {pagination?.total} từ đã lưu
              </span>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
