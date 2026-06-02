"use client";

import React, { use } from "react";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@engducation/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@engducation/ui/components/table";
import { Badge } from "@engducation/ui/components/badge";
import { Cpu, DollarSign, Activity, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { SidebarTrigger } from "@engducation/ui/components/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@engducation/ui/components/breadcrumb";
import { Separator } from "@engducation/ui/components/separator";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default function AdminAiDashboard({ params }: PageProps) {
  const { adminId } = use(params);

  // Queries
  const { data: statsData, isLoading: statsLoading } = useQuery(
    trpc.adminAdvanced.aiUsageStats.queryOptions()
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  const isAlarmActive = (statsData?.errorRate ?? 0) > 5;

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {/* Top Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/60 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Giám Sát AI & Quản Lý Chi Phí</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Urgent Connection Error Warning banner if rate > 5% */}
        {isAlarmActive && (
          <div className="relative overflow-hidden rounded-2xl bg-rose-600 p-4 text-white shadow-lg animate-pulse flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-white shrink-0" />
            <div>
              <h2 className="font-bold text-sm">CẢNH BÁO ĐỎ: Tỷ lệ lỗi kết nối OpenAI API vượt quá 5%!</h2>
              <p className="text-xs text-rose-100 font-light mt-0.5">
                Tỷ lệ lỗi hiện tại là <span className="font-bold">{statsData?.errorRate}%</span>. Vui lòng kiểm tra số dư tài khoản OpenAI hoặc đổi API Key dự phòng để đảm bảo việc học của học viên không bị gián đoạn.
              </p>
            </div>
          </div>
        )}

        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <Sparkles className="h-7 w-7 text-white animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  Bảng Phân Tích & Giám Sát Chi Phí AI
                </h1>
                <p className="text-blue-100 text-xs md:text-sm mt-0.5 font-light">
                  Phân tích lượng tài chính tiêu hao cho API AI trên từng khóa học và bài viết để kiểm soát biên độ lợi nhuận ròng.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-2xl border bg-card animate-pulse">
                <div className="h-32" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total API Cost */}
            <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-3 text-emerald-500/10 group-hover:scale-110 transition-transform">
                <DollarSign className="h-16 w-16" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Tổng chi phí API tiêu tốn</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(
                    statsData?.costPerCourse.reduce((acc, cur) => acc + Number(cur.totalCost), 0) ?? 0
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  Tính toán quy đổi dựa trên số lượng tokens tiêu thụ thực tế.
                </span>
              </CardContent>
            </Card>

            {/* Total Tokens Consumed */}
            <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-3 text-indigo-500/10 group-hover:scale-110 transition-transform">
                <Cpu className="h-16 w-16" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Tổng số Tokens tiêu thụ</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {new Intl.NumberFormat("en-US").format(
                    statsData?.costPerCourse.reduce((acc, cur) => acc + Number(cur.totalTokens), 0) ?? 0
                  )}{" "}
                  <span className="text-xs font-normal text-muted-foreground">Tokens</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">
                  Gồm tổng token đầu vào (Prompt) và đầu ra (Completion).
                </span>
              </CardContent>
            </Card>

            {/* API Connection Health */}
            <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-3 text-rose-500/10 group-hover:scale-110 transition-transform">
                <Activity className="h-16 w-16" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Tỷ lệ lỗi kết nối API</CardDescription>
                <CardTitle className={`text-3xl font-extrabold mt-1 ${isAlarmActive ? "text-rose-600" : "text-emerald-600"}`}>
                  {statsData?.errorRate}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${isAlarmActive ? "bg-rose-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
                  <span className="text-xs text-muted-foreground">
                    {isAlarmActive ? "Đang có sự cố đường truyền" : "Hệ thống kết nối API đang AN TOÀN"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Breakdown details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost per Course */}
          <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Thống kê chi phí theo Khóa Học (Cost per Course)</CardTitle>
              <CardDescription>Biên độ tiêu thụ token OpenAI tích lũy phân rã cho từng khóa học.</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
              ) : !statsData?.costPerCourse || statsData.costPerCourse.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">Chưa có dữ liệu tiêu thụ.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Khóa Học</TableHead>
                        <TableHead className="text-center">Số lượt gọi AI</TableHead>
                        <TableHead className="text-right">Tokens tiêu thụ</TableHead>
                        <TableHead className="text-right">Chi phí quy đổi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statsData.costPerCourse.map((c: any) => (
                        <TableRow key={c.courseId} className="hover:bg-muted/10">
                          <TableCell className="font-semibold text-foreground text-sm">
                            {c.courseTitle}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-xs">
                            {c.callsCount} lượt
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {new Intl.NumberFormat("en-US").format(c.totalTokens)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(Number(c.totalCost))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost per Exercise */}
          <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Top bài tập viết tiêu hao nhiều chi phí (Cost per Exercise)</CardTitle>
              <CardDescription>Xếp hạng các bài tập viết luận tiêu tốn nhiều chi phí API nhất để quản lý Quota.</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
              ) : !statsData?.costPerExercise || statsData.costPerExercise.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">Chưa có dữ liệu tiêu thụ.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bài tập</TableHead>
                        <TableHead className="text-center">Số lượt gọi AI</TableHead>
                        <TableHead className="text-right">Tokens tiêu thụ</TableHead>
                        <TableHead className="text-right">Chi phí quy đổi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statsData.costPerExercise.map((e: any) => (
                        <TableRow key={e.exerciseId} className="hover:bg-muted/10">
                          <TableCell className="font-semibold text-foreground text-sm max-w-[200px] truncate">
                            {e.exerciseTitle}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-xs">
                            {e.callsCount} lượt
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {new Intl.NumberFormat("en-US").format(e.totalTokens)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(Number(e.totalCost))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
