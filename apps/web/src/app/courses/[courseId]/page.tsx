"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { StudentHeader } from "@/components/layout/student-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@engducation/ui/components/card";
import { Button } from "@engducation/ui/components/button";
import { Badge } from "@engducation/ui/components/badge";
import { Progress } from "@engducation/ui/components/progress";
import { Skeleton } from "@engducation/ui/components/skeleton";
import { 
  ArrowLeft, 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Lock, 
  Award, 
  Clock, 
  Bookmark,
  Calendar,
  Sparkles,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default function CourseDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { courseId } = React.use(params);
  
  // 1. Session checking for page protection
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  // 2. Fetch course detailed syllabus
  const { 
    data: courseDetail, 
    isLoading: isDetailLoading,
    error: detailError
  } = useQuery(
    trpc.user.courseGetDetail.queryOptions(
      { courseId },
      { enabled: !!session } // Only fetch when logged in
    )
  );

  // Loading skeleton state
  if (isSessionPending || isDetailLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col w-full">
        <div className="h-16 border-b bg-muted/20 animate-pulse" />
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Redirect unauthenticated user
  if (!session) {
    router.push("/login");
    return null;
  }

  // Error boundary page
  if (detailError || !courseDetail) {
    return (
      <div className="min-h-screen bg-background flex flex-col w-full">
        <StudentHeader />
        <main className="flex-1 max-w-2xl mx-auto flex flex-col items-center justify-center p-6 text-center space-y-4">
          <span className="text-5xl">⚠️</span>
          <h1 className="text-xl font-bold uppercase tracking-wider text-destructive">Không tìm thấy khóa học</h1>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            Khóa học này không tồn tại, chưa được xuất bản hoặc bạn không có quyền truy cập. Vui lòng liên hệ quản trị viên.
          </p>
          <Link href="/courses">
            <Button variant="default" className="text-xs font-bold px-5">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Quay lại danh mục
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const allContents = React.useMemo(() => {
    return (courseDetail.modules ?? []).flatMap((m) => m.contents ?? []);
  }, [courseDetail]);

  const completedCount = React.useMemo(() => {
    return allContents.filter((c) => c.progressStatus === "completed").length;
  }, [allContents]);

  const totalCount = allContents.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Map CEFR levels to premium visual themes
  const getCefrBadgeStyle = (level: typeof courseDetail.level) => {
    switch (level) {
      case "A1":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "A2":
        return "border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400";
      case "B1":
        return "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
      case "B2":
        return "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "C1":
        return "border-pink-500/20 bg-pink-500/10 text-pink-600 dark:text-pink-400";
      case "C2":
        return "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400";
      default:
        return "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Premium Header */}
      <StudentHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        
        {/* Back Link */}
        <Link href="/courses">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại danh mục khóa học
          </span>
        </Link>

        {/* Hero Course Header Card */}
        <Card className="border border-border/80 bg-card overflow-hidden rounded-3xl relative shadow-md">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <CardContent className="p-6 sm:p-8 space-y-6 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`font-mono font-black border text-[9px] px-2.5 py-0.5 rounded-full ${getCefrBadgeStyle(courseDetail.level)}`}>
                    CẤP ĐỘ {courseDetail.level}
                  </Badge>
                  <Badge variant="outline" className="border-border text-[9px] font-bold uppercase rounded-full bg-muted/20">
                    {totalCount} Bài học
                  </Badge>
                </div>
                
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-foreground">
                  {courseDetail.title}
                </h1>
              </div>

              <div className="shrink-0 flex items-center gap-1 bg-muted/30 border p-2 rounded-2xl text-[10px] font-bold text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>Ngày tạo: {new Date(courseDetail.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              {courseDetail.description ?? "Chưa có mô tả chi tiết từ giảng viên."}
            </p>

            {/* Overall course completion stats */}
            <div className="pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>Tiến độ khóa học của bạn</span>
                  <span>{percentComplete}%</span>
                </div>
                <Progress value={percentComplete} className="h-2" />
              </div>

              <div className="flex justify-end gap-2 text-xs font-bold text-foreground md:pl-6">
                <div className="flex items-center gap-1.5 px-3.5 py-2 border rounded-2xl bg-muted/10">
                  <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Đã xong: {completedCount} / {totalCount} bài học</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Syllabus / Tree linear outline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-base font-black tracking-wide text-foreground uppercase flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              Đề Cương Chi Tiết Bài Học
            </h2>
            
            <Badge variant="outline" className="border-border text-[9px] font-bold uppercase rounded-full bg-muted/20">
              Học tuyến tính theo thứ tự
            </Badge>
          </div>

          {(courseDetail.modules ?? []).length === 0 ? (
            <Card className="p-16 border border-dashed border-border rounded-3xl bg-muted/10 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-3xl">📭</span>
              <div className="font-bold text-xs text-foreground">Chưa có đề cương bài giảng</div>
              <p className="text-[10px] text-muted-foreground max-w-sm leading-relaxed">
                Khóa học này đang được biên soạn đề chương giảng dạy. Hãy quay lại sau để học các kiến thức tuyệt vời nhé.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {(courseDetail.modules ?? []).map((mod, modIdx) => (
                <div key={mod.id} className="space-y-3">
                  <div className="flex flex-col gap-1 border-l-2 border-indigo-500 pl-3">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                      Module {modIdx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                      {mod.title}
                    </h3>
                    {mod.description && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {mod.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pl-3">
                    {(mod.contents ?? []).length === 0 ? (
                      <p className="text-[10px] italic text-muted-foreground py-2">
                        Chưa có nội dung học tập nào trong module này.
                      </p>
                    ) : (
                      (mod.contents ?? []).map((item, itemIdx) => {
                        const isCompleted = item.progressStatus === "completed";
                        const isLearning = item.progressStatus === "learning";
                        
                        let IconComponent = BookOpen;
                        let typeText = "BÀI GIẢNG";
                        let typeBadgeClass = "border-sky-500/20 text-sky-600 dark:text-sky-400 bg-sky-500/5";
                        
                        if (item.type === "quiz") {
                          IconComponent = CheckCircle2;
                          typeText = "TRẮC NGHIỆM";
                          typeBadgeClass = "border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5";
                        } else if (item.type === "writing") {
                          IconComponent = Sparkles;
                          typeText = "VIẾT LUẬN";
                          typeBadgeClass = "border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/5";
                        }

                        // Color-code the status checks
                        let statusBadge = (
                          <Badge variant="outline" className="text-[9px] font-black uppercase text-slate-400 bg-slate-500/5 border-slate-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> CHƯA HỌC
                          </Badge>
                        );
                        
                        if (isCompleted) {
                          statusBadge = (
                            <Badge className="text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-emerald-500/5">
                              <CheckCircle2 className="h-2.5 w-2.5 fill-emerald-500/10" /> ĐÃ XONG
                            </Badge>
                          );
                        } else if (isLearning) {
                          statusBadge = (
                            <Badge className="text-[9px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-sm shadow-amber-500/5">
                              <Play className="h-2.5 w-2.5 fill-current" /> ĐANG HỌC
                            </Badge>
                          );
                        }

                        return (
                          <Card 
                            key={item.id} 
                            className={`border transition-all duration-300 rounded-2xl shadow-sm ${
                              isCompleted 
                                ? 'border-emerald-500/10 bg-emerald-500/[0.01]' 
                                : isLearning
                                  ? 'border-indigo-500/25 bg-indigo-500/[0.01]'
                                  : 'border-border/60 hover:border-border hover:bg-muted/10'
                            }`}
                          >
                            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-start gap-3.5 max-w-full sm:max-w-[70%]">
                                <div className={`h-8 w-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 border select-none ${
                                  isCompleted
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : isLearning
                                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                                      : 'bg-muted border-border text-muted-foreground'
                                }`}>
                                  {item.order}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-xs text-foreground line-clamp-1">
                                      {item.title}
                                    </span>
                                    <Badge variant="outline" className={`text-[8px] font-bold px-1.5 py-0 h-4 border uppercase font-mono ${typeBadgeClass}`}>
                                      {typeText}
                                    </Badge>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                                    {item.type === "lesson"
                                      ? (item.description ?? "Bài học đọc hoặc video lý thuyết.")
                                      : item.type === "writing"
                                      ? (item.prompt ?? "Bài tập viết luận củng cố kỹ năng.")
                                      : "Bài tập trắc nghiệm củng cố từ vựng và kiến thức ngữ pháp."}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                                {statusBadge}
                                
                                <Link href={`/courses/${courseId}/learn?contentId=${item.id}&type=${item.type}` as any}>
                                  <Button 
                                    size="sm" 
                                    variant={isCompleted ? "outline" : "default"}
                                    className="h-7 text-[10px] font-bold rounded-xl flex items-center gap-1 shadow-sm px-3.5"
                                  >
                                    Học ngay
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
