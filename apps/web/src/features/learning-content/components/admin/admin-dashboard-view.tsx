"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useCourseMutations } from "../../hooks/use-course-mutations";
import { AdminCourseForm } from "./admin-course-form";
import { AdminLessonManager } from "./admin-lesson-manager";
import { Button } from "@engducation/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";

export function AdminDashboardView() {
  const router = useRouter();
  const params = useParams();
  const adminId = params.adminId as string;
  const { deleteCourse, publishCourse } = useCourseMutations();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);

  // Fetch course list (no filters)
  const { data: coursesData, isLoading: isCoursesLoading } = useQuery(
    trpc.admin.courseList.queryOptions({})
  );

  // Fetch course detail (lessons and quizzes)
  const { data: courseDetail, isLoading: isDetailLoading } = useQuery(
    trpc.admin.courseGetDetail.queryOptions(
      { courseId: selectedCourseId ?? "" },
      { enabled: !!selectedCourseId }
    )
  );

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa khóa học này?")) {
      await deleteCourse.mutateAsync({ id });
      if (selectedCourseId === id) {
        setSelectedCourseId(null);
      }
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-800 dark:text-slate-100 p-1">
      {/* SECTION 1: COURSE MANAGEMENT HEADER & FORM */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Course Creation Form (1 col) */}
        <div>
          <AdminCourseForm
            editingCourse={editingCourse}
            onFinished={() => {
              setEditingCourse(null);
            }}
          />
        </div>

        {/* Course Directory List Table (2 cols) */}
        <Card className="xl:col-span-2 border border-border bg-card shadow-sm">
          <CardHeader className="py-3 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
              Danh sách khóa học (Admin CMS)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isCoursesLoading ? (
              <p className="p-4 text-xs italic text-slate-500">Đang tải danh sách khóa học...</p>
            ) : !coursesData?.items || coursesData.items.length === 0 ? (
              <p className="p-4 text-xs italic text-slate-500">Chưa có khóa học nào.</p>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border font-bold uppercase text-muted-foreground">
                    <th className="p-2.5">Tên khóa học</th>
                    <th className="p-2.5 w-24 text-center">Trình độ</th>
                    <th className="p-2.5 w-20 text-center">Bài học</th>
                    <th className="p-2.5 w-24 text-center">Trạng thái</th>
                    <th className="p-2.5 w-64 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coursesData.items.map((course) => {
                    const isSelected = selectedCourseId === course.id;
                    return (
                      <tr
                        key={course.id}
                        className={`hover:bg-muted/30 ${isSelected ? "bg-muted/60 font-medium" : ""
                          }`}
                      >
                        <td className="p-2.5">
                          <div className="font-bold">{course.title}</div>
                          {course.description && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{course.description}</div>
                          )}
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                            Giá: {course.price === 0 ? "Miễn phí" : `${course.price.toLocaleString("vi-VN")} VNĐ`}
                          </div>
                          {course.certificateTemplateUrl && (
                            <div className="mt-1">
                              <Badge variant="outline" className="text-[9px] font-bold uppercase border-blue-500/20 text-blue-600">
                                Chứng chỉ
                              </Badge>
                            </div>
                          )}
                          <div className="text-[9px] text-muted-foreground font-mono mt-0.5 select-all">ID: {course.id}</div>
                        </td>
                        <td className="p-2.5 text-center">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">
                            {course.level}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-center font-mono">{course.lessonCount}</td>
                        <td className="p-2.5 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase ${course.status === "published"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}
                          >
                            {course.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-2.5">
                          <div className="flex flex-wrap gap-1 justify-center">
                            <Button
                              onClick={() => {
                                setSelectedCourseId(course.id);
                              }}
                              size="sm"
                              variant={isSelected ? "default" : "secondary"}
                              className="text-[10px] font-bold"
                            >
                              QUẢN LÝ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCourse(course)}
                              className="text-[10px] font-bold"
                            >
                              SỬA
                            </Button>
                            {course.status !== "published" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    await publishCourse.mutateAsync({ courseId: course.id });
                                }}
                                className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                                disabled={publishCourse.isPending}
                              >
                                {publishCourse.isPending ? "..." : "PUBLISH"}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="text-[10px] font-bold opacity-60"
                              >
                                PUBLISHED
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-[10px] font-bold"
                            >
                              XÓA
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: LESSON & SYLLABUS MANAGEMENT (ONLY SHOW IF COURSE SELECTED) */}
      {selectedCourseId && (
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="py-3 border-b border-border bg-muted/20">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center justify-between text-foreground">
              <span>Đề cương bài học khóa học: {courseDetail?.title ?? "..."}</span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setSelectedCourseId(null);
                }}
                className="text-[10px] font-bold"
              >
                ĐÓNG
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {isDetailLoading ? (
              <p className="text-xs italic text-slate-500">Đang tải đề cương bài học...</p>
            ) : courseDetail ? (
              <AdminLessonManager
                courseId={selectedCourseId}
                modules={courseDetail.modules}
                onManageVocabulary={(moduleId) => {
                  router.push(`/admin/${adminId}/courses?courseId=${selectedCourseId}&moduleId=${moduleId}&trigger=1`);
                }}
              />
            ) : (
              <p className="text-xs italic text-slate-500">Không tìm thấy chi tiết khóa học.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
