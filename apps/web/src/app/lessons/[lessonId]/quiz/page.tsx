"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { StudentHeader } from "@/components/layout/student-header";
import { QuizEngine } from "@/features/learning-content";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Button } from "@engducation/ui/components/button";
import { Skeleton } from "@engducation/ui/components/skeleton";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ lessonId: string }>;
}

export default function LessonQuizPage({ params }: PageProps) {
  const router = useRouter();
  const { lessonId } = React.use(params);

  // 1. Check user session for route protection
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  // 2. Fetch the safe lesson detail (which includes the quiz indicator)
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

  // Loading skeleton state
  if (isSessionPending || isLessonLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col w-full">
        <div className="h-16 border-b bg-muted/20 animate-pulse" />
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-96 rounded-2xl" />
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
          <h1 className="text-xl font-bold uppercase tracking-wider text-destructive">Không tìm thấy bài giảng</h1>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            Thông tin bài giảng không tồn tại hoặc bạn không có quyền thực hiện bài kiểm tra này.
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

  // Verify that the lesson actually contains a quiz or hasQuiz
  if (!lessonDetail.quiz) {
    return (
      <div className="min-h-screen bg-background flex flex-col w-full">
        <StudentHeader />
        <main className="flex-1 max-w-2xl mx-auto flex flex-col items-center justify-center p-6 text-center space-y-4">
          <span className="text-5xl">📝</span>
          <h1 className="text-xl font-bold uppercase tracking-wider text-muted-foreground">Bài học không có Quiz</h1>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            Bài giảng "{lessonDetail.title}" này không đi kèm bài tập trắc nghiệm củng cố.
          </p>
          <Link href={`/lessons/${lessonId}` as any}>
            <Button variant="default" className="text-xs font-bold px-5">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Quay lại bài học
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Top Header */}
      <StudentHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
        
        {/* Navigation Breadcrumb back to Lesson Player */}
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Link href={`/lessons/${lessonId}` as any}>
            <span className="hover:text-foreground cursor-pointer transition-colors flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại bài học: {lessonDetail.title}
            </span>
          </Link>
        </div>

        {/* Premium Title Section */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-4 border border-indigo-500/20 rounded-2xl">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white shrink-0">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-wider text-foreground">Bài tập củng cố kiến thức</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
              Tránh tải lại trang hoặc thoát trong quá trình làm bài. Điểm số sẽ được chấm trực tiếp trên hệ thống.
            </p>
          </div>
        </div>

        {/* Quiz Engine Component Wrapper */}
        <div className="w-full">
          <QuizEngine
            courseId={lessonDetail.courseId}
            lessonId={lessonId}
            lessonTitle={lessonDetail.title}
            onClose={() => router.push(`/lessons/${lessonId}` as any)}
          />
        </div>

      </main>
    </div>
  );
}
