"use client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@engducation/ui/components/button";
import { ArrowRight, LogIn, LayoutDashboard, Database, CheckCircle, XCircle } from "lucide-react";

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

export default function Home() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] space-y-8">
      {/* Header ASCII Art Panel */}
      <div className="w-full text-center overflow-x-auto bg-slate-900 text-indigo-400 p-6 rounded-2xl shadow-xl font-mono border border-slate-800 relative group select-none">
        <div className="absolute top-3 left-3 flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <pre className="inline-block text-left text-xs sm:text-sm whitespace-pre leading-none">{TITLE_TEXT}</pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* API Connection Card */}
        <section className="bg-card border border-muted/80 p-6 rounded-2xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Database className="h-5 w-5 text-indigo-500" />
              API Connection
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Kiểm tra trạng thái kết nối với cổng dịch vụ ElysiaJS Backend.
            </p>
          </div>
          
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-muted/50">
            <div className="flex items-center gap-2">
              {healthCheck.isLoading ? (
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-ping" />
              ) : healthCheck.data ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {healthCheck.isLoading
                  ? "Đang kết nối..."
                  : healthCheck.data
                    ? "Kết nối ổn định"
                    : "Mất kết nối"}
              </span>
            </div>
            {healthCheck.data && (
              <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                ACTIVE
              </span>
            )}
          </div>
        </section>

        {/* Auth / Workspace Access Card */}
        <section className="bg-card border border-muted/80 p-6 rounded-2xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <LayoutDashboard className="h-5 w-5 text-indigo-500" />
              Không gian làm việc
            </h2>
            <p className="text-sm text-muted-foreground mb-4 font-normal">
              {isSessionPending
                ? "Đang xác thực thông tin..."
                : session
                  ? `Xin chào ${session.user.name}, bạn đã đăng nhập hệ thống với vai trò ${session.user.role}.`
                  : "Truy cập tài khoản cá nhân hoặc đăng ký tài khoản để học tập."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {isSessionPending ? (
              <Button disabled className="w-full">
                Đang tải dữ liệu...
              </Button>
            ) : session ? (
              <Link href="/dashboard" className="w-full">
                <Button className="w-full flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:bg-indigo-600 shadow-md">
                  Vào Dashboard cá nhân
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2 hover:bg-muted">
                    <LogIn className="h-4 w-4" />
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/login" className="flex-1">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
