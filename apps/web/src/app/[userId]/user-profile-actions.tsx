"use client";

import { Button } from "@engducation/ui/components/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function UserProfileActions() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
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
    <div className="flex flex-wrap gap-3 justify-end mt-6">
      <Button
        variant="destructive"
        disabled={isLoggingOut}
        onClick={handleSignOut}
        className="flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
      </Button>
    </div>
  );
}
