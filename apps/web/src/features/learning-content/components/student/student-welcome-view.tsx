"use client";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Card, CardContent } from "@engducation/ui/components/card";
import { Button } from "@engducation/ui/components/button";
import { Badge } from "@engducation/ui/components/badge";
import { Progress } from "@engducation/ui/components/progress";
import { 
  BookOpen, 
  Trophy, 
  ArrowRight, 
  Award, 
  Flame
} from "lucide-react";
import Link from "next/link";

interface StudentWelcomeViewProps {
  userName: string;
}

export function StudentWelcomeView({ userName }: StudentWelcomeViewProps) {
  // Query all published courses to calculate statistics
  const { data: coursesData, isLoading } = useQuery(
    trpc.user.courseList.queryOptions({
      page: 1,
      pageSize: 100,
    })
  );

  const courses = coursesData?.items ?? [];
  
  // Calculate quick stats
  const totalCourses = courses.length;
  const inProgressCourses = courses.filter(c => c.completedLessons > 0 && c.completedLessons < c.totalLessons).length;
  const completedCourses = courses.filter(c => c.totalLessons > 0 && c.completedLessons === c.totalLessons).length;
  const totalCompletedLessons = courses.reduce((acc, c) => acc + c.completedLessons, 0);

  // Hardcode CEFR information for premium interactive roadmaps
  const cefrRoadmap = [
    { level: "A1", name: "Sơ cấp (Beginner)", desc: "Giao tiếp cơ bản hàng ngày, giới thiệu bản thân.", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" },
    { level: "A2", name: "Sơ trung cấp (Elementary)", desc: "Hiểu câu giao tiếp thông dụng, hội thoại đơn giản.", color: "border-teal-500/20 bg-teal-500/5 text-teal-600 dark:text-teal-400" },
    { level: "B1", name: "Trung cấp (Intermediate)", desc: "Mô tả trải nghiệm, ước mơ, viết văn bản đơn giản.", color: "border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400" },
    { level: "B2", name: "Trung cao cấp (Upper Intermediate)", desc: "Thảo luận chuyên môn, giao tiếp trôi chảy tự nhiên.", color: "border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400" },
    { level: "C1", name: "Cao cấp (Advanced)", desc: "Hiểu văn bản dài, sâu sắc, sử dụng linh hoạt mọi văn cảnh.", color: "border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400" },
    { level: "C2", name: "Thành thạo (Proficient)", desc: "Dễ dàng hiểu hầu hết mọi thứ, diễn đạt cực kỳ tinh tế.", color: "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic Glassmorphism Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-border/50 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 backdrop-blur-xl shadow-xl shadow-indigo-500/5">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Student Workspace
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-none">
              Chào mừng bạn trở lại, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">{userName}</span>! 👋
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Hôm nay là một ngày tuyệt vời để tiếp thu thêm kiến thức mới. Cùng xem qua lộ trình học tập, phát triển kỹ năng ngoại ngữ của bạn và chinh phục các nấc thang CEFR nhé!
            </p>
          </div>
          
          <Link href="/courses">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 px-6 py-5 shrink-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              Đến Danh Mục Khóa Học
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid of Interactive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <Card className="border border-border bg-card/60 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:border-indigo-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Khóa học công khai</span>
              <div className="text-xl font-black font-mono text-foreground">
                {isLoading ? <span className="animate-pulse">...</span> : totalCourses}
              </div>
            </div>
            <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Stat 2 */}
        <Card className="border border-border bg-card/60 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:border-amber-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Đang chinh phục</span>
              <div className="text-xl font-black font-mono text-foreground">
                {isLoading ? <span className="animate-pulse">...</span> : inProgressCourses}
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Stat 3 */}
        <Card className="border border-border bg-card/60 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:border-emerald-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Đã hoàn thành</span>
              <div className="text-xl font-black font-mono text-foreground">
                {isLoading ? <span className="animate-pulse">...</span> : completedCourses}
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Trophy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Stat 4 */}
        <Card className="border border-border bg-card/60 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:border-purple-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bài học đã học</span>
              <div className="text-xl font-black font-mono text-foreground">
                {isLoading ? <span className="animate-pulse">...</span> : totalCompletedLessons}
              </div>
            </div>
            <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CEFR Learning Roadmap Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-lg font-black tracking-wide text-foreground uppercase">Bản Đồ Cấp Độ Học Tập CEFR</h2>
            <p className="text-[11px] text-muted-foreground font-medium">Khám phá các nấc thang ngôn ngữ tiêu chuẩn châu Âu để xây dựng lộ trình học thích hợp.</p>
          </div>
          <Badge variant="outline" className="w-fit border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px]">
            CEFR FRAMEWORK
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cefrRoadmap.map((item) => (
            <Card key={item.level} className="border border-border/80 bg-card/40 dark:bg-slate-900/20 backdrop-blur-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group overflow-hidden">
              <CardContent className="p-4 relative space-y-2">
                <div className="absolute right-3 top-3 text-4xl font-black opacity-[0.03] dark:opacity-[0.06] font-mono group-hover:scale-110 transition-transform duration-300">
                  {item.level}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono border ${item.color}`}>
                    {item.level}
                  </span>
                  <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                </div>
                
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                  {item.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Active learning courses if available, else standard intro */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black tracking-wide text-foreground uppercase">Tiến Độ Học Tập Hiện Tại</h2>
          <Link href="/courses">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer">
              Tất cả khóa học
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>

        {isLoading ? (
          <Card className="p-10 border border-dashed border-border flex items-center justify-center">
            <span className="text-xs text-slate-500 animate-pulse italic">Đang phân tích tiến độ học tập...</span>
          </Card>
        ) : courses.length === 0 ? (
          <Card className="p-10 border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2.5">
            <span className="text-3xl">🌱</span>
            <div className="font-bold text-xs text-foreground">Bạn chưa ghi danh khóa học nào</div>
            <p className="text-[10px] text-muted-foreground max-w-sm leading-relaxed">
              Hãy bấm vào nút xem danh mục khóa học phía trên để lựa chọn và bắt đầu hành trình cải thiện Tiếng Anh của bạn!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.slice(0, 4).map((course) => {
              const percent = course.totalLessons > 0 
                ? Math.round((course.completedLessons / course.totalLessons) * 100)
                : 0;
              return (
                <Card key={course.id} className="border border-border/80 bg-card hover:border-indigo-500/20 transition-all duration-300">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <Link href={`/courses/${course.id}` as any}>
                          <h3 className="font-bold text-xs text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1 cursor-pointer">
                            {course.title}
                          </h3>
                        </Link>
                        <p className="text-[10px] text-muted-foreground font-medium line-clamp-1">
                          {course.description ?? "Chưa có mô tả chi tiết."}
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono font-bold text-[9px] px-1 py-0 h-4 shrink-0">
                        {course.level}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                        <span>Tiến trình: {course.completedLessons}/{course.totalLessons} bài học</span>
                        <span>{percent}%</span>
                      </div>
                      <Progress value={percent} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
