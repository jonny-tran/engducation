"use client";
import { AdminVocabularyManager } from "@/features/learning-content";

export default function AdminVocabularyPage() {
  return (
    <div className="flex flex-col flex-1 h-full w-full">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/60 backdrop-blur-md sticky top-0 z-10">
        <span className="text-sm font-medium">Quản lý Từ vựng</span>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <AdminVocabularyManager />
      </div>
    </div>
  );
}
