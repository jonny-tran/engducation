"use client";
import { useState, useEffect } from "react";
import { useWritingMutations } from "../../hooks/use-writing-mutations";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Label } from "@engducation/ui/components/label";
import { PenTool, AlertCircle, Sparkles, BookOpen, Clock, Award, FileText, Loader2 } from "lucide-react";

interface WritingAssignmentData {
  id: string;
  moduleId: string;
  title: string;
  prompt: string;
  rubric: string;
  wordLimit: number | null;
  suggestedAnswer: string | null;
  status: string;
  order: number;
}

interface AdminWritingBuilderProps {
  courseId: string;
  moduleId: string;
  writingAssignment?: WritingAssignmentData | null;
  onFinished: () => void;
}

export function AdminWritingBuilder({
  courseId,
  moduleId,
  writingAssignment,
  onFinished,
}: AdminWritingBuilderProps) {
  const { createWriting, updateWriting } = useWritingMutations(courseId);

  // Form states
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [rubric, setRubric] = useState("");
  const [wordLimit, setWordLimit] = useState<string>("");
  const [suggestedAnswer, setSuggestedAnswer] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (writingAssignment) {
      setTitle(writingAssignment.title);
      setPrompt(writingAssignment.prompt);
      setRubric(writingAssignment.rubric);
      setWordLimit(writingAssignment.wordLimit?.toString() ?? "");
      setSuggestedAnswer(writingAssignment.suggestedAnswer ?? "");
      setStatus(writingAssignment.status as any);
    } else {
      setTitle("");
      setPrompt("");
      setRubric(
        "1. Task Achievement (30%): Trả lời đầy đủ câu hỏi, ý tưởng rõ ràng.\n" +
        "2. Coherence and Cohesion (30%): Bố cục mạch lạc, sử dụng từ nối hợp lý.\n" +
        "3. Lexical Resource (20%): Từ vựng phong phú, sử dụng từ nâng cao phù hợp.\n" +
        "4. Grammatical Range and Accuracy (20%): Sử dụng đa dạng cấu trúc ngữ pháp, ít lỗi chính tả."
      );
      setWordLimit("250");
      setSuggestedAnswer("");
      setStatus("draft");
    }
    setError(null);
  }, [writingAssignment, moduleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Tiêu đề bài viết luận không được để trống");
      return;
    }
    if (!prompt.trim()) {
      setError("Đề bài viết luận không được để trống");
      return;
    }
    if (!rubric.trim()) {
      setError("Tiêu chí chấm điểm (rubric) không được để trống");
      return;
    }

    const limitVal = wordLimit.trim() ? parseInt(wordLimit, 10) : undefined;
    if (limitVal !== undefined && (isNaN(limitVal) || limitVal <= 0)) {
      setError("Giới hạn từ phải là một số nguyên dương hợp lệ");
      return;
    }

    setError(null);

    const payload = {
      title: title.trim(),
      prompt: prompt.trim(),
      rubric: rubric.trim(),
      wordLimit: limitVal,
      suggestedAnswer: suggestedAnswer.trim() || undefined,
      status,
    };

    try {
      if (writingAssignment) {
        await updateWriting.mutateAsync({
          id: writingAssignment.id,
          ...payload,
        });
      } else {
        await createWriting.mutateAsync({
          moduleId,
          ...payload,
        });
      }
      onFinished();
    } catch {
      // handled by mutation error callbacks
    }
  };

  const isSubmitting = createWriting.isPending || updateWriting.isPending;

  return (
    <Card className="border border-muted/60 dark:border-muted/30 bg-gradient-to-b from-card to-muted/10 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300 rounded-2xl">
      <CardHeader className="py-4.5 px-6 border-b border-muted/40 dark:border-muted/20 bg-muted/20 dark:bg-muted/10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
            <PenTool className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-card-foreground">
              {writingAssignment ? "Sửa bài viết luận" : "Thêm bài viết luận (AI Essay)"}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
              {writingAssignment ? "Cập nhật yêu cầu đề bài và tiêu chí đánh giá AI" : "Thiết lập bài thực hành viết kèm công cụ chấm điểm AI thông minh"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Core details (Bento Left) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Bento Box 1: Core Setup */}
              <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-muted/40 dark:border-muted/20">
                  <BookOpen className="h-4 w-4 text-amber-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
                    Thông tin đề mục
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="writing-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      Tiêu đề bài viết luận <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="writing-title"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: Essay: Discuss the impact of social media"
                      className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 transition-all duration-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="writing-limit" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Giới hạn từ (Word Limit)
                    </Label>
                    <Input
                      id="writing-limit"
                      type="number"
                      min="10"
                      value={wordLimit}
                      onChange={(e) => setWordLimit(e.target.value)}
                      placeholder="Để trống = không giới hạn"
                      className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 transition-all duration-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="writing-status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
                      Trạng thái xuất bản
                    </Label>
                    <select
                      id="writing-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="flex h-9 w-full rounded-xl border border-muted/60 bg-background px-3 py-1 text-xs shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 dark:bg-muted/10 dark:border-muted/30"
                    >
                      <option value="draft">Bản nháp (Draft)</option>
                      <option value="published">Đã xuất bản (Published)</option>
                      <option value="archived">Lưu trữ (Archived)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Column 2: Detailed Textareas (Bento Right) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Bento Box 2: Essay Prompt & Rubric */}
              <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-muted/40 dark:border-muted/20">
                  <FileText className="h-4 w-4 text-amber-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
                    Yêu cầu chi tiết & Tiêu chí
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="writing-prompt" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      Đề bài viết luận (Prompt) <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="writing-prompt"
                      required
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Nhập đề bài chi tiết kèm các yêu cầu học thuật cụ thể..."
                      className="min-h-[100px] text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 transition-all duration-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="writing-rubric" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                      Tiêu chí chấm điểm (Rubric) <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="writing-rubric"
                      required
                      value={rubric}
                      onChange={(e) => setRubric(e.target.value)}
                      placeholder="Các tiêu chuẩn cụ thể để hệ thống AI phân tích chấm điểm..."
                      className="min-h-[110px] text-xs font-mono rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 transition-all duration-200 bg-muted/10 dark:bg-muted/5"
                    />
                  </div>
                </div>
              </div>

              {/* Bento Box 3: Model Essay */}
              <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-muted/40 dark:border-muted/20">
                  <Award className="h-4 w-4 text-amber-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
                    Bài viết gợi ý (High Score Model Essay)
                  </h3>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="writing-suggested" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Nội dung bài viết mẫu (Gợi ý tham khảo)
                  </Label>
                  <Textarea
                    id="writing-suggested"
                    value={suggestedAnswer}
                    onChange={(e) => setSuggestedAnswer(e.target.value)}
                    placeholder="Bài viết gợi ý điểm cao hoặc tài liệu định hướng cấu trúc luận điểm (tùy chọn)..."
                    className="min-h-[140px] text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 transition-all duration-200"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 border border-rose-500/20 bg-rose-500/5 rounded-xl flex items-center gap-2.5 shadow-xs">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 animate-bounce" />
              <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-muted/40 dark:border-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={onFinished}
              className="h-9 text-xs font-bold px-5 border border-muted/60 bg-background hover:bg-muted/10 text-muted-foreground hover:text-foreground rounded-xl active:scale-95 transition-all duration-200"
            >
              HỦY
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-md px-5 active:scale-95 transition-all duration-200 hover:shadow-amber-500/20 hover:shadow-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ĐANG LƯU...
                </div>
              ) : writingAssignment ? (
                "CẬP NHẬT"
              ) : (
                "THÊM MỚI"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
