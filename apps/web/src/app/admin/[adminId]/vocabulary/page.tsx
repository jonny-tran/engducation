"use client";

import { Button } from "@engducation/ui/components/button";
import { Card, CardTitle } from "@engducation/ui/components/card";
import { BookOpen, BookMarked, ArrowRight } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function AdminVocabularyPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.adminId as string;

  return (
    <div className="flex flex-col flex-1 h-full w-full items-center justify-center p-6 bg-background/30">
      <Card className="max-w-md w-full border border-border/60 bg-card/50 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden text-center p-6 space-y-6">
        <div className="mx-auto p-3 rounded-2xl bg-rose-500/10 text-rose-500 w-fit">
          <BookMarked className="h-8 w-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-card-foreground">
            Quản lý từ vựng tích hợp
          </CardTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hệ thống Engducation đã chuyển đổi tính năng quản lý từ vựng thành mô hình trực quan tích hợp sâu vào từng <strong>Học phần (Modules)</strong> trong Đề cương khóa học.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground text-left leading-relaxed">
          <span className="font-bold text-foreground block mb-1">Cách truy cập mới:</span>
          Vào danh sách khóa học &rarr; Chọn Quản lý lộ trình &rarr; Chọn học phần cần thiết &rarr; Tab <strong>Từ vựng</strong> để biên soạn từ vựng học thuật.
        </div>
        <Button
          onClick={() => router.push(`/admin/${adminId}/courses`)}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl h-10 gap-1.5 shadow-md shadow-rose-600/10"
        >
          <BookOpen className="h-4 w-4" /> Đi đến Quản lý khóa học <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Card>
    </div>
  );
}
