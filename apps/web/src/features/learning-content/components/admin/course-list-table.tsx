"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { useCourseMutations } from "../../hooks/use-course-mutations";
import { AdminCourseForm } from "./admin-course-form";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Card, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import { Skeleton } from "@engducation/ui/components/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@engducation/ui/components/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@engducation/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@engducation/ui/components/dropdown-menu";
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
import { Tabs, TabsList, TabsTrigger } from "@engducation/ui/components/tabs";
import { Search, X, Plus, Edit2, Trash2, Globe, Lock, MoreVertical, BookOpen, Layers } from "lucide-react";

interface CourseListTableProps {
  adminId: string;
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const PAGE_SIZE = 10;

export function CourseListTable({ adminId }: CourseListTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);

  // Modal triggers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const { deleteCourse, publishCourse, restoreCourse } = useCourseMutations();

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch course list with pagination and custom query
  const { data: coursesData, isLoading } = useQuery(
    trpc.admin.courseList.queryOptions({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      level: (selectedLevel || undefined) as any,
      status: (selectedStatus || undefined) as any,
      showDeleted,
    })
  );

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
    } catch {
      // toast is automatically displayed
    }
    setDeleteTarget(null);
  };

  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setIsFormOpen(true);
  };

  const hasNextPage = (coursesData?.pagination.totalPages ?? 0) > page;
  const hasPrevPage = page > 1;

  return (
    <div className="space-y-6">
      {/* Header section with Premium Dashboard Styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 p-6 rounded-2xl border border-border/80 shadow-lg">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground via-rose-400 to-rose-500 bg-clip-text text-transparent">
            Quản Lý Khóa Học
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Xây dựng, cấu trúc, xuất bản và giảng dạy của bạn.
          </p>
        </div>
        <Button
          onClick={handleCreateCourse}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 rounded-xl transition-all hover:scale-[1.02] shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Tạo khóa học mới
        </Button>
      </div>

      {/* Elegant Premium Tabs for switching between Active and Deleted courses */}
      <div className="w-full border-b border-border/40 pb-1">
        <Tabs
          value={showDeleted ? "deleted" : "active"}
          onValueChange={(val) => {
            setShowDeleted(val === "deleted");
            setPage(1);
          }}
          className="w-full"
        >
          <TabsList className="bg-muted/40 p-1 rounded-xl gap-1 w-fit flex">
            <TabsTrigger
              value="active"
              className="rounded-lg text-xs font-bold px-4 py-1.5 transition-all data-[state=active]:bg-rose-600 data-[state=active]:text-white"
            >
              Khóa học hiện tại
            </TabsTrigger>
            <TabsTrigger
              value="deleted"
              className="rounded-lg text-xs font-bold px-4 py-1.5 transition-all data-[state=active]:bg-rose-600 data-[state=active]:text-white flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Thùng rác
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Glassmorphic Filter & Search Bar */}
      <Card className="border border-border/60 bg-card/60 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm tiêu đề hoặc mô tả khóa học..."
                className="pl-10 h-9 text-xs bg-background/50 border-border/70 rounded-xl focus:border-rose-500/50 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedLevel}
                onChange={(e) => {
                  setSelectedLevel(e.target.value);
                  setPage(1);
                }}
                className="flex h-9 border border-border/80 bg-background/50 rounded-xl px-3 py-1 text-xs text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50"
              >
                <option value="">Tất cả trình độ</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="flex h-9 border border-border/80 bg-background/50 rounded-xl px-3 py-1 text-xs text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 text-xs gap-1.5 hover:bg-muted/50 rounded-xl"
              >
                <X className="h-3.5 w-3.5" />
                Xóa bộ lọc
              </Button>
            )}

            <div className="ml-auto text-xs text-muted-foreground font-medium">
              Tìm thấy {coursesData?.pagination.total ?? 0} khóa học
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Course Listing Table */}
      <Card className="border border-border/60 bg-card/40 backdrop-blur-md shadow-md rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : !coursesData?.items.length ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-xs text-muted-foreground italic">
                {hasFilters ? "Không tìm thấy khóa học phù hợp với bộ lọc." : "Hệ thống chưa có khóa học nào."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/20 border-b border-border/60">
                <TableRow>
                  <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Khóa học</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground w-32 text-center">Trình độ</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground w-36 text-center">Gói & Giá tiền</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground w-32 text-center">Tuần học</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground w-36 text-center">Trạng thái</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground w-28 text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coursesData.items.map((course) => {
                  const hasCertificate = !!course.certificateTemplateUrl;
                  const totalModules = course.modules?.length ?? 0;

                  return (
                    <TableRow
                      key={course.id}
                      className="hover:bg-muted/10 transition-colors border-b border-border/50 group cursor-pointer"
                      onClick={() => {
                        if (!showDeleted) {
                          router.push(`/admin/${adminId}/courses/${course.id}`);
                        }
                      }}
                    >
                      {/* Name & Thumbnail */}
                      <TableCell className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div
                          className="flex items-center gap-3.5"
                          onClick={() => {
                            if (!showDeleted) {
                              router.push(`/admin/${adminId}/courses/${course.id}`);
                            }
                          }}
                        >
                          <div className="relative h-12 w-20 rounded-xl overflow-hidden border border-border/80 bg-muted/40 shadow-xs shrink-0 group-hover:border-rose-500/30 transition-colors">
                            {course.thumbnailUrl ? (
                              <img
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-rose-500/10 via-purple-500/5 to-slate-900 flex items-center justify-center font-bold text-[10px] text-muted-foreground uppercase">
                                {course.level}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-foreground group-hover:text-rose-500 transition-colors truncate">
                              {course.title}
                            </div>
                            {course.description && (
                              <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 max-w-sm leading-relaxed">
                                {course.description}
                              </div>
                            )}
                            {hasCertificate && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-[9px] font-extrabold uppercase border-sky-500/20 text-sky-600 bg-sky-500/5 leading-none px-1.5 py-0.5">
                                  Chứng chỉ
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Level */}
                      <TableCell className="p-4 text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-extrabold uppercase tracking-wide border-border/80 px-2 py-0.5 bg-muted/20"
                        >
                          {course.level}
                        </Badge>
                      </TableCell>

                      {/* Price / Premium status */}
                      <TableCell className="p-4 text-center">
                        {course.price === 0 ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-extrabold border-emerald-500/20 text-emerald-600 bg-emerald-500/5 px-2 py-0.5 uppercase"
                          >
                            Miễn phí
                          </Badge>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-bold text-xs text-foreground">
                              {course.price.toLocaleString("vi-VN")} VNĐ
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-extrabold mt-0.5">
                              PREMIUM
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Modules Count */}
                      <TableCell className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs font-mono font-bold text-foreground">
                          <Layers className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span>{totalModules}</span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="p-4 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 ${
                            course.status === "published"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/25"
                          }`}
                        >
                          {course.status === "published" ? "Hoạt động" : "Bản nháp"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {showDeleted ? (
                          <div className="flex items-center justify-center">
                            <Button
                              onClick={async () => {
                                await restoreCourse.mutateAsync({ id: course.id });
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-8 px-3 transition-all hover:scale-[1.02]"
                              disabled={restoreCourse.isPending}
                            >
                              {restoreCourse.isPending ? "Khôi phục..." : "Khôi phục"}
                            </Button>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-muted/80 rounded-xl"
                                />
                              }
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border border-border/80 shadow-xl rounded-xl p-1 w-44">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 py-1.5">
                                  Tùy chọn quản lý
                                </DropdownMenuLabel>
                              </DropdownMenuGroup>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => router.push(`/admin/${adminId}/courses/${course.id}`)}
                              >
                                <BookOpen className="h-3.5 w-3.5 text-rose-500" />
                                <span>Đề cương & Cấu trúc</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => handleEditCourse(course)}
                              >
                                <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                                <span>Sửa thông tin</span>
                              </DropdownMenuItem>
                              {course.status !== "published" ? (
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400"
                                  onClick={async () => {
                                    await publishCourse.mutateAsync({ courseId: course.id });
                                  }}
                                  disabled={publishCourse.isPending}
                                >
                                  <Globe className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Xuất bản khóa học</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="gap-2 opacity-50" disabled>
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>Đã xuất bản</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                className="gap-2 cursor-pointer"
                                onClick={() =>
                                  setDeleteTarget({
                                    id: course.id,
                                    title: course.title,
                                    lessonCount: course.lessonCount,
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Xóa khóa học</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination controls */}
          {coursesData && coursesData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/5">
              <span className="text-[10px] text-muted-foreground font-medium">
                Trang {page} / {coursesData.pagination.totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrevPage}
                  className="h-8 px-3 text-[10px] font-bold rounded-xl"
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNextPage}
                  className="h-8 px-3 text-[10px] font-bold rounded-xl"
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Elegant Form Dialog modal container for Create/Edit Course */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 shadow-2xl p-0">
          <DialogHeader className="p-4 border-b border-border/60 bg-muted/10">
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
              {editingCourse ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <AdminCourseForm
              editingCourse={editingCourse}
              onFinished={() => {
                setIsFormOpen(false);
                setEditingCourse(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl border border-border/80 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold uppercase">Xác nhận xóa khóa học</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground mt-2">
              Bạn có chắc chắn muốn di chuyển khóa học <strong className="text-foreground">&ldquo;{deleteTarget?.title}&rdquo;</strong> vào Thùng rác?
              <br />
              Học viên sẽ không thể truy cập khóa học này và các bài giảng đi kèm. Bạn có thể khôi phục lại bất kỳ lúc nào từ Thùng rác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl h-9 text-xs font-bold" onClick={() => setDeleteTarget(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl h-9 text-xs font-bold bg-destructive hover:bg-destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteCourse.isPending}
            >
              {deleteCourse.isPending ? "Đang xóa..." : "Xóa khóa học"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
