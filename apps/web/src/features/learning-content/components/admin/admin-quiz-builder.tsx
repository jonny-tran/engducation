"use client";
import { useAdminQuizBuilder } from "../../hooks/use-admin-quiz-builder";
import { AdminQuizQuestionCard } from "./admin-quiz-question-card";
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
import { Plus, AlertTriangle, Sparkles, BookOpen, Trash2, HelpCircle, Loader2 } from "lucide-react";

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

export function AdminQuizBuilder({ courseId, moduleId, quiz, onFinished }: AdminQuizBuilderProps) {
  const {
    quizTitle,
    setQuizTitle,
    questions,
    validationError,
    showDeleteConfirm,
    setShowDeleteConfirm,
    updateQuestion,
    addQuestion,
    removeQuestion,
    handleSubmit,
    handleDeleteQuiz,
    isSubmitting,
    isDeleting,
  } = useAdminQuizBuilder({ courseId, moduleId, quiz, onFinished });

  return (
    <Card className="border border-muted/60 dark:border-muted/30 bg-gradient-to-b from-card to-muted/10 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300 rounded-2xl">
      <CardHeader className="py-4.5 px-6 border-b border-muted/40 dark:border-muted/20 bg-muted/20 dark:bg-muted/10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-card-foreground">
              {quiz ? "Cập nhật bài tập trắc nghiệm" : "Tạo bài tập trắc nghiệm"}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
              {quiz ? "Chỉnh sửa tiêu đề, danh sách câu hỏi và đáp án đúng" : "Xây dựng ngân hàng câu hỏi ôn tập nhanh cho học viên"}
            </p>
          </div>
        </div>
        {quiz && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="h-8 text-[10px] font-bold px-4 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            XÓA BÀI TẬP
          </Button>
        )}
      </CardHeader>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl border border-border/80 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold uppercase">Xóa bài tập trắc nghiệm</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground mt-2">
              Bạn có chắc chắn muốn xóa bài tập này? Hành động này sẽ xóa toàn bộ câu hỏi và câu
              trả lời đi kèm, không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl h-9 text-xs font-bold" onClick={() => setShowDeleteConfirm(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl h-9 text-xs font-bold bg-destructive hover:bg-destructive"
              onClick={handleDeleteQuiz}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa bài tập"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid grid-cols-1 gap-6">

            {/* Bento Box 1: Core details */}
            <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-muted/40 dark:border-muted/20">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
                  Cấu hình chung
                </h3>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quiz-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Tiêu đề bài tập <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="quiz-title"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Ví dụ: Quiz: Grammar checkpoint 1"
                  className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Bento Box 2: Questions List */}
            <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-muted/40 dark:border-muted/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
                    Danh sách câu hỏi ({questions.length})
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                  className="h-8 text-[10px] font-bold border-dashed border-2 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-muted-foreground hover:text-emerald-600 rounded-xl px-3 transition-all flex items-center gap-1 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm câu hỏi
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="p-8 border border-dashed border-muted-foreground/20 text-center rounded-xl bg-muted/5">
                  <p className="text-xs text-muted-foreground italic font-medium">
                    Chưa có câu hỏi nào trong danh sách. Hãy nhấn "Thêm câu hỏi" để bắt đầu.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-500/20">
                  {questions.map((question, index) => (
                    <AdminQuizQuestionCard
                      key={question.id}
                      question={question}
                      index={index}
                      onUpdate={(updated) => updateQuestion(index, updated)}
                      onRemove={() => removeQuestion(index)}
                      canRemove={questions.length > 1}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="p-3.5 border border-rose-500/20 bg-rose-500/5 rounded-xl flex items-center gap-2.5 shadow-xs">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 animate-bounce" />
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{validationError}</p>
            </div>
          )}

          {/* Submit */}
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
              className="h-9 text-xs font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-md px-5 active:scale-95 transition-all duration-200 hover:shadow-emerald-500/20 hover:shadow-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ĐANG LƯU...
                </div>
              ) : quiz ? (
                "CẬP NHẬT BÀI TẬP"
              ) : (
                "TẠO BÀI TẬP"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
