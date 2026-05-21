import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import { User, Mail, Calendar, Key, ShieldCheck } from "lucide-react";
import UserProfileActions from "./user-profile-actions";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { userId } = await params;

  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect admin to admin dashboard if they try to access the user route
  if (session.user.role === "admin") {
    redirect(`/admin/${session.user.id}/dashboard`);
  }

  // Route protection: User can only see their own dashboard
  if (session.user.id !== userId) {
    redirect(`/${session.user.id}`);
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-950 dark:via-indigo-950/10 dark:to-purple-950/10 px-4 py-8">
      <Card className="w-full max-w-2xl border-indigo-100/50 dark:border-indigo-950/50 shadow-2xl bg-card/90 backdrop-blur-md transition-all duration-300">
        <CardHeader className="relative overflow-hidden rounded-t-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-6 py-8 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl" />
          
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                This is page role user
              </CardTitle>
              <CardDescription className="text-indigo-100 text-sm mt-1">
                Chào mừng quay trở lại, {session.user.name}!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-muted">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-foreground">Thông tin tài khoản</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID Field */}
              <div className="flex flex-col p-4 bg-muted/30 dark:bg-muted/10 rounded-xl border border-muted/50 transition-colors hover:bg-muted/40">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                  <Key className="h-3 w-3 text-indigo-400" />
                  Mã tài khoản (ID)
                </span>
                <span className="font-mono text-sm break-all text-foreground select-all">
                  {session.user.id}
                </span>
              </div>

              {/* Email Field */}
              <div className="flex flex-col p-4 bg-muted/30 dark:bg-muted/10 rounded-xl border border-muted/50 transition-colors hover:bg-muted/40">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                  <Mail className="h-3 w-3 text-indigo-400" />
                  Địa chỉ Email
                </span>
                <span className="font-mono text-sm text-foreground">
                  {session.user.email}
                </span>
              </div>

              {/* Name Field */}
              <div className="flex flex-col p-4 bg-muted/30 dark:bg-muted/10 rounded-xl border border-muted/50 transition-colors hover:bg-muted/40">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                  <User className="h-3 w-3 text-indigo-400" />
                  Họ và tên
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {session.user.name}
                </span>
              </div>

              {/* Created At Field */}
              <div className="flex flex-col p-4 bg-muted/30 dark:bg-muted/10 rounded-xl border border-muted/50 transition-colors hover:bg-muted/40">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                  <Calendar className="h-3 w-3 text-indigo-400" />
                  Ngày tham gia
                </span>
                <span className="text-sm text-foreground">
                  {new Date(session.user.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Role Info row */}
            <div className="flex flex-row items-center justify-between p-4 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/30 dark:border-indigo-950/30">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Vai trò hệ thống</span>
                <span className="text-xs text-muted-foreground mt-0.5">Quyền truy cập của tài khoản</span>
              </div>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full">
                {session.user.role}
              </Badge>
            </div>
          </div>

          <UserProfileActions />
        </CardContent>
      </Card>
    </div>
  );
}
