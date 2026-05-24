"use client";

import { Button } from "@engducation/ui/components/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function AdminDashboardActions() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <div className="flex flex-wrap gap-2.5 justify-end mt-4 w-full">
      <Button
        variant="destructive"
        disabled={isLoggingOut}
        onClick={handleSignOut}
        className="flex-1 min-w-[110px] flex items-center justify-center gap-2 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] text-xs font-semibold py-2"
      >
        <LogOut className="h-4 w-4" />
        {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
      </Button>
    </div>
  );
}
