"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { StudentHeader } from "@/components/layout/student-header";
import { LessonPlayer } from "@/features/learning-content";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Button } from "@engducation/ui/components/button";
import { Badge } from "@engducation/ui/components/badge";
import { Skeleton } from "@engducation/ui/components/skeleton";
import { 
  ArrowLeft, 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Lock, 
  ChevronRight,
  ListOrdered
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ lessonId: string }>;
}

export default function LessonPage({ params }: PageProps) {
  const router = useRouter();
  const { lessonId } = React.use(params);

  // 1. Session checking for route protection
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  // 2. Query detailed static lesson + quiz outline (safe quiz payload)
  const { 
    data: lessonDetail, 
    isLoading: isLessonLoading,
    error: lessonError
  } = useQuery(
    trpc.user.lessonGetDetail.queryOptions(
      { lessonId },
      { enabled: !!session }
    )
  );

  // 3. Query the parent course syllabus details to extract linear progress markers
  const { 
    data: courseDetail, 
    isLoading: isCourseLoading 
  } = useQuery(
    trpc.user.courseGetDetail.queryOptions(
      { courseId: lessonDetail?.courseId ?? "" },
      { enabled: !!lessonDetail?.courseId }
    )
  );

  // Combine static lesson info with dynamic progressStatus and hasQuiz
  const enrichedLesson = React.useMemo(() => {
    if (!lessonDetail || !courseDetail) return null;
    
    const courseLesson = courseDetail.lessons.find((l) => l.id === lessonId);
    
    return {
      id: lessonDetail.id,
      title: lessonDetail.title,
      description: lessonDetail.description,
      videoPublicId: lessonDetail.videoPublicId,
      videoUrl: lessonDetail.videoUrl,
      progressStatus: courseLesson?.progressStatus ?? null,
      hasQuiz: !!lessonDetail.quiz,
    };
  }, [lessonDetail, courseDetail, lessonId]);

  // Loading skeleton state
  if (isSessionPending || isLessonLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col w-full">
        <div className="h-16 border-b bg-muted/20 animate-pulse" />
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 rounded-2xl" />
            </div>
            <div>
              <Skeleton className="h-96 rounded-2xl" />
            </div>
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
  if (lessonError || !lessonDetail) {
    return (
      <div className="min-h-screen bg-background flex flex-col w-full">
        <StudentHeader />
        <main className="flex-1 max-w-2xl mx-auto flex flex-col items-center justify-center p-6 text-center space-y-4">
          <span className="text-5xl">⚠️</span>
          <h1 className="text-xl font-bold uppercase tracking-wider text-destructive">Bài học không tồn tại</h1>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            Nội dung bài giảng này không tồn tại, chưa được xuất bản hoặc bạn chưa được cấp quyền truy cập học tập.
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

  const otherLessons = courseDetail?.lessons ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Premium custom top navbar */}
      <StudentHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
        
        {/* Navigation Breadcrumb back to Course Syllabus */}
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Link href={`/courses/${lessonDetail.courseId}` as any}>
            <span className="hover:text-foreground cursor-pointer transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Chi tiết đề cương: {lessonDetail.course?.title ?? "Khóa học"}
            </span>
          </Link>
        </div>

        {/* Master-Detail Split Screen Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT 2/3 COLUMN: Secure Video Player Container & Details */}
          <div className="lg:col-span-2 space-y-4">
            {enrichedLesson ? (
              <LessonPlayer
                courseId={lessonDetail.courseId}
                lesson={enrichedLesson}
                onTakeQuiz={() => router.push(`/lessons/${lessonId}/quiz` as any)}
              />
            ) : (
              <Card className="p-16 border border-dashed border-border rounded-md bg-muted/10 animate-pulse flex items-center justify-center">
                <span className="text-xs text-slate-500 italic">Đang đồng bộ hóa trạng thái tiến trình...</span>
              </Card>
            )}
          </div>

          {/* RIGHT 1/3 COLUMN: Linear Syllabus Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
              <CardHeader className="py-3 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-indigo-500" />
                  Đề Cương Bài Giảng
                </CardTitle>
                
                <Badge variant="outline" className="text-[9px] font-bold uppercase rounded-full">
                  {otherLessons.length} BÀI
                </Badge>
              </CardHeader>
              
              <CardContent className="p-2 space-y-1 max-h-[480px] overflow-y-auto">
                {isCourseLoading ? (
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-8 w-full rounded-md" />
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                ) : otherLessons.length === 0 ? (
                  <p className="p-3 text-[10px] italic text-muted-foreground">Không có bài học nào khác.</p>
                ) : (
                  otherLessons.map((les) => {
                    const isCurrent = les.id === lessonId;
                    const hasVideo = les.videoUrl || les.videoPublicId;
                    const isCompleted = les.progressStatus === "completed";
                    const isLearning = les.progressStatus === "learning";
                    
                    // Render specific micro indicators
                    let indicator = <Lock className="h-3 w-3 text-slate-400" />;
                    if (isCompleted) {
                      indicator = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />;
                    } else if (isLearning) {
                      indicator = <Play className="h-3 w-3 text-amber-500 fill-current animate-pulse" />;
                    }

                    return (
                      <Link href={`/lessons/${les.id}` as any} key={les.id}>
                        <div 
                          className={`w-full text-left p-2.5 border transition-all text-[11px] flex justify-between items-center rounded-xl cursor-pointer ${
                            isCurrent
                              ? "border-primary bg-indigo-500/5 text-primary font-bold shadow-inner"
                              : "border-transparent hover:bg-accent/50 hover:text-accent-foreground text-card-foreground bg-card"
                          }`}
                        >
                          <div className="flex items-center gap-2 max-w-[75%]">
                            <span className={`h-5 w-5 font-mono font-bold text-[9px] border rounded-md flex items-center justify-center shrink-0 ${
                              isCurrent 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20' 
                                : 'bg-muted border-border text-muted-foreground'
                            }`}>
                              {les.order}
                            </span>
                            
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="font-bold text-xs line-clamp-1 text-foreground leading-snug">{les.title}</span>
                              <span className="text-[8px] text-muted-foreground uppercase font-mono font-bold">
                                {hasVideo ? "VIDEO" : "TÀI LIỆU"}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 pl-2">
                            {indicator}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
