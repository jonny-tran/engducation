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
import { Plus, CheckCircle2, AlertTriangle } from "lucide-react";

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
            disabled={isDeleting}
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
            <AlertDialogAction onClick={handleDeleteQuiz} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xóa bài tập"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quiz Title */}
          <div className="flex flex-col gap-1.5">
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
