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

export function StudentVocabularyView() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const queryClient = useQueryClient();

  // Selected Course ID State
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Page States for Vocabulary List
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 1. Fetch available/published courses
  const { data: coursesData, isLoading: isCoursesLoading } = useQuery(
    trpc.user.courseList.queryOptions(
      {
        page: 1,
        pageSize: 100, // Load all for selector
      },
      {
        enabled: !!session,
      }
    )
  );

  const coursesList = coursesData?.items ?? [];
  const selectedCourse = coursesList.find((c) => c.id === selectedCourseId) || coursesList[0];

  // Sync selectedCourseId when courses list finishes loading
  if (coursesList.length > 0 && !selectedCourseId) {
    setSelectedCourseId(coursesList[0].id);
  }

  // 2. Fetch vocabulary list for selected course if enrolled
  const isEnrolled = selectedCourse?.isEnrolled ?? false;

  const { data: vocabData, isLoading: isVocabLoading } = useQuery(
    trpc.userVocabulary.list.queryOptions(
      {
        courseId: selectedCourseId || "",
        page: currentPage,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
      },
      {
        enabled: !!session && !!selectedCourseId && isEnrolled,
        staleTime: 1000 * 60 * 10, // 10 minutes cache
      }
    )
  );

  // 3. Enroll Course Mutation
  const enrollCourse = useMutation(
    trpc.user.courseEnroll.mutationOptions({
      onSuccess: () => {
        toast.success("Đăng ký khóa học thành công! Từ vựng đã được mở khóa.");
        queryClient.invalidateQueries({
          queryKey: trpc.user.courseList.queryKey(),
        });
        if (selectedCourseId) {
          queryClient.invalidateQueries({
            queryKey: trpc.userVocabulary.list.queryKey({ courseId: selectedCourseId }),
          });
        }
      },
      onError: (err) => {
        toast.error(`Đăng ký khóa học thất bại: ${err.message}`);
      },
    })
  );

  // 4. Toggle Save Mutation with robust Optimistic Update
  const toggleSave = useMutation(
    trpc.userVocabulary.toggleSave.mutationOptions({
      onMutate: async ({ vocabularyId }: { vocabularyId: string }) => {
        if (!selectedCourseId) return;

        const filterKey = {
          courseId: selectedCourseId,
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: debouncedSearch || undefined,
        };

        const queryKey = trpc.userVocabulary.list.queryKey(filterKey);

        // Cancel outgoing fetches
        await queryClient.cancelQueries({ queryKey });

        // Snapshot current cache
        const previousData = queryClient.getQueryData<any>(queryKey);

        // Optimistically update the list
        if (previousData) {
          queryClient.setQueryData(queryKey, {
            ...previousData,
            items: previousData.items.map((item: any) =>
              item.id === vocabularyId
                ? { ...item, isSaved: !item.isSaved }
                : item
            ),
          });
        }

        return { previousData, queryKey };
      },
      onError: (err: any, variables: any, context: any) => {
        // Rollback on failure
        if (context?.previousData && context?.queryKey) {
          queryClient.setQueryData(context.queryKey, context.previousData);
        }
      },
      onSettled: () => {
        // Synchronize in the background
        queryClient.invalidateQueries({
          queryKey: trpc.userVocabulary.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.userVocabulary.getPersonalNotebook.queryKey(),
        });
      },
    })
  );

  const handleToggleBookmark = async (id: string) => {
    if (!session) {
      toast.error("Vui lòng đăng nhập để lưu từ vựng!");
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

  const handleEnroll = () => {
    if (!selectedCourseId) return;
    enrollCourse.mutate({ courseId: selectedCourseId });
  };

  // If loading session, return clean visual skeleton
  if (isSessionPending || isCoursesLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Redirect if guest visits page directly
  if (!session) {
    router.push("/login");
    return null;
  }

  const hasFilters = !!search;
  const items = vocabData?.items ?? [];
  const pagination = vocabData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Navigation Sub-tabs */}
      <div className="flex border-b border-border">
        <Link href={"/vocabulary" as any} className="px-4 py-2.5 border-b-2 border-primary text-xs font-black uppercase text-foreground flex items-center gap-1.5 transition-all">
          <BookOpen className="h-3.5 w-3.5 text-primary" /> Từ điển hệ thống
        </Link>
        <Link href={"/vocabulary/my-notebook" as any} className="px-4 py-2.5 border-b-2 border-transparent text-xs font-bold uppercase text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all">
          <Bookmark className="h-3.5 w-3.5 text-muted-foreground" /> Sổ tay của tôi
        </Link>
      </div>

      {coursesList.length === 0 ? (
        <div className="p-16 border border-dashed border-border rounded-3xl bg-muted/5 flex flex-col items-center justify-center text-center space-y-3">
          <span className="text-4xl">📚</span>
          <div className="font-bold text-sm text-foreground">Chưa có khóa học nào được xuất bản</div>
          <p className="text-[11px] text-muted-foreground max-w-sm">
            Hệ thống đang cập nhật các khóa học mới. Vui lòng quay lại sau!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Course Selector bar */}
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-primary tracking-wider">Khóa học đang chọn</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedCourseId || ""}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setCurrentPage(1);
                    clearFilters();
                  }}
                  className="font-extrabold text-sm text-foreground bg-transparent border-b border-muted-foreground/30 focus:border-primary outline-none py-1 pr-6"
                >
                  {coursesList.map((course) => (
                    <option key={course.id} value={course.id} className="text-foreground bg-background">
                      [{course.level}] {course.title} {course.isEnrolled ? "(Đã đăng ký)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCourse && (
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase border ${selectedCourse.isEnrolled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}>
                  {selectedCourse.isEnrolled ? "Đã đăng ký" : "Chưa đăng ký"}
                </span>
                {selectedCourse.price > 0 ? (
                  <span className="text-xs font-black text-indigo-600">
                    {selectedCourse.price.toLocaleString("vi-VN")} đ
                  </span>
                ) : (
                  <span className="text-xs font-black text-emerald-600 uppercase">Miễn phí</span>
                )}
              </div>
            )}
          </div>

          {!isEnrolled ? (
            /* Locked State UI */
            <div className="p-16 border border-dashed border-border rounded-3xl bg-amber-500/5 flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-5xl">🔒</span>
              <div className="font-black text-base text-foreground">Nội dung từ vựng đang bị khóa</div>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                Từ vựng của khóa học <span className="font-bold text-foreground">“{selectedCourse?.title}”</span> được thiết kế chuyên biệt song hành cùng bài học. Hãy đăng ký khóa học này để mở khóa toàn bộ kho từ vựng Flashcard!
              </p>
              <Button
                onClick={handleEnroll}
                disabled={enrollCourse.isPending}
                className="text-xs font-bold px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md"
              >
                {enrollCourse.isPending ? "Đang xử lý..." : "Đăng ký khóa học ngay"}
              </Button>
            </div>
          ) : (
            /* Unlocked Vocabulary List */
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Tìm tên từ vựng hoặc nghĩa tiếng Việt..."
                    className="pl-9 h-9 text-xs rounded-xl border-border bg-card shadow-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-[10px] font-bold gap-1 rounded-full text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" /> Xóa lọc
                    </Button>
                  )}
                </div>
              </div>

              {isVocabLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                    <Skeleton key={idx} className="h-44 rounded-2xl bg-card border" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="p-16 border border-dashed border-border rounded-3xl bg-muted/5 flex flex-col items-center justify-center text-center space-y-3">
                  <span className="text-4xl">📚</span>
                  <div className="font-bold text-sm text-foreground">Không tìm thấy từ vựng nào</div>
                  <p className="text-[11px] text-muted-foreground max-w-sm">
                    {hasFilters
                      ? "Không tìm thấy từ vựng nào đáp ứng từ khóa tìm kiếm của bạn."
                      : "Khóa học này chưa có từ vựng nào được cập nhật."}
                  </p>
                  {hasFilters && (
                    <Button variant="outline" onClick={clearFilters} className="text-xs font-bold rounded-xl mt-2">
                      Khôi phục bộ lọc
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((vocab) => (
                      <VocabularyCard
                        key={vocab.id}
                        vocabulary={vocab}
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
                        Trang {currentPage} / {totalPages} — {pagination?.total} từ vựng
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
          )}
        </div>
      )}
    </div>
  );
}
