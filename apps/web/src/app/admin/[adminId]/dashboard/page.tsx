import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@engducation/auth";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@engducation/ui/components/breadcrumb";
import { Separator } from "@engducation/ui/components/separator";
import { SidebarTrigger } from "@engducation/ui/components/sidebar";
import { ShieldCheck } from "lucide-react";
import AdminDashboardActions from "./admin-dashboard-actions";
import { AdminDashboardView, AdminStatsCards } from "@/features/learning-content";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { adminId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect(`/${session.user.id}`);
  }

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
                <BreadcrumbPage>Bảng Quản trị</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <AdminDashboardActions />
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
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  Hệ thống Quản trị cao cấp
                </h1>
                <p className="text-rose-100 text-xs md:text-sm mt-0.5 font-light">
                  Xin chào,{" "}
                  <span className="font-semibold text-white">
                    {session.user.name}
                  </span>
                  ! Bạn có toàn quyền quản trị nền tảng.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-semibold w-fit">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Phiên quản trị hoạt động
            </div>
          </div>
        </div>

        {/* Live Dashboard Statistics — fetched from tRPC admin.dashboardStats */}
        <AdminStatsCards />

        {/* CMS Content Management Interface */}
        <AdminDashboardView />
      </div>
    </div>
  );
}
