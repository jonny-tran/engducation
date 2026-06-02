"use client";

import { use } from "react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@engducation/ui/components/breadcrumb";
import { Separator } from "@engducation/ui/components/separator";
import { SidebarTrigger } from "@engducation/ui/components/sidebar";
import { UserModerationView } from "@/features/admin-dashboard";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default function AdminUsersPage({ params }: PageProps) {
  const { adminId } = use(params);

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
                <BreadcrumbPage>Quản lý người dùng</BreadcrumbPage>
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
        <UserModerationView adminId={adminId} />
      </div>
    </div>
  );
}
