"use client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { AdminCourseForm } from "./admin-course-form";
import { ModuleAccordionList } from "../shared/module-accordion-list";
import { Button } from "@engducation/ui/components/button";
import { Skeleton } from "@engducation/ui/components/skeleton";
import { ArrowLeft, BookOpen, Layers, Settings, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AdminCourseDetailViewProps {
  adminId: string;
  courseId: string;
}

export function AdminCourseDetailView({ adminId, courseId }: AdminCourseDetailViewProps) {
  const router = useRouter();

  // Fetch course details (modules, lessons, quizzes)
  const { data: courseDetail, isLoading, error } = useQuery(
    trpc.admin.courseGetDetail.queryOptions({ courseId })
  );

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 h-full w-full">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/50 px-6 bg-background/60 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Đang tải dữ liệu khóa học...
          </div>
        </header>
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-48 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 rounded-2xl lg:col-span-1" />
            <Skeleton className="h-[480px] rounded-2xl lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !courseDetail) {
    return (
      <div className="flex flex-col flex-1 h-full w-full">
        <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
          <Layers className="h-10 w-10 text-destructive/40 mb-3" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Không tìm thấy khóa học</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Khóa học không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <Button
            onClick={() => router.push(`/admin/${adminId}/courses`)}
            className="mt-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {/* Premium Sticky Header with Breadcrumbs */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/50 px-6 bg-background/60 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Link href={`/admin/${adminId}/courses`} className="hover:text-rose-500 transition-colors">
            Khóa học
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground truncate max-w-xs">{courseDetail.title}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/${adminId}/courses`)}
          className="h-8 text-[10px] font-bold gap-1 rounded-xl"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
        </Button>
      </header>

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation / Intro Widget */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950/15 to-slate-900 p-5 rounded-2xl border border-border/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 mt-0.5">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground truncate max-w-md md:max-w-xl">
                {courseDetail.title}
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5 select-all">
                ID Khóa học: {courseDetail.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-foreground">
                {(courseDetail.modules ?? []).length} Học phần
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Cấu trúc lộ trình đào tạo
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (1/3): Course Form */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-20">
            <div className="flex items-center gap-1.5 px-1">
              <Settings className="h-4 w-4 text-rose-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cấu hình thông tin chung
              </h2>
            </div>
            <AdminCourseForm
              editingCourse={courseDetail}
              onFinished={() => {
                toast.success("Đã cập nhật cấu hình chung khóa học thành công!");
              }}
            />
          </div>

          {/* Right Column (2/3): Modules Accordion List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-1.5 px-1">
              <Layers className="h-4 w-4 text-rose-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Đề cương & Danh sách Học phần
              </h2>
            </div>
            <ModuleAccordionList
              adminId={adminId}
              courseId={courseId}
              modules={courseDetail.modules}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
