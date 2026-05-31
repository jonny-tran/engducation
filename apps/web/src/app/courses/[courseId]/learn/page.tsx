"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { StudentHeader } from "@/components/layout/student-header";
import { StudentDashboardView } from "@/features/learning-content/components/student/student-dashboard-view";
import { Skeleton } from "@engducation/ui/components/skeleton";

interface PageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ contentId?: string; type?: "lesson" | "quiz" | "writing" }>;
}

export default function CourseLearnPage({ params, searchParams }: PageProps) {
  const router = useRouter();
  const { courseId } = React.use(params);
  const { contentId, type } = React.use(searchParams);

  // 1. Session checking for route protection
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  // Loading skeleton state
  if (isSessionPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col w-full">
        <div className="h-16 border-b bg-muted/20 animate-pulse" />
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-96 rounded-2xl" />
            </div>
            <div className="lg:col-span-2">
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

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Shared Premium Top Navbar */}
      <StudentHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentDashboardView
          initialCourseId={courseId}
          initialContentId={contentId ?? null}
          initialContentType={type ?? null}
        />
      </main>
    </div>
  );
}
