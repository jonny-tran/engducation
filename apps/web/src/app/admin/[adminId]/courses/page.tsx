"use client";

import { useParams } from "next/navigation";
import { CourseListTable } from "@/features/learning-content";

export default function AdminCoursesPage() {
  const params = useParams();
  const adminId = params.adminId as string;

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {/* Top Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/50 px-6 bg-background/60 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Bảng quản trị &gt; Danh sách khóa học
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 max-w-7xl w-full mx-auto">
        <CourseListTable adminId={adminId} />
      </div>
    </div>
  );
}
