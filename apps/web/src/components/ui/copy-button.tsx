"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@engducation/ui/components/button";
import { toast } from "sonner";

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Đã sao chép thông tin!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Sao chép thất bại");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className={className}
      onClick={handleCopy}
      title="Sao chép"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
      )}
    </Button>
  );
}
