"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useCourseMutations } from "../hooks/use-course-mutations";
import { AdminCourseForm } from "./admin-course-form";
import { AdminLessonManager } from "./admin-lesson-manager";
import { AdminQuizBuilder } from "./admin-quiz-builder";
import { Button } from "@engducation/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";

export function AdminDashboardView() {
  const { deleteCourse, updateCourse } = useCourseMutations();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
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

  const handleToggleStatus = async (course: any) => {
    const nextStatus = course.status === "published" ? "draft" : "published";
    await updateCourse.mutateAsync({
      id: course.id,
      status: nextStatus,
    });
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa khóa học này?")) {
      await deleteCourse.mutateAsync({ id });
      if (selectedCourseId === id) {
        setSelectedCourseId(null);
        setSelectedLesson(null);
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
        <Card className="xl:col-span-2 border border-slate-300 dark:border-slate-800 rounded-none bg-slate-50/20 dark:bg-slate-900/10">
          <CardHeader className="py-3 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
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
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-slate-500">
                    <th className="p-2.5">Tên khóa học</th>
                    <th className="p-2.5 w-24 text-center">Trình độ</th>
                    <th className="p-2.5 w-20 text-center">Bài học</th>
                    <th className="p-2.5 w-24 text-center">Trạng thái</th>
                    <th className="p-2.5 w-64 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {coursesData.items.map((course) => {
                    const isSelected = selectedCourseId === course.id;
                    return (
                      <tr
                        key={course.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                          isSelected ? "bg-slate-100 dark:bg-slate-800/60 font-medium" : ""
                        }`}
                      >
                        <td className="p-2.5">
                          <div className="font-bold">{course.title}</div>
                          {course.description && (
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{course.description}</div>
                          )}
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5 select-all">ID: {course.id}</div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-1.5 py-0.5 border border-slate-300 dark:border-slate-800 text-[10px] font-bold">
                            {course.level}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono">{course.lessonCount}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 border text-[10px] font-bold ${
                              course.status === "published"
                                ? "border-emerald-300 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                                : "border-amber-300 text-amber-500 bg-amber-50 dark:bg-amber-950/20"
                            }`}
                          >
                            {course.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <div className="flex flex-wrap gap-1 justify-center">
                            <Button
                              onClick={() => {
                                setSelectedCourseId(course.id);
                                setSelectedLesson(null);
                              }}
                              className={`rounded-none px-2 py-1 h-7 text-[10px] font-bold ${
                                isSelected
                                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                                  : "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-300"
                              }`}
                            >
                              QUẢN LÝ
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingCourse(course)}
                              className="rounded-none border-slate-300 dark:border-slate-700 px-2 py-1 h-7 text-[10px] font-bold"
                            >
                              SỬA
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleToggleStatus(course)}
                              className="rounded-none border-slate-300 dark:border-slate-700 px-2 py-1 h-7 text-[10px] font-bold"
                            >
                              {course.status === "published" ? "DRAFT" : "PUBLISH"}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteCourse(course.id)}
                              className="rounded-none px-2 py-1 h-7 text-[10px] font-bold"
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
        <Card className="border border-slate-300 dark:border-slate-800 rounded-none bg-slate-50/10 dark:bg-slate-900/10">
          <CardHeader className="py-3 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Đề cương bài học khóa học: {courseDetail?.title ?? "..."}</span>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCourseId(null);
                  setSelectedLesson(null);
                }}
                className="rounded-none h-6 text-[10px] font-bold px-2 py-0 border-slate-300"
              >
                ĐÓNG
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {isDetailLoading ? (
              <p className="text-xs italic text-slate-500">Đang tải đề cương bài học...</p>
            ) : courseDetail ? (
              <>
                <AdminLessonManager
                  courseId={selectedCourseId}
                  lessons={courseDetail.lessons}
                  onSelectLessonForQuiz={(lesson) => {
                    // Find actual enriched lesson detail with quiz from courseDetail lessons
                    const matched = courseDetail.lessons.find((l) => l.id === lesson.id);
                    setSelectedLesson(matched);
                  }}
                />

                {/* SECTION 3: QUIZ & QUESTION BUILDER (ONLY SHOW IF LESSON SELECTED) */}
                {selectedLesson && (
                  <div className="pt-4 border-t border-slate-300 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2.5">
                      <div className="text-xs font-bold uppercase text-slate-500">Quản lý bài tập của bài học</div>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedLesson(null)}
                        className="rounded-none h-6 text-[10px] font-bold px-2 py-0 border-slate-300"
                      >
                        ẨN BÀI TẬP
                      </Button>
                    </div>
                    {/* Retrieve correct quiz state from courseDetail lessons */}
                    {(() => {
                      const enrichedLesson = courseDetail.lessons.find((l) => l.id === selectedLesson.id);
                      if (!enrichedLesson) return null;
                      return <AdminQuizBuilder courseId={selectedCourseId} lesson={enrichedLesson} />;
                    })()}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs italic text-slate-500">Không tìm thấy chi tiết khóa học.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
