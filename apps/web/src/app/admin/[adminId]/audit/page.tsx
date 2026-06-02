"use client";

import { use, useState } from "react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@engducation/ui/components/breadcrumb";
import { Separator } from "@engducation/ui/components/separator";
import { SidebarTrigger } from "@engducation/ui/components/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@engducation/ui/components/tabs";
import { ShieldCheck } from "lucide-react";
import { AuditLogsView } from "@/features/admin-dashboard/components/audit-logs-view";
import { UserModerationView } from "@/features/admin-dashboard/components/user-moderation-view";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default function AdminAuditPage({ params }: PageProps) {
  const { adminId } = use(params);
  const [activeTab, setActiveTab] = useState("audit");

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
                <BreadcrumbPage>Nhật Ký Kiểm Toán &amp; Bảo Mật</BreadcrumbPage>
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
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  Nhật Ký Kiểm Toán &amp; Điều Hòa Người Dùng
                </h1>
                <p className="text-rose-100/70 text-xs md:text-sm mt-0.5 font-light">
                  Phòng ngừa thất thoát tài chính, truy vết hành động nhạy cảm của các Admin
                  khác và quản trị lệnh Banned User khẩn cấp.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-muted/60 dark:bg-muted/30 p-1 rounded-xl">
            <TabsTrigger value="audit" className="rounded-lg font-semibold">
              Nhật ký hoạt động
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg font-semibold">
              Quản lý Khóa User
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="mt-6 space-y-4">
            <AuditLogsView activeTab={activeTab} />
          </TabsContent>

          <TabsContent value="users" className="mt-6 space-y-4">
            <UserModerationView adminId={adminId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
