"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "../ui/mode-toggle";
import UserMenu from "./user-menu";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@engducation/ui/components/badge";
import { Button } from "@engducation/ui/components/button";
import { useCart } from "@/context/cart-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetClose } from "@engducation/ui/components/sheet";
import { BookOpen, GraduationCap, ShoppingCart, Trash2 } from "lucide-react";

export function StudentHeader() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const { cartItems, removeFromCart, cartTotal } = useCart();

  const getBreadcrumbLabel = () => {
    if (pathname === "/courses") return "Danh mục khóa học";
    if (pathname?.startsWith("/courses/")) return "Chi tiết khóa học";
    if (pathname?.endsWith("/quiz")) return "Làm bài tập Quiz";
    if (pathname?.startsWith("/lessons/")) return "Phát bài giảng";
    if (pathname === "/vocabulary") return "Từ điển hệ thống";
    if (pathname === "/vocabulary/my-notebook") return "Sổ tay từ vựng";
    if (pathname === "/checkout") return "Thanh toán";
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
        
        <Link href="/vocabulary">
          <Button variant="ghost" size="sm" className={`h-8 font-bold text-xs rounded-xl ${pathname?.startsWith("/vocabulary") ? "bg-accent text-accent-foreground font-extrabold" : "hover:bg-accent/50"}`}>
            <BookOpen className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
            Từ vựng
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
        {/* Shopping Cart Trigger */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl border border-border/40 hover:bg-accent">
                <ShoppingCart className="h-4 w-4 text-indigo-500" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-background shadow-sm animate-fade-in animate-duration-300">
                    {cartItems.length}
                  </span>
                )}
              </Button>
            }
          />
          <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-card border-l border-border rounded-l-3xl">
            <SheetHeader className="border-b pb-4">
              <SheetTitle className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-indigo-500" />
                Giỏ Hàng Của Bạn
              </SheetTitle>
              <SheetDescription className="text-[10px] text-muted-foreground">
                Xem lại danh sách khóa học và chuẩn bị thanh toán.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <span className="text-3xl">🛒</span>
                  <p className="text-xs font-bold text-foreground">Giỏ hàng đang trống</p>
                  <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed">
                    Hãy khám phá các khóa học thú vị trong danh mục để bổ sung kiến thức.
                  </p>
                  <SheetClose
                    render={
                      <Link href="/courses">
                        <Button variant="default" size="sm" className="h-8 text-[10px] font-bold rounded-xl px-4">
                          Khám phá khóa học
                        </Button>
                      </Link>
                    }
                  />
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 border border-border/60 bg-muted/20 rounded-2xl relative group transition-colors hover:border-border">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.title} className="w-16 h-12 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="w-16 h-12 bg-indigo-500/10 border border-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 font-mono font-bold text-xs select-none">
                        {item.level}
                      </div>
                    )}
                    <div className="flex-1 space-y-1 pr-6">
                      <h4 className="text-xs font-bold text-foreground line-clamp-1 uppercase">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[8px] font-mono px-1.5 py-0 h-4 rounded-full font-black bg-indigo-500/5">
                          {item.level}
                        </Badge>
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                          {item.price === 0 ? "Miễn phí" : `${item.price.toLocaleString("vi-VN")} đ`}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-foreground">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {cartTotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <SheetClose
                  render={
                    <Link href="/checkout">
                      <Button className="w-full h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md">
                        Tiến hành Thanh toán
                      </Button>
                    </Link>
                  }
                />
              </div>
            )}
          </SheetContent>
        </Sheet>

        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
