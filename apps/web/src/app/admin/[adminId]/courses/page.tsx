"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useCourseMutations } from "@/features/learning-content";
import { AdminCourseForm } from "@/features/learning-content";
import { AdminLessonManager } from "@/features/learning-content";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Card, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import { Skeleton } from "@engducation/ui/components/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@engducation/ui/components/alert-dialog";
import { Search, Filter, X } from "lucide-react";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const STATUSES = ["draft", "published", "archived"] as const;
const PAGE_SIZE = 20;

export default function AdminCoursesPage() {
  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  // Course selection state
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; lessonCount: number } | null>(null);

  const { deleteCourse } = useCourseMutations();

  // Fetch course list with filters
  const { data: coursesData, isLoading } = useQuery(
    trpc.admin.courseList.queryOptions({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      level: (selectedLevel || undefined) as any,
      status: (selectedStatus || undefined) as any,
    })
  );

  // Fetch course detail when selected
  const { data: courseDetail, isLoading: isDetailLoading } = useQuery(
    trpc.admin.courseGetDetail.queryOptions(
      { courseId: selectedCourseId ?? "" },
      { enabled: !!selectedCourseId }
    )
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    const timer = setTimeout(() => setDebouncedSearch(value), 400);
    return () => clearTimeout(timer);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedLevel("");
    setSelectedStatus("");
    setPage(1);
  };

  const hasFilters = !!search || !!selectedLevel || !!selectedStatus;

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCourse.mutateAsync({ id: deleteTarget.id });
      if (selectedCourseId === deleteTarget.id) {
        setSelectedCourseId(null);
      }
    } catch {
      // Error is already handled in the mutation hook
    }
    setDeleteTarget(null);
  };

  const hasNextPage = (coursesData?.pagination.totalPages ?? 0) > page;
  const hasPrevPage = page > 1;

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {/* Top Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/60 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm font-medium">
          Quản lý Khóa học
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Filter Bar */}
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tìm kiếm theo tiêu đề, mô tả..."
                  className="pl-9 h-8 text-xs"
                />
              </div>

              <select
                value={selectedLevel}
                onChange={(e) => { setSelectedLevel(e.target.value); setPage(1); }}
                className="flex h-8 border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
              >
                <option value="">Tất cả cấp độ</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                className="flex h-8 border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-xs gap-1.5"
                >
                  <X className="h-3 w-3" />
                  Xóa bộ lọc
                </Button>
              )}

              <div className="ml-auto text-xs text-muted-foreground">
                {coursesData?.pagination.total ?? 0} khóa học
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Left: Course Form + List */}
          <div className="space-y-4 xl:col-span-1">
            {/* Course Form */}
            <AdminCourseForm
              editingCourse={editingCourse}
              onFinished={() => setEditingCourse(null)}
            />

            {/* Course List */}
            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : !coursesData?.items.length ? (
                  <p className="p-4 text-xs italic text-muted-foreground text-center">
                    {hasFilters ? "Không tìm thấy khóa học phù hợp" : "Chưa có khóa học nào"}
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {coursesData.items.map((course) => (
                      <div
                        key={course.id}
                        className={`p-3 hover:bg-muted/30 cursor-pointer transition-colors ${
                          selectedCourseId === course.id ? "bg-muted/60" : ""
                        }`}
                        onClick={() => {
                          setSelectedCourseId(course.id);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs truncate">{course.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[9px] font-bold uppercase">
                                {course.level}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-bold uppercase ${
                                  course.status === "published"
                                    ? "border-emerald-500/20 text-emerald-600"
                                    : "border-amber-500/20 text-amber-600"
                                }`}
                              >
                                {course.status}
                              </Badge>
                              <span className="text-[9px] text-muted-foreground">
                                {course.lessonCount} bài học
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCourse(course);
                              }}
                              className="h-6 px-2 text-[10px] font-bold"
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({
                                  id: course.id,
                                  title: course.title,
                                  lessonCount: course.lessonCount,
                                });
                              }}
                              className="h-6 px-2 text-[10px] font-bold text-destructive hover:text-destructive"
                            >
                              Xóa
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {coursesData && coursesData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-3 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      Trang {page} / {coursesData.pagination.totalPages}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!hasPrevPage}
                        className="h-7 text-[10px] font-bold"
                      >
                        ←
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!hasNextPage}
                        className="h-7 text-[10px] font-bold"
                      >
                        →
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Course Detail (Lessons + Quiz) */}
          <div className="xl:col-span-2">
            {!selectedCourseId ? (
              <Card className="border border-dashed border-border bg-card shadow-sm">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <Filter className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Chọn một khóa học từ danh sách bên trái để quản lý bài học
                  </p>
                </CardContent>
              </Card>
            ) : isDetailLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : courseDetail ? (
              <div className="space-y-4">
                <Card className="border border-border bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-bold text-sm">{courseDetail.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">
                            {courseDetail.level}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase ${
                              courseDetail.status === "published"
                                ? "border-emerald-500/20 text-emerald-600"
                                : "border-amber-500/20 text-amber-600"
                            }`}
                          >
                            {courseDetail.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {(courseDetail.modules ?? []).reduce((acc, m) => acc + (m.contents ?? []).filter(c => c.type === 'lesson').length, 0)} bài giảng · {(courseDetail.modules ?? []).reduce((acc, m) => acc + (m.contents ?? []).filter(c => c.type === 'quiz').length, 0)} trắc nghiệm · {(courseDetail.modules ?? []).reduce((acc, m) => acc + (m.contents ?? []).filter(c => c.type === 'writing').length, 0)} tự luận
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCourseId(null);
                        }}
                        className="h-7 text-[10px] font-bold"
                      >
                        Đóng
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <AdminLessonManager
                  courseId={selectedCourseId}
                  modules={courseDetail.modules}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khóa học</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.lessonCount > 0 ? (
                <>
                  Khóa học{" "}
                  <strong>&ldquo;{deleteTarget.title}&rdquo;</strong> đang có{" "}
                  <strong>{deleteTarget.lessonCount} bài học</strong>. Hãy xóa toàn bộ bài học
                  trước khi xóa khóa học này.
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn xóa khóa học{" "}
                  <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>? Hành động này không thể hoàn
                  tác.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteCourse.isPending || (deleteTarget?.lessonCount ?? 0) > 0}
            >
              {deleteCourse.isPending
                ? "Đang xóa..."
                : (deleteTarget?.lessonCount ?? 0) > 0
                ? "Còn bài học"
                : "Xóa khóa học"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
