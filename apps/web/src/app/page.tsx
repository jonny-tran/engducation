"use client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@engducation/ui/components/button";
import {
  ArrowRight,
  LogIn,
  BookOpen,
  Award,
  Sparkles,
  Zap,
  Check,
  Compass,
  ShieldCheck,
  Globe
} from "lucide-react";

export default function Home() {
  // Silent health check to show in footer status
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  // Dynamic Workspace URL based on user role
  const getWorkspaceUrl = () => {
    if (!session?.user) return "/login";
    return session.user.role === "admin"
      ? `/admin/${session.user.id}/dashboard`
      : `/${session.user.id}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-300 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-3xl pointer-events-none" />

      {/* Floating Bespoke Landing Header */}
      <nav className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-20 border-b border-slate-200/50 dark:border-slate-800/30">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
            🎓 engducation
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isSessionPending ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-full" />
          ) : session ? (
            <Link href={getWorkspaceUrl() as any}>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95">
                Vào học tập
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-bold hover:bg-muted/80 rounded-full">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95">
                  Bắt đầu học
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex-1 max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center justify-center text-center space-y-8 z-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-indigo-200 bg-indigo-50/50 dark:border-indigo-950/40 dark:bg-indigo-950/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 select-none animate-fade-in shadow-inner">
          <Sparkles className="h-3.5 w-3.5 animate-spin-slow" />
          <span>Học Tiếng Anh Thông Minh · Trực Quan · Hiệu Quả</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl text-slate-900 dark:text-white">
          Nâng Tầm Tiếng Anh Của Bạn Với{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Engducation
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
          Nền tảng học tập cao cấp kết hợp bài giảng video sinh động, hệ thống bài tập trắc nghiệm thông minh và lộ trình phân cấp bài bản.
        </p>

        {/* Dynamic CTA Center */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-4 w-full sm:w-auto">
          {isSessionPending ? (
            <Button disabled className="w-full sm:w-48 bg-slate-300 text-slate-500 rounded-full h-12">
              Đang chuẩn bị...
            </Button>
          ) : session ? (
            <Link href={getWorkspaceUrl() as any} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]">
                Vào Không Gian Học Tập
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Đăng Nhập Học Thử
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-12 rounded-full border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 font-bold transition-all duration-300">
                  Khám phá lộ trình
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Floating Interactive Badge Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full pt-10 text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/40 border border-slate-200/40 dark:bg-slate-900/20 dark:border-slate-800/30 backdrop-blur-sm shadow-sm">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold">Tương tác 1-1</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/40 border border-slate-200/40 dark:bg-slate-900/20 dark:border-slate-800/30 backdrop-blur-sm shadow-sm">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-semibold">Khoá học bài bản</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/40 border border-slate-200/40 dark:bg-slate-900/20 dark:border-slate-800/30 backdrop-blur-sm shadow-sm">
            <Award className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold">Củng cố qua Quiz</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/40 border border-slate-200/40 dark:bg-slate-900/20 dark:border-slate-800/30 backdrop-blur-sm shadow-sm">
            <Compass className="h-4 w-4 text-pink-500" />
            <span className="text-xs font-semibold">Mọi cấp độ học</span>
          </div>
        </div>
      </header>

      {/* Main Core Features Highlight Grid */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/50 dark:border-slate-800/30">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight">Trải nghiệm học tập thế hệ mới</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm font-medium">
            Được thiết kế tỉ mỉ mang lại trải nghiệm tối giản, hiện đại và thúc đẩy hiệu quả ghi nhớ của học viên.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800/40 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-slate-300 dark:hover:border-slate-700/60 group">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-3">Video Bài Giảng Bảo Mật</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
              Bài giảng video chất lượng cao tích hợp công nghệ mã hoá an toàn Cloudinary, chống đánh cắp dữ liệu và cho phép tiếp tục học tập liền mạch.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800/40 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-slate-300 dark:hover:border-slate-700/60 group">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-3">Trắc Nghiệm Khách Quan</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
              Củng cố ngay kiến thức sau mỗi bài học bằng hệ thống câu hỏi độc quyền. Xem đáp án chi tiết và giải thích tường tận ngay sau khi nộp bài.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800/40 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-slate-300 dark:hover:border-slate-700/60 group">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-3">Học Tập Chống Gian Lận</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
              Đáp án quiz được xáo trộn an toàn tuyệt đối từ máy chủ. Cơ chế chống copy-paste câu hỏi đảm bảo quá trình kiểm tra kiến thức công bằng, chất lượng.
            </p>
          </div>
        </div>
      </section>

      {/* Modern Premium Footer */}
      <footer className="w-full border-t border-slate-200/50 dark:border-slate-800/30 bg-slate-100/50 dark:bg-slate-950/60 py-8 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div>
            © {new Date().getFullYear()} engducation. All rights reserved. Built with precision.
          </div>

          {/* ElysiaJS Backend Connection Indicator */}
          <div className="flex items-center gap-2 select-none">
            {healthCheck.isLoading ? (
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            ) : healthCheck.data ? (
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-rose-500" />
            )}
            <span className="text-[10px] tracking-wider font-bold uppercase">
              {healthCheck.isLoading
                ? "Checking server..."
                : healthCheck.data
                  ? "Elysia Backend Online"
                  : "Server Offline"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
