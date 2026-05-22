"use client";
import { useState, useEffect } from "react";
import { useQuizMutations } from "../hooks/use-quiz-mutations";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Label } from "@engducation/ui/components/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@engducation/ui/components/alert-dialog";
import { Plus, Trash2, GripVertical, CheckCircle2, Circle, AlertTriangle } from "lucide-react";

interface AnswerData {
  id: string;
  content: string;
  isCorrect: boolean;
}

interface QuestionData {
  id: string;
  content: string;
  explanation: string | null;
  order: number;
  answers: AnswerData[];
}

interface QuizData {
  id: string;
  moduleId: string;
  title: string;
  status: string;
  questions: QuestionData[];
}

interface AdminQuizBuilderProps {
  courseId: string;
  moduleId: string;
  quiz?: QuizData | null;
  onFinished: () => void;
}

interface FormAnswer {
  id: string;
  content: string;
  isCorrect: boolean;
}

interface FormQuestion {
  id: string;
  content: string;
  explanation: string;
  answers: FormAnswer[];
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function createEmptyAnswer(): FormAnswer {
  return { id: generateId(), content: "", isCorrect: false };
}

function createEmptyQuestion(): FormQuestion {
  return {
    id: generateId(),
    content: "",
    explanation: "",
    answers: [createEmptyAnswer(), createEmptyAnswer()],
  };
}

function validateQuestions(questions: FormQuestion[]): string | null {
  if (questions.length === 0) {
    return "Phải có ít nhất 1 câu hỏi";
  }
  for (const q of questions) {
    if (!q.content.trim()) {
      return "Nội dung câu hỏi không được để trống";
    }
    if (q.answers.length < 2) {
      return `Câu hỏi "${q.content.slice(0, 30)}..." cần ít nhất 2 đáp án`;
    }
    if (!q.answers.some((a) => a.isCorrect)) {
      return `Câu hỏi "${q.content.slice(0, 30)}..." chưa chọn đáp án đúng nào`;
    }
    for (const a of q.answers) {
      if (!a.content.trim()) {
        return "Nội dung đáp án không được để trống";
      }
    }
  }
  return null;
}

function QuestionCard({
  question,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  question: FormQuestion;
  index: number;
  onUpdate: (updated: FormQuestion) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const addAnswer = () => {
    onUpdate({ ...question, answers: [...question.answers, createEmptyAnswer()] });
  };

  const removeAnswer = (answerIndex: number) => {
    const newAnswers = question.answers.filter((_, i) => i !== answerIndex);
    const hasCorrect = newAnswers.some((a) => a.isCorrect);
    if (!hasCorrect && newAnswers.length > 0) {
      newAnswers[0]!.isCorrect = true;
    }
    onUpdate({ ...question, answers: newAnswers });
  };

  const toggleCorrect = (answerIndex: number) => {
    const newAnswers = question.answers.map((a, i) => ({
      ...a,
      isCorrect: i === answerIndex ? !a.isCorrect : a.isCorrect,
    }));
    onUpdate({ ...question, answers: newAnswers });
  };

  const updateAnswer = (answerIndex: number, content: string) => {
    const newAnswers = [...question.answers];
    newAnswers[answerIndex] = { ...newAnswers[answerIndex]!, content };
    onUpdate({ ...question, answers: newAnswers });
  };

  return (
    <div className="border border-border bg-card rounded-md p-3 space-y-3 shadow-sm hover:border-emerald-500/30 transition-all duration-200">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-bold uppercase text-muted-foreground">
            Câu {index + 1}
          </span>
          {question.answers.some((a) => a.isCorrect) ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          )}
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 px-2 text-[10px] text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Xóa câu hỏi
          </Button>
        )}
      </div>

      {/* Question Content */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
          Nội dung câu hỏi *
        </Label>
        <Input
          value={question.content}
          onChange={(e) => onUpdate({ ...question, content: e.target.value })}
          placeholder="Nhập nội dung câu hỏi..."
          className="text-xs"
        />
      </div>

      {/* Explanation */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
          Giải thích đáp án đúng (hiển thị sau khi học viên nộp bài)
        </Label>
        <Input
          value={question.explanation}
          onChange={(e) => onUpdate({ ...question, explanation: e.target.value })}
          placeholder="Nhập phần giải thích..."
          className="text-xs"
        />
      </div>

      {/* Answers */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
          Các lựa chọn đáp án (click biểu tượng để chọn đáp án đúng) *
        </Label>
        {question.answers.map((answer, answerIndex) => (
          <div key={answer.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleCorrect(answerIndex)}
              className="shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors"
              title={answer.isCorrect ? "Bỏ chọn đáp án này" : "Chọn làm đáp án đúng"}
            >
              {answer.isCorrect ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </button>
            <Input
              value={answer.content}
              onChange={(e) => updateAnswer(answerIndex, e.target.value)}
              placeholder={`Đáp án ${String.fromCharCode(65 + answerIndex)}`}
              className="text-xs flex-1"
            />
            {question.answers.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAnswer(answerIndex)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
        {question.answers.length < 6 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAnswer}
            className="h-7 text-[10px] font-bold w-full border-dashed"
          >
            <Plus className="h-3 w-3 mr-1" />
            Thêm lựa chọn đáp án
          </Button>
        )}
      </div>
    </div>
  );
}

export function AdminQuizBuilder({ courseId, moduleId, quiz, onFinished }: AdminQuizBuilderProps) {
  const { upsertQuizStructure, deleteQuiz } = useQuizMutations(courseId);
  const [quizTitle, setQuizTitle] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (quiz) {
      setQuizTitle(quiz.title);
      setStatus(quiz.status as any);
      setQuestions(
        quiz.questions.map((q) => ({
          id: q.id,
          content: q.content,
          explanation: q.explanation ?? "",
          answers: q.answers.map((a) => ({
            id: a.id,
            content: a.content,
            isCorrect: a.isCorrect,
          })),
        }))
      );
    } else {
      setQuizTitle("");
      setStatus("draft");
      setQuestions([createEmptyQuestion()]);
    }
    setValidationError(null);
  }, [quiz, moduleId]);

  const updateQuestion = (index: number, updated: FormQuestion) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      setValidationError("Tiêu đề bài tập không được để trống");
      return;
    }
    const err = validateQuestions(questions);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);

    const payload = {
      quizId: quiz?.id,
      moduleId,
      title: quizTitle.trim(),
      status,
      questions: questions.map((q, i) => ({
        id: q.id,
        content: q.content.trim(),
        explanation: q.explanation.trim() || undefined,
        order: i + 1,
        answers: q.answers.map((a) => ({
          id: a.id,
          content: a.content.trim(),
          isCorrect: a.isCorrect,
        })),
      })),
    };

    try {
      await upsertQuizStructure.mutateAsync(payload);
      onFinished();
    } catch {
      // Handled by react-query error callbacks
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) return;
    await deleteQuiz.mutateAsync({ id: quiz.id });
    setShowDeleteConfirm(false);
    onFinished();
  };

  const isSubmitting = upsertQuizStructure.isPending;

  return (
    <Card className="border border-border bg-card/60 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
      <CardHeader className="py-3 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-card-foreground">
            {quiz ? "Cập nhật bài tập trắc nghiệm" : "Tạo bài tập trắc nghiệm"}
          </CardTitle>
        </div>
        {quiz && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteQuiz.isPending}
            className="h-7 text-[10px] font-bold px-3"
          >
            XÓA BÀI TẬP
          </Button>
        )}
      </CardHeader>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài tập</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài tập này? Hành động này sẽ xóa toàn bộ câu hỏi và câu
              trả lời, không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuiz} disabled={deleteQuiz.isPending}>
              {deleteQuiz.isPending ? "Đang xóa..." : "Xóa bài tập"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quiz Title & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Tiêu đề bài tập *
              </Label>
              <Input
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Ví dụ: Quiz: Grammar checkpoint 1"
                className="text-xs focus:ring-emerald-500/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Trạng thái (Status)
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-8 w-full border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm transition-colors outline-none focus-visible:border-emerald-500/50 focus-visible:ring-1 focus-visible:ring-emerald-500/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="draft">DRAFT (Bản nháp)</option>
                <option value="published">PUBLISHED (Xuất bản)</option>
                <option value="archived">ARCHIVED (Lưu trữ)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-muted-foreground">
                Câu hỏi ({questions.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuestion}
                className="h-7 text-[10px] font-bold"
              >
                <Plus className="h-3 w-3 mr-1" />
                Thêm câu hỏi
              </Button>
            </div>

            {questions.length === 0 && (
              <div className="p-4 border border-dashed border-border text-center rounded-md">
                <p className="text-xs text-muted-foreground italic">
                  Chưa có câu hỏi nào. Nhấn &ldquo;Thêm câu hỏi&rdquo; để bắt đầu.
                </p>
              </div>
            )}

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  onUpdate={(updated) => updateQuestion(index, updated)}
                  onRemove={() => removeQuestion(index)}
                  canRemove={questions.length > 1}
                />
              ))}
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="p-3 border border-destructive/30 bg-destructive/10 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium">{validationError}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onFinished}
              className="font-bold text-xs"
            >
              HỦY
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
            >
              {isSubmitting
                ? "ĐANG LƯU..."
                : quiz
                ? "CẬP NHẬT BÀI TẬP"
                : "TẠO BÀI TẬP"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
