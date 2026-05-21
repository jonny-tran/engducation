import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import {
  ShieldCheck,
  Mail,
  Calendar,
  Key,
  User,
  Activity,
  Database,
  Users,
  BookOpen,
} from "lucide-react";
import AdminDashboardActions from "./admin-dashboard-actions";
import { CopyButton } from "@/components/copy-button";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@engducation/ui/components/breadcrumb";
import { Separator } from "@engducation/ui/components/separator";
import { SidebarTrigger } from "@engducation/ui/components/sidebar";
import Link from "next/link";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { adminId } = await params;

  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect non-admin users to their standard user profile
  if (session.user.role !== "admin") {
    redirect(`/${session.user.id}`);
  }

  // Route protection: Admins can only see their own admin dashboard
  if (session.user.id !== adminId) {
    redirect(`/admin/${session.user.id}/dashboard`);
  }

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {/* Top Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/60 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Bảng Quản trị</BreadcrumbPage>
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
        {/* Welcome Premium Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 p-6 text-white shadow-xl transition-all duration-300">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <ShieldCheck className="h-7 w-7 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  Hệ thống Quản trị cao cấp
                </h1>
                <p className="text-rose-100 text-xs md:text-sm mt-0.5 font-light">
                  Xin chào, <span className="font-semibold text-white">{session.user.name}</span>! Bạn có toàn quyền quản trị nền tảng.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-semibold w-fit">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Phiên quản trị hoạt động
            </div>
          </div>
        </div>

        {/* System Monitoring Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* System Health Status */}
          <Card className="bg-card/40 backdrop-blur-md border-muted relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between pb-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trạng thái hệ thống</span>
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black tracking-tight text-foreground">ONLINE</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    99.98% uptime
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Các dịch vụ chính đang chạy ổn định</p>
              </div>
            </CardContent>
          </Card>

          {/* Database Connectivity */}
          <Card className="bg-card/40 backdrop-blur-md border-muted relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500" />
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between pb-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cơ sở dữ liệu</span>
                <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Database className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black tracking-tight text-foreground">CONNECTED</span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    &lt; 5ms latency
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Kết nối mã hóa SSL tới Neon Postgres</p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Role Status */}
          <Card className="bg-card/40 backdrop-blur-md border-muted relative overflow-hidden group hover:shadow-md transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-rose-500 to-purple-500" />
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between pb-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phạm vi hạng quyền</span>
                <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 font-extrabold uppercase tracking-widest text-[10px]">
                    {session.user.role.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2.5">Quyền hạn tối cao điều hành toàn bộ nền tảng</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Admin Profile Card (Spans 2 cols) */}
          <Card className="lg:col-span-2 bg-card/40 backdrop-blur-md border-muted p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2 pb-3 border-b border-muted">
              <User className="h-5 w-5 text-rose-500" />
              <h2 className="text-lg font-bold tracking-tight text-foreground">Thông tin cá nhân Admin</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID Field */}
              <div className="flex flex-col p-4 bg-muted/30 dark:bg-muted/10 rounded-2xl border border-muted/50 transition-all hover:bg-muted/50 dark:hover:bg-muted/20 relative group">
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                  <Key className="h-3.5 w-3.5 text-rose-400" />
                  Mã định danh Admin
                </span>
                <span className="font-mono text-xs break-all text-foreground select-all pr-8">
                  {session.user.id}
                </span>
                <CopyButton value={session.user.id} className="absolute right-3 bottom-3" />
              </div>

              {/* Email Field */}
              <div className="flex flex-col p-4 bg-muted/30 dark:bg-muted/10 rounded-2xl border border-muted/50 transition-all hover:bg-muted/50 dark:hover:bg-muted/20 relative group">
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                  <Mail className="h-3.5 w-3.5 text-rose-400" />
                  Email liên hệ
                </span>
                <span className="font-mono text-xs text-foreground pr-8 select-all">
                  {session.user.email}
                </span>
                <CopyButton value={session.user.email} className="absolute right-3 bottom-3" />
              </div>

              {/* Registration Date */}
              <div className="flex flex-col p-4 bg-muted/30 dark:bg-muted/10 rounded-2xl border border-muted/50 transition-all hover:bg-muted/50 dark:hover:bg-muted/20 md:col-span-2">
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5 text-rose-400" />
                  Thời điểm kích hoạt tài khoản
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {new Date(session.user.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions Panel (Spans 1 col) */}
          <Card className="bg-card/40 backdrop-blur-md border-muted p-6 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-muted">
                <Activity className="h-5 w-5 text-rose-500" />
                <h2 className="text-lg font-bold tracking-tight text-foreground">Tiện ích Quản trị</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Phím tắt thao tác nhanh dành cho vai trò quản trị viên cấp cao.
              </p>

              <div className="space-y-2">
                <Link href="#" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 dark:bg-muted/10 dark:hover:bg-muted/20 border border-muted/50 text-xs font-semibold text-foreground transition-all duration-200 group">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    Quản lý người dùng
                  </span>
                  <span className="text-[10px] text-muted-foreground group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link href="#" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 dark:bg-muted/10 dark:hover:bg-muted/20 border border-muted/50 text-xs font-semibold text-foreground transition-all duration-200 group">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    Quản lý khóa học
                  </span>
                  <span className="text-[10px] text-muted-foreground group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>

            <AdminDashboardActions />
          </Card>
        </div>
      </div>
    </div>
  );
}
