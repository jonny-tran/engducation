"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "../ui/mode-toggle";
import UserMenu from "./user-menu";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@engducation/ui/components/badge";
import { Button } from "@engducation/ui/components/button";
import { BookOpen, GraduationCap } from "lucide-react";

export function StudentHeader() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const getBreadcrumbLabel = () => {
    if (pathname === "/courses") return "Danh mục khóa học";
    if (pathname?.startsWith("/courses/")) return "Chi tiết khóa học";
    if (pathname?.endsWith("/quiz")) return "Làm bài tập Quiz";
    if (pathname?.startsWith("/lessons/")) return "Phát bài giảng";
    return "Lớp học";
  };

  const getHomeUrl = () => {
    if (!session?.user) return "/";
    return `/${session.user.id}`;
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50 border-border shadow-sm">
      <div className="flex items-center gap-3">
        <Link href={getHomeUrl() as any} className="flex items-center gap-2 group">
          <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight group-hover:opacity-85 transition-opacity">
            🎓 engducation
          </span>
        </Link>
        <span className="h-4 w-[1px] bg-border hidden sm:inline" />
        <Badge variant="outline" className="border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase bg-indigo-500/5 tracking-wider hidden sm:inline-flex">
          {getBreadcrumbLabel()}
        </Badge>
      </div>

      <nav className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
        <Link href="/courses">
          <Button variant="ghost" size="sm" className={`h-8 font-bold text-xs rounded-xl ${pathname === "/courses" ? "bg-accent text-accent-foreground font-extrabold" : "hover:bg-accent/50"}`}>
            <BookOpen className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
            Khóa học
          </Button>
        </Link>
        {session?.user && (
          <Link href={`/${session.user.id}` as any}>
            <Button variant="ghost" size="sm" className={`h-8 font-bold text-xs rounded-xl ${pathname === `/${session.user.id}` ? "bg-accent text-accent-foreground font-extrabold" : "hover:bg-accent/50"}`}>
              <GraduationCap className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
              Lộ trình
            </Button>
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
