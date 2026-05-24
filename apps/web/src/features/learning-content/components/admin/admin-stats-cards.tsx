"use client";
import { useDashboardStats } from "../../hooks/use-dashboard-stats";
import { Card, CardContent } from "@engducation/ui/components/card";
import { Skeleton } from "@engducation/ui/components/skeleton";
import { BookOpen, FileText, ListChecks, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  accentColor: string;
  description: string;
}

function StatCard({ label, value, icon, accentColor, description }: StatCardProps) {
  const isLoading = value === undefined;

  return (
    <Card className="bg-card/40 backdrop-blur-md border-muted relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className={`absolute top-0 left-0 w-full h-[3px] ${accentColor}`} />
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between pb-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {label}
          </span>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-foreground">
                  {value?.toLocaleString("vi-VN")}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">{description}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminStatsCards() {
  const { data: stats } = useDashboardStats();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Tổng khóa học"
        value={stats?.totalCourses}
        icon={<BookOpen className="h-4 w-4" />}
        accentColor="bg-gradient-to-r from-blue-500 to-cyan-500"
        description="Khóa học đang hoạt động"
      />
      <StatCard
        label="Tổng bài học"
        value={stats?.totalLessons}
        icon={<FileText className="h-4 w-4" />}
        accentColor="bg-gradient-to-r from-violet-500 to-purple-500"
        description="Bài học trên nền tảng"
      />
      <StatCard
        label="Tổng bài tập"
        value={stats?.totalQuizzes}
        icon={<ListChecks className="h-4 w-4" />}
        accentColor="bg-gradient-to-r from-amber-500 to-orange-500"
        description="Bài tập trắc nghiệm"
      />
      <StatCard
        label="Tiến độ học tập"
        value={stats?.totalProgressLogs}
        icon={<TrendingUp className="h-4 w-4" />}
        accentColor="bg-gradient-to-r from-emerald-500 to-teal-500"
        description="Lượt ghi nhận tiến độ"
      />
    </div>
  );
}
