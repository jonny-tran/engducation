"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { LessonPlayer } from "./lesson-player";
import { QuizEngine } from "./quiz-engine";
import { WritingWorkspace } from "./writing-workspace";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Button } from "@engducation/ui/components/button";
import { Badge } from "@engducation/ui/components/badge";
import { Progress } from "@engducation/ui/components/progress";
import {
  ChevronDown,
  PlayCircle,
  BookOpen,
  CheckSquare,
  PenTool,
} from "lucide-react";

interface StudentDashboardViewProps {
  initialCourseId?: string | null;
  initialContentId?: string | null;
  initialContentType?: "lesson" | "quiz" | "writing" | null;
}

export function StudentDashboardView({
  initialCourseId = null,
  initialContentId = null,
  initialContentType = null,
}: StudentDashboardViewProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(initialCourseId);
  const [activeContentId, setActiveContentId] = useState<string | null>(initialContentId);
  const [activeContentType, setActiveContentType] = useState<"lesson" | "quiz" | "writing" | null>(initialContentType);
  const [openModuleIds, setOpenModuleIds] = useState<string[]>([]);

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

  // Active Content helper
  const activeContent = courseDetail?.modules
    ?.flatMap((m) => m.contents)
    .find((c) => c.id === activeContentId && c.type === activeContentType);

  // Auto-open first module and select first item when course loads, or load the requested query item
  useEffect(() => {
    if (courseDetail?.modules && courseDetail.modules.length > 0) {
      if (initialContentId && initialContentType) {
        // Find the module containing this content
        const parentModule = courseDetail.modules.find((m) =>
          m.contents?.some((c) => c.id === initialContentId && c.type === initialContentType)
        );
        if (parentModule) {
          setOpenModuleIds([parentModule.id]);
          setActiveContentId(initialContentId);
          setActiveContentType(initialContentType);
          return;
        }
      }

      setOpenModuleIds([courseDetail.modules[0].id]);
      const firstContent = courseDetail.modules[0].contents?.[0];
      if (firstContent) {
        setActiveContentId(firstContent.id);
        setActiveContentType(firstContent.type);
      } else {
        setActiveContentId(null);
        setActiveContentType(null);
      }
    } else {
      setOpenModuleIds([]);
      setActiveContentId(null);
      setActiveContentType(null);
    }
  }, [courseDetail?.id, initialContentId, initialContentType]);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setActiveContentId(null);
    setActiveContentType(null);
  };

  const handleContentSelect = (contentId: string, contentType: "lesson" | "quiz" | "writing") => {
    setActiveContentId(contentId);
    setActiveContentType(contentType);
  };

  const toggleModule = (moduleId: string) => {
    setOpenModuleIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full p-1 space-y-4 text-xs text-slate-800 dark:text-slate-100">
      {/* HEADER BANNER */}
      <div className="p-4 border border-border rounded-md bg-muted/40 text-foreground shadow-sm">
        <h1 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <span>🎓</span> Không gian Học tập Module Đồng cấp (Coursera Model)
        </h1>
        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
          Trải nghiệm học tập thế hệ mới: Đề cương phân chia theo Module tuần học, đa dạng các loại hình nội dung (Video, Bài đọc, Bài trắc nghiệm, và Chấm bài viết luận bằng AI).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* LEFT COLUMN: COURSE DIRECTORY & SYLLABUS LIST (1 COL) */}
        <div className="space-y-4 lg:col-span-1">
          {/* Courses List */}
          <Card className="border border-border rounded-md shadow-sm">
            <CardHeader className="py-2.5 border-b border-border bg-muted/20">
              <CardTitle className="text-xs font-bold uppercase tracking-wider">
                Khóa học đã xuất bản ({coursesData?.items.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-1 space-y-1">
              {isCoursesLoading ? (
                <p className="p-3 text-[11px] italic text-slate-500 animate-pulse">Đang tải danh mục khóa học...</p>
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
                      className={`w-full text-left p-2.5 border transition-all text-xs flex flex-col gap-1 rounded-md ${
                        isSelected
                          ? "border-primary bg-accent text-accent-foreground font-bold shadow-sm"
                          : "border-border hover:bg-accent/50 hover:text-accent-foreground bg-card text-card-foreground"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold line-clamp-1">{course.title}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono font-bold leading-none">
                          {course.level}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                        <span>Tiến trình: {course.completedLessons}/{course.totalLessons} nội dung ({percentComplete}%)</span>
                      </div>
                      <Progress value={percentComplete} className="w-full mt-1.5" />
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Syllabus (Hierarchical Modules of Selected Course) */}
          {selectedCourseId && (
            <Card className="border border-border rounded-md shadow-sm">
              <CardHeader className="py-2.5 border-b border-border bg-muted/20">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Đề cương học tập</span>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCourseId(null)}
                    className="h-4 p-0 text-[10px] hover:bg-transparent font-bold underline text-primary"
                  >
                    BỎ CHỌN
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {isDetailLoading ? (
                  <p className="p-3 text-[11px] italic text-slate-500 animate-pulse">Đang tải danh sách tuần học...</p>
                ) : !courseDetail?.modules || courseDetail.modules.length === 0 ? (
                  <p className="p-3 text-[11px] italic text-slate-500">Khóa học này chưa có module tuần học nào.</p>
                ) : (
                  <div className="space-y-2.5">
                    {courseDetail.modules.map((mod, modIdx) => {
                      const isOpen = openModuleIds.includes(mod.id);
                      const completedCount = mod.contents.filter((c) => c.progressStatus === "completed").length;
                      const totalCount = mod.contents.length;
                      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                      return (
                        <div key={mod.id} className="border border-border rounded-lg overflow-hidden bg-card shadow-sm transition-all duration-200">
                          {/* ACCORDION HEADER TRIGGER */}
                          <button
                            onClick={() => toggleModule(mod.id)}
                            className="w-full text-left p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors bg-muted/10 border-b border-transparent"
                          >
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                                  Week {modIdx + 1}
                                </span>
                                {progressPercent === 100 && totalCount > 0 && (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 text-[8px] font-bold leading-none py-0.5 border border-emerald-500/20">
                                    XONG ✓
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-xs font-bold text-foreground leading-snug truncate">{mod.title}</h3>
                              <div className="text-[9px] text-muted-foreground font-mono flex items-center gap-1.5">
                                <span>{completedCount}/{totalCount} hoàn thành</span>
                                <span>·</span>
                                <span>{progressPercent}%</span>
                              </div>
                            </div>
                            <div 
                              className="text-muted-foreground shrink-0 transition-transform duration-200" 
                              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </div>
                          </button>

                          {/* ACCORDION CONTENT PANEL */}
                          {isOpen && (
                            <div className="p-1 border-t border-border bg-card/50 space-y-1">
                              {totalCount === 0 ? (
                                <p className="p-3 text-[10px] italic text-muted-foreground text-center">
                                  Chưa có nội dung bài giảng.
                                </p>
                              ) : (
                                mod.contents.map((item) => {
                                  const isSelected = activeContentId === item.id && activeContentType === item.type;
                                  
                                  let IconComponent = BookOpen;
                                  let iconColor = "text-blue-500 bg-blue-500/10 dark:bg-blue-500/20";
                                  let typeLabel = "Bài đọc";
                                  
                                  if (item.type === "lesson") {
                                    const hasVideo = item.videoPublicId || item.videoUrl;
                                    IconComponent = hasVideo ? PlayCircle : BookOpen;
                                    iconColor = "text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20";
                                    typeLabel = hasVideo ? "Bài giảng Video" : "Bài đọc";
                                  } else if (item.type === "quiz") {
                                    IconComponent = CheckSquare;
                                    iconColor = "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20";
                                    typeLabel = "Trắc nghiệm";
                                  } else if (item.type === "writing") {
                                    IconComponent = PenTool;
                                    iconColor = "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20";
                                    typeLabel = "Viết luận AI";
                                  }

                                  return (
                                    <button
                                      key={item.id}
                                      onClick={() => handleContentSelect(item.id, item.type)}
                                      className={`w-full text-left p-2 border transition-all text-[11px] flex justify-between items-center rounded-md ${
                                        isSelected
                                          ? "border-primary bg-accent text-accent-foreground font-bold shadow-sm"
                                          : "border-border hover:bg-accent/50 hover:text-accent-foreground bg-card text-card-foreground"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 max-w-[70%] min-w-0">
                                        <div className={`p-1 rounded ${iconColor} shrink-0`}>
                                          <IconComponent className="h-3 w-3" />
                                        </div>
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                          <span className="font-medium text-[11px] truncate text-foreground leading-tight">
                                            {item.title}
                                          </span>
                                          <span className="text-[8px] text-muted-foreground uppercase font-mono tracking-wider">
                                            {typeLabel}
                                          </span>
                                        </div>
                                      </div>

                                      {item.progressStatus === "completed" ? (
                                        <Badge className="text-[8px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase shrink-0 py-0 px-1">
                                          ĐÃ XONG
                                        </Badge>
                                      ) : item.progressStatus === "learning" ? (
                                        <Badge className="text-[8px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase shrink-0 py-0 px-1">
                                          ĐANG HỌC
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-[8px] font-bold text-muted-foreground opacity-60 shrink-0 py-0 px-1">
                                          CHƯA HỌC
                                        </Badge>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILED LESSON PLAYER, QUIZ ENGINE, OR WRITING WORKSPACE (2 COLS) */}
        <div className="space-y-4 lg:col-span-2">
          {activeContentId && activeContent ? (
            activeContentType === "lesson" ? (
              <LessonPlayer
                courseId={selectedCourseId!}
                lesson={{
                  id: activeContent.id,
                  title: activeContent.title,
                  description: (activeContent as any).description ?? null,
                  videoPublicId: (activeContent as any).videoPublicId ?? null,
                  videoUrl: (activeContent as any).videoUrl ?? null,
                  progressStatus: activeContent.progressStatus,
                  hasQuiz: false,
                }}
                onTakeQuiz={() => {}}
              />
            ) : activeContentType === "quiz" ? (
              <QuizEngine
                courseId={selectedCourseId!}
                quizId={activeContent.id}
                quizTitle={activeContent.title}
                onClose={() => {
                  setActiveContentId(null);
                  setActiveContentType(null);
                }}
              />
            ) : activeContentType === "writing" ? (
              <WritingWorkspace
                writingId={activeContent.id}
                courseId={selectedCourseId!}
                onComplete={() => {}}
              />
            ) : null
          ) : (
            /* Empty State Workspace Placeholder */
            <Card className="border border-dashed border-border rounded-md bg-muted/10 p-16 flex flex-col items-center justify-center text-center space-y-3 shadow-inner">
              <span className="text-4xl animate-bounce">🎓</span>
              <div className="font-bold text-sm text-foreground">Không gian học tập đang chờ bạn</div>
              <p className="text-[11px] text-muted-foreground max-w-sm leading-relaxed">
                Vui lòng chọn một khóa học ở danh mục bên trái, sau đó click vào nội dung học tập bất kỳ trong Đề cương (Bài giảng, Bài tập trắc nghiệm, hoặc Bài viết luận thông minh AI) để bắt đầu học.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
