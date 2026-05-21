"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { LessonPlayer } from "./lesson-player";
import { QuizEngine } from "./quiz-engine";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Button } from "@engducation/ui/components/button";

export function StudentDashboardView() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);

  // 1. Published Course Directory Query
  const { data: coursesData, isLoading: isCoursesLoading } = useQuery(
    trpc.user.courseList.queryOptions({
      page: 1,
      pageSize: 10,
    })
  );

  // 2. Course Detail & Syllabus Query
  const { data: courseDetail, isLoading: isDetailLoading } = useQuery(
    trpc.user.courseGetDetail.queryOptions(
      { courseId: selectedCourseId ?? "" },
      { enabled: !!selectedCourseId }
    )
  );

  // Selected Lesson helper
  const selectedLesson = courseDetail?.lessons.find((l) => l.id === selectedLessonId);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedLessonId(null);
    setIsTakingQuiz(false);
  };

  const handleLessonSelect = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsTakingQuiz(false);
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full p-1 space-y-4 text-xs text-slate-800 dark:text-slate-100">
      {/* HEADER BANNER */}
      <div className="p-4 border-2 border-slate-900 dark:border-slate-100 rounded-none bg-indigo-50 dark:bg-slate-900/50">
        <h1 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
          Không gian Học tập & Tích hợp Nội dung
        </h1>
        <p className="text-[10px] text-slate-500 mt-1">
          Dành cho học viên: Duyệt khóa học, xem bài giảng Cloudinary Signed URL và củng cố kiến thức qua đề thi trắc nghiệm.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* LEFT COLUMN: COURSE DIRECTORY & SYLLABUS LIST (1 COL) */}
        <div className="space-y-4 lg:col-span-1">
          {/* Courses List */}
          <Card className="border border-slate-300 dark:border-slate-800 rounded-none">
            <CardHeader className="py-2.5 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-xs font-bold uppercase tracking-wider">
                Khóa học đã xuất bản ({coursesData?.items.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-1 space-y-1">
              {isCoursesLoading ? (
                <p className="p-3 text-[11px] italic text-slate-500">Đang tải danh mục khóa học...</p>
              ) : !coursesData?.items || coursesData.items.length === 0 ? (
                <p className="p-3 text-[11px] italic text-slate-500">Chưa có khóa học nào được xuất bản.</p>
              ) : (
                coursesData.items.map((course) => {
                  const isSelected = selectedCourseId === course.id;
                  const percentComplete = course.totalLessons > 0
                    ? Math.round((course.completedLessons / course.totalLessons) * 100)
                    : 0;

                  return (
                    <button
                      key={course.id}
                      onClick={() => handleCourseSelect(course.id)}
                      className={`w-full text-left p-2.5 border transition-all text-xs flex flex-col gap-1 rounded-none ${isSelected
                          ? "border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 font-bold"
                          : "border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-950 dark:border-slate-800"
                        }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold line-clamp-1">{course.title}</span>
                        <span className="px-1 py-0.5 border border-slate-300 dark:border-slate-800 text-[9px] font-mono leading-none">
                          {course.level}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                        <span>Tiến trình: {course.completedLessons}/{course.totalLessons} bài học ({percentComplete}%)</span>
                      </div>
                      {/* Simple progress bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 mt-1">
                        <div
                          className="bg-indigo-600 h-1 transition-all duration-300"
                          style={{ width: `${percentComplete}%` }}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Syllabus (Lessons of Selected Course) */}
          {selectedCourseId && (
            <Card className="border border-slate-300 dark:border-slate-800 rounded-none bg-slate-50/20 dark:bg-slate-900/10">
              <CardHeader className="py-2.5 border-b border-slate-200 dark:border-slate-800">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Đề cương: {courseDetail?.title ?? "..."}</span>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCourseId(null)}
                    className="h-4 p-0 text-[10px] hover:bg-transparent font-bold underline"
                  >
                    BỎ CHỌN
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1.5">
                {isDetailLoading ? (
                  <p className="p-3 text-[11px] italic text-slate-500 animate-pulse">Đang tải danh sách bài học...</p>
                ) : !courseDetail?.lessons || courseDetail.lessons.length === 0 ? (
                  <p className="p-3 text-[11px] italic text-slate-500">Khóa học này chưa có bài học nào.</p>
                ) : (
                  <div className="space-y-1">
                    {courseDetail.lessons.map((lesson) => {
                      const isSelected = selectedLessonId === lesson.id;
                      const hasVideo = lesson.videoUrl || lesson.videoPublicId;

                      // Progress status color
                      // COMPLETED: Green, LEARNING: Yellow, null/other: Grey
                      let statusBg = "border-slate-300 text-slate-500 bg-slate-100 dark:bg-slate-900";
                      if (lesson.progressStatus === "completed") {
                        statusBg = "border-green-300 text-green-700 bg-green-50/50 dark:bg-green-950/20 dark:text-green-400";
                      } else if (lesson.progressStatus === "learning") {
                        statusBg = "border-yellow-300 text-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/20 dark:text-yellow-400";
                      }

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonSelect(lesson.id)}
                          className={`w-full text-left p-2.5 border transition-all text-[11px] flex justify-between items-center rounded-none ${isSelected
                              ? "border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-950 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                              : "border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-950 dark:border-slate-800"
                            }`}
                        >
                          <div className="flex flex-col gap-0.5 max-w-[70%]">
                            <span className="font-medium text-xs line-clamp-1">{lesson.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              Bài {lesson.order} · {hasVideo ? "VIDEO" : "TEXT"}
                            </span>
                          </div>

                          <span className={`px-1.5 py-0.5 border text-[9px] font-bold leading-none uppercase ${statusBg}`}>
                            {lesson.progressStatus === "completed"
                              ? "COMPLETED"
                              : lesson.progressStatus === "learning"
                                ? "LEARNING"
                                : "NOT STARTED"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILED LESSON PLAYER & QUIZ ENGINE (2 COLS) */}
        <div className="space-y-4 lg:col-span-2">
          {selectedLessonId && selectedLesson ? (
            isTakingQuiz ? (
              /* Quiz Engine View */
              <QuizEngine
                courseId={selectedCourseId!}
                lessonId={selectedLessonId}
                lessonTitle={selectedLesson.title}
                onClose={() => setIsTakingQuiz(false)}
              />
            ) : (
              /* Standard Lesson Player */
              <LessonPlayer
                courseId={selectedCourseId!}
                lesson={selectedLesson}
                onTakeQuiz={() => setIsTakingQuiz(true)}
              />
            )
          ) : (
            /* Empty State Workspace Placeholder */
            <Card className="border border-slate-300 dark:border-slate-800 border-dashed rounded-none bg-slate-50/10 p-16 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-4xl">🎓</span>
              <div className="font-bold text-sm text-slate-600 dark:text-slate-300">Không gian học tập trống</div>
              <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                Vui lòng chọn một khóa học ở danh mục bên trái, sau đó click vào bài học để tải video bài giảng Cloudinary và theo dõi tiến độ của bạn.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
