import { StudentHeader } from "@/components/layout/student-header";
import { StudentNotebookView } from "@/features/vocabulary";

export default function MyNotebookPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Premium Header */}
      <StudentHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Banner Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black uppercase tracking-wider text-foreground">
              Sổ tay từ vựng của tôi
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Lưu trữ và rèn luyện các từ vựng khó học, nhắm mục tiêu ghi nhớ lâu dài.
            </p>
          </div>
        </div>

        {/* Notebook view list */}
        <StudentNotebookView />
      </main>
    </div>
  );
}
