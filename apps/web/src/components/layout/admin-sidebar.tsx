"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@engducation/ui/components/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@engducation/ui/components/dropdown-menu";
import { Avatar, AvatarFallback } from "@engducation/ui/components/avatar";
import {
  ShieldCheck,
  LayoutDashboard,
  BookOpen,
  Settings,
  Database,
  LogOut,
  ChevronUp,
  Circle
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string | Date;
    };
  };
}

export function AdminSidebar({ session, ...props }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const adminId = session.user.id;

  const data = React.useMemo(() => ({
    navMain: [
      {
        title: "Tổng quan",
        url: `/admin/${adminId}/dashboard`,
        icon: LayoutDashboard,
        isActive: pathname === `/admin/${adminId}/dashboard`,
      },
      {
        title: "Quản lý đào tạo",
        url: `/admin/${adminId}/courses`,
        icon: BookOpen,
        isActive: pathname.startsWith(`/admin/${adminId}/courses`),
        items: [
          {
            title: "Khóa học",
            url: `/admin/${adminId}/courses`,
          },
        ],
      },
      {
        title: "Hệ thống",
        url: `/admin/${adminId}/settings`,
        icon: Settings,
        isActive: pathname.startsWith(`/admin/${adminId}/settings`) || pathname.startsWith(`/admin/${adminId}/users`),
        items: [
          {
            title: "Người dùng",
            url: `/admin/${adminId}/users`,
          },
          {
            title: "Cấu hình chung",
            url: `/admin/${adminId}/settings`,
          },
        ],
      },
    ],
    system: [
      {
        title: "Cơ sở dữ liệu",
        status: "CONNECTED",
        icon: Database,
        color: "text-emerald-500",
      },
      {
        title: "Hệ thống chính",
        status: "ONLINE",
        icon: ShieldCheck,
        color: "text-indigo-500",
      },
    ]
  }), [adminId, pathname]);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Đăng xuất thành công");
          router.push("/");
        },
        onError: (err) => {
          setIsLoggingOut(false);
          toast.error(err.error.message || "Đăng xuất thất bại");
        },
      },
    });
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={`/admin/${adminId}/dashboard`} />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-md shadow-rose-600/30">
                <ShieldCheck className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-foreground">Engducation Admin</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Hệ thống</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Main */}
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => {
              const hasSubItems = !!item.items?.length;
              return (
                <SidebarMenuItem key={item.title}>
                  {hasSubItems ? (
                    <>
                      <SidebarMenuButton
                        isActive={item.isActive}
                        render={<div className="font-medium flex items-center justify-between cursor-default" />}
                      >
                        <span className="flex items-center gap-2">
                          {item.icon && <item.icon className="h-4 w-4 text-rose-500" />}
                          {item.title}
                        </span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              isActive={pathname === subItem.url}
                              render={<Link href={subItem.url as any} />}
                            >
                              {subItem.title}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </>
                  ) : (
                    <SidebarMenuButton
                      isActive={item.isActive}
                      render={<Link href={item.url as any} className="font-medium" />}
                    >
                      {item.icon && <item.icon className="h-4 w-4 text-rose-500" />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* System Monitoring Group */}
        <SidebarGroup>
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Giám sát dịch vụ
          </div>
          <SidebarMenu className="mt-1">
            {data.system.map((item) => (
              <SidebarMenuItem key={item.title}>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 dark:bg-muted/10 border border-muted/50 mb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <span className="text-muted-foreground text-[11px] font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Circle className="h-2 w-2 fill-emerald-500 stroke-none animate-pulse" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] tracking-wide">{item.status}</span>
                  </div>
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-muted/40 rounded-xl"
                  />
                }
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-950/30 text-rose-600 border border-rose-500/20">
                    <AvatarFallback className="rounded-lg font-bold">
                      {session.user.name?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-xs leading-tight">
                    <span className="truncate font-semibold text-foreground">
                      {session.user.name}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {session.user.email}
                    </span>
                  </div>
                </div>
                <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 bg-card border border-muted/60 rounded-xl p-1 shadow-2xl"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                    Tài khoản Admin
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer"
                  disabled={isLoggingOut}
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
