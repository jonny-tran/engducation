"use client";

import { useQueryClient, useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { useCart } from "@/context/cart-context";
import { useRouter } from "next/navigation";
import { StudentHeader } from "@/components/layout/student-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@engducation/ui/components/card";
import { Button } from "@engducation/ui/components/button";
import { Badge } from "@engducation/ui/components/badge";
import { Skeleton } from "@engducation/ui/components/skeleton";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  CreditCard, 
  ShoppingCart, 
  ShieldCheck, 
  Trash2, 
  AlertTriangle,
  Sparkles,
  Banknote,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { cartItems, removeFromCart, clearCart, cartTotal } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"auto" | "bank">("auto");
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Session checking for page protection
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  // 2. Batch Enrollment TRPC Mutation
  const enrollBatchMutation = useMutation(
    trpc.user.courseEnrollBatch.mutationOptions({
      onSuccess: () => {
        toast.success("Thanh toán giả lập thành công! Các khóa học đã được kích hoạt.", {
          description: "Hệ thống đã tự động ghi danh và lưu lịch sử học tập của bạn.",
          duration: 5000,
        });
        // Invalidate TRPC queries to refresh course data in list/detail
        queryClient.invalidateQueries({
          queryKey: trpc.user.courseList.queryKey(),
        });
        clearCart();
        setIsProcessing(false);
        router.push("/courses");
      },
      onError: (err) => {
        toast.error(`Thanh toán thất bại: ${err.message}`);
        setIsProcessing(false);
      }
    })
  );

  // Loading skeleton state
  if (isSessionPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col w-full">
        <div className="h-16 border-b bg-muted/20 animate-pulse" />
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  // Redirect unauthenticated user
  if (!session) {
    router.push("/login");
    return null;
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.warning("Giỏ hàng của bạn đang trống!");
      return;
    }

    setIsProcessing(true);
    const courseIds = cartItems.map((item) => item.id);

    enrollBatchMutation.mutate({ courseIds });
  };

  // Map CEFR levels to premium visual themes
  const getCefrBadgeStyle = (level: string) => {
    switch (level) {
      case "A1":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "A2":
        return "border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400";
      case "B1":
        return "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
      case "B2":
        return "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "C1":
        return "border-pink-500/20 bg-pink-500/10 text-pink-600 dark:text-pink-400";
      case "C2":
        return "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400";
      default:
        return "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Shared Premium Header */}
      <StudentHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Back Link */}
        <Link href="/courses">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Tiếp tục tìm kiếm khóa học
          </span>
        </Link>

        {/* Page Title */}
        <div className="border-b border-border pb-4">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-foreground flex items-center gap-2">
            <CreditCard className="h-5 sm:h-6 sm:w-6 w-5 text-indigo-500" />
            Thanh Toán Hóa Đơn
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            Xác nhận đơn hàng và kích hoạt quyền truy cập vào nội dung học trực tuyến.
          </p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="p-16 border border-dashed border-border rounded-3xl bg-muted/10 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-5xl">🛍️</span>
            <div className="font-bold text-sm text-foreground uppercase tracking-wider">Giỏ hàng của bạn trống trơn</div>
            <p className="text-[11px] text-muted-foreground max-w-sm leading-relaxed">
              Bạn chưa thêm khóa học trả phí nào vào giỏ hàng. Hãy quay lại danh mục để chọn lựa khóa học ưng ý nhé.
            </p>
            <Link href="/courses">
              <Button variant="default" className="text-xs font-bold mt-2 rounded-xl px-5">
                Xem danh sách khóa học
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Orders list & user details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Chi tiết đơn hàng ({cartItems.length} khóa học)
                </h3>
                
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <Card key={item.id} className="border border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm hover:border-border transition-colors">
                      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex gap-3.5 items-start">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.title} className="w-20 h-14 rounded-xl object-cover border border-border/60 shrink-0" />
                          ) : (
                            <div className="w-20 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 font-mono font-bold text-sm shrink-0 select-none">
                              {item.level}
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <Badge className={`font-mono font-black border text-[8px] px-2 py-0 h-4.5 rounded-full ${getCefrBadgeStyle(item.level)}`}>
                              {item.level}
                            </Badge>
                            <h4 className="text-xs sm:text-sm font-extrabold text-foreground uppercase line-clamp-1">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-1">
                              {item.description ?? "Khóa học ngoại ngữ chuyên sâu."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 shrink-0">
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                            {item.price.toLocaleString("vi-VN")} đ
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isProcessing}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* User Billing Details */}
              <Card className="border border-border/60 bg-card rounded-2xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-foreground">
                    Thông tin học viên thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-muted-foreground">Họ và tên</span>
                    <div className="p-2.5 border rounded-xl bg-muted/20 text-foreground font-bold">
                      {session.user.name ?? "Học viên Engducation"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-muted-foreground">Địa chỉ email</span>
                    <div className="p-2.5 border rounded-xl bg-muted/20 text-foreground font-mono">
                      {session.user.email}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Phương thức thanh toán giả lập
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => !isProcessing && setPaymentMethod("auto")}
                    className={`p-4 border rounded-2xl cursor-pointer flex items-start gap-3 transition-all duration-300 ${
                      paymentMethod === "auto" 
                        ? 'border-indigo-500 bg-indigo-500/[0.02] shadow-sm shadow-indigo-500/5' 
                        : 'border-border/60 bg-card hover:bg-muted/10'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === "auto" ? 'border-indigo-500' : 'border-border'
                    }`}>
                      {paymentMethod === "auto" && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-foreground">Auto-Acceptance</span>
                        <Badge className="bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-[8px] font-black px-1.5 py-0 h-4 rounded-full tracking-wide">
                          Khuyên dùng
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Kích hoạt ngay lập tức qua API Backend hoàn toàn tự động.
                      </p>
                    </div>
                  </div>

                  <div 
                    onClick={() => !isProcessing && setPaymentMethod("bank")}
                    className={`p-4 border rounded-2xl cursor-pointer flex items-start gap-3 transition-all duration-300 ${
                      paymentMethod === "bank" 
                        ? 'border-indigo-500 bg-indigo-500/[0.02] shadow-sm shadow-indigo-500/5' 
                        : 'border-border/60 bg-card hover:bg-muted/10'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === "bank" ? 'border-indigo-500' : 'border-border'
                    }`}>
                      {paymentMethod === "bank" && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-foreground">Chuyển khoản ảo</span>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Mô phỏng quét mã QR thanh toán ngân hàng giả lập.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Order Summary & Action */}
            <div className="space-y-6">
              
              <Card className="border border-border/80 bg-card rounded-3xl shadow-md overflow-hidden sticky top-24">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <CardHeader className="border-b pb-4 relative z-10">
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-foreground">
                    Tóm tắt đơn hàng
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-5 space-y-4 relative z-10 text-xs">
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between font-medium text-muted-foreground">
                      <span>Tổng số khóa học:</span>
                      <span className="font-bold text-foreground">{cartItems.length} khóa</span>
                    </div>
                    
                    <div className="flex justify-between font-medium text-muted-foreground">
                      <span>Tạm tính:</span>
                      <span className="font-bold text-foreground">{cartTotal.toLocaleString("vi-VN")} đ</span>
                    </div>

                    <div className="flex justify-between font-medium text-muted-foreground">
                      <span>Thuế & Phí dịch vụ:</span>
                      <span className="font-bold text-emerald-500">Miễn phí</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 flex justify-between items-center text-xs font-bold text-foreground">
                    <span>Tổng cộng:</span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                      {cartTotal.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  {/* Anti-cheat disclaimer / Alert warning */}
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-2 text-[10px] text-amber-600/90 leading-relaxed font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <p>
                      <strong>Lưu ý nghiệp vụ:</strong> Đây là luồng thanh toán giả lập. Ngay sau khi click xác nhận, hệ thống sẽ thực hiện Database Transaction để mở khóa toàn bộ bài học và bài tập của khóa học này cho bạn.
                    </p>
                  </div>

                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-2 text-[10px] text-indigo-600/90 leading-relaxed font-medium">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-500" />
                    <p>
                      Cam kết bảo mật 100%. Mở khóa trọn đời các bài giảng, file viết luận AI chấm điểm và hệ thống Flashcard từ vựng.
                    </p>
                  </div>

                </CardContent>

                <CardFooter className="bg-muted/10 border-t border-border/50 p-4">
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md flex items-center justify-center gap-1.5 group"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang kích hoạt...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 fill-current group-hover:animate-bounce" />
                        Xác nhận & Kích hoạt ảo
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
