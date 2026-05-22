"use client";
import { useState, useEffect } from "react";
import { useWritingMutations } from "../hooks/use-writing-mutations";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Label } from "@engducation/ui/components/label";
import { PenTool, AlertCircle, Sparkles } from "lucide-react";

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
      // Default template values for premium appearance and ease of use
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
    <Card className="border border-border bg-card/60 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
      <CardHeader className="py-4 border-b border-border bg-muted/20 flex flex-row items-center gap-2">
        <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
          <PenTool className="h-4 w-4" />
        </div>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-card-foreground">
          {writingAssignment ? "Sửa bài viết luận" : "Thêm bài viết luận (AI Essay)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <Label className="font-bold uppercase text-muted-foreground">Tiêu đề bài viết luận *</Label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Essay: Discuss the impact of social media"
              className="text-xs focus:ring-amber-500/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-bold uppercase text-muted-foreground">Đề bài (Prompt) *</Label>
            <Textarea
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Nhập đề bài chi tiết..."
              className="min-h-[100px] text-xs focus:ring-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="font-bold uppercase text-muted-foreground">Giới hạn số từ (Word Limit)</Label>
              <Input
                type="number"
                min="10"
                value={wordLimit}
                onChange={(e) => setWordLimit(e.target.value)}
                placeholder="Để trống = không giới hạn"
                className="text-xs focus:ring-amber-500/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-bold uppercase text-muted-foreground">Trạng thái (Status)</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-8 w-full border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm transition-colors outline-none focus-visible:border-amber-500/50 focus-visible:ring-1 focus-visible:ring-amber-500/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="draft">DRAFT (Bản nháp)</option>
                <option value="published">PUBLISHED (Xuất bản)</option>
                <option value="archived">ARCHIVED (Lưu trữ)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Tiêu chí chấm điểm (Rubric) *
            </Label>
            <Textarea
              required
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              placeholder="Các tiêu chí để học viên đối chiếu khi làm bài..."
              className="min-h-[100px] text-xs font-mono focus:ring-amber-500/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-bold uppercase text-muted-foreground">Bài mẫu gợi ý (Suggested Answer)</Label>
            <Textarea
              value={suggestedAnswer}
              onChange={(e) => setSuggestedAnswer(e.target.value)}
              placeholder="Bài viết mẫu đạt điểm cao để học viên tham khảo (tùy chọn)..."
              className="min-h-[120px] text-xs focus:ring-amber-500/50"
            />
          </div>

          {error && (
            <div className="p-3 border border-destructive/20 bg-destructive/10 text-destructive rounded flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onFinished}
              className="font-bold"
            >
              HỦY
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              {isSubmitting
                ? "ĐANG LƯU..."
                : writingAssignment
                ? "CẬP NHẬT"
                : "THÊM MỚI"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
