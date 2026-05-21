"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { StudentHeader } from "@/components/layout/student-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@engducation/ui/components/card";
import { Button } from "@engducation/ui/components/button";
import { Badge } from "@engducation/ui/components/badge";
import { Progress } from "@engducation/ui/components/progress";
import { Input } from "@engducation/ui/components/input";
import { Skeleton } from "@engducation/ui/components/skeleton";
import { 
  BookOpen, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Play, 
  Filter,
  CheckCircle,
  GraduationCap
} from "lucide-react";
import Link from "next/link";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
type CefrLevel = typeof CEFR_LEVELS[number];

export default function CoursesPage() {
  const router = useRouter();
  
  // 1. Session checking for page protection
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  
  // Page states
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  const pageSize = 8; // Compact grid layout

  // 2. Fetch published course directory with staleTime: 5000
  const { data: coursesData, isLoading: isCoursesLoading } = useQuery(
    trpc.user.courseList.queryOptions(
      {
        page: currentPage,
        pageSize,
        level: selectedLevel === "ALL" ? undefined : selectedLevel,
      },
      {
        staleTime: 5000, // Optimize cache control when switching pages
        enabled: !!session, // Only execute query if authenticated
      }
    )
  );

  // If session is checking, render high-fidelity skeleton
  if (isSessionPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col w-full">
        <div className="h-16 border-b bg-muted/20 animate-pulse" />
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Redirect unauthenticated user to login
  if (!session) {
    router.push("/login");
    return null;
  }

  const items = coursesData?.items ?? [];
  const pagination = coursesData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  // Client-side filtering & business rules (Rule: status === "published" only)
  const publishedItems = items.filter(
    (course) => 
      course.status === "published" && 
      (searchQuery === "" || course.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Map CEFR levels to premium visual themes
  const getCefrBadgeStyle = (level: CefrLevel) => {
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

  const handleLevelChange = (level: CefrLevel | "ALL") => {
    setSelectedLevel(level);
    setCurrentPage(1); // Reset page on filter change
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Shared Premium Header */}
      <StudentHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Page Banner Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black uppercase tracking-wider text-foreground">
              Danh Mục Khóa Học Công Khai
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Tìm kiếm và lựa chọn khóa học phù hợp nhất với cấp độ ngôn ngữ của bạn.
            </p>
          </div>
          
          <Badge variant="outline" className="w-fit border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase py-0.5 px-2.5 rounded-full tracking-wider">
            {publishedItems.length} Khóa học khả dụng
          </Badge>
        </div>

        {/* Interactive Filtering and Searching Controls */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Search Box */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm tên khóa học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-border bg-card shadow-sm"
              id="course-search-input"
            />
          </div>

          {/* CEFR Level filter pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1.5 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Cấp độ:
            </span>
            <Button
              variant={selectedLevel === "ALL" ? "default" : "outline"}
              onClick={() => handleLevelChange("ALL")}
              className="h-7 text-[10px] font-bold px-3 rounded-full"
            >
              TẤT CẢ
            </Button>
            {CEFR_LEVELS.map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? "default" : "outline"}
                onClick={() => handleLevelChange(level)}
                className="h-7 text-[10px] font-black px-3 rounded-full"
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        {/* Courses Cards Grid */}
        {isCoursesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="h-64 rounded-2xl flex flex-col justify-between border p-4 bg-card">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : publishedItems.length === 0 ? (
          <div className="p-16 border border-dashed border-border rounded-3xl bg-muted/10 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-4xl">🔍</span>
            <div className="font-bold text-sm text-foreground">Không tìm thấy khóa học phù hợp</div>
            <p className="text-[11px] text-muted-foreground max-w-sm leading-relaxed">
              Thử thay đổi bộ lọc cấp độ CEFR hoặc từ khóa tìm kiếm để khám phá thêm nhiều bài giảng hấp dẫn khác.
            </p>
            <Button variant="outline" onClick={() => { setSelectedLevel("ALL"); setSearchQuery(""); }} className="text-xs font-bold mt-2">
              Khôi phục bộ lọc
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {publishedItems.map((course) => {
              const percent = course.totalLessons > 0 
                ? Math.round((course.completedLessons / course.totalLessons) * 100)
                : 0;
              const isCompleted = course.totalLessons > 0 && course.completedLessons === course.totalLessons;

              return (
                <Card 
                  key={course.id} 
                  className="border border-border/80 bg-card rounded-2xl hover:shadow-xl hover:scale-[1.02] hover:border-indigo-500/20 dark:hover:border-indigo-500/10 flex flex-col justify-between overflow-hidden shadow-sm transition-all duration-300 group"
                  id={`course-card-${course.id}`}
                >
                  <CardHeader className="p-4 pb-2 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <Badge className={`font-mono font-black border text-[9px] px-2 py-0.5 rounded-full ${getCefrBadgeStyle(course.level)}`}>
                        {course.level}
                      </Badge>
                      {isCompleted && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black rounded-full flex items-center gap-0.5">
                          <CheckCircle className="h-2.5 w-2.5 fill-emerald-500/10" /> ĐÃ XONG
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <Link href={`/courses/${course.id}` as any}>
                        <CardTitle className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors cursor-pointer line-clamp-1">
                          {course.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="text-[10px] font-medium text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {course.description ?? "Khóa học này chưa được cung cấp thông tin chi tiết."}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 py-2 space-y-3">
                    {/* Linear lesson completion progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                        <span>Bài học: {course.completedLessons}/{course.totalLessons}</span>
                        <span>{percent}%</span>
                      </div>
                      <Progress value={percent} className="h-1.5" />
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-2 border-t border-border/50 bg-muted/10 flex items-center justify-between">
                    <div className="text-[9px] text-muted-foreground font-mono">
                      Khóa: {course.id.slice(0, 8)}
                    </div>
                    
                    <Link href={`/courses/${course.id}` as any}>
                      <Button size="sm" className="h-7 text-[10px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center gap-1">
                        Chi tiết
                        <Play className="h-2.5 w-2.5 fill-current" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 pt-6 border-t border-border/50">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-[10px] font-bold text-muted-foreground font-mono">
              Trang {currentPage} / {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
