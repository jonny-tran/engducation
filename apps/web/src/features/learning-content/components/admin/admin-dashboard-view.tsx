"use client";
import { useParams } from "next/navigation";
import { CourseListTable } from "./course-list-table";

export function AdminDashboardView() {
  const params = useParams();
  const adminId = params.adminId as string;

  return (
    <div className="space-y-6">
      <CourseListTable adminId={adminId} />
    </div>
  );
}
