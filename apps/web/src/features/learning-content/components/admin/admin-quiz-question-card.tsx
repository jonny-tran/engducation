"use client";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Label } from "@engducation/ui/components/label";
import { Plus, Trash2, GripVertical, CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { createEmptyAnswer } from "../../hooks/use-admin-quiz-builder";
import type { FormQuestion } from "../../hooks/use-admin-quiz-builder";

interface AdminQuizQuestionCardProps {
  question: FormQuestion;
  index: number;
  onUpdate: (updated: FormQuestion) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function AdminQuizQuestionCard({
  question,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: AdminQuizQuestionCardProps) {
  return (
    <div className="border border-muted/50 dark:border-muted/30 bg-muted/20 dark:bg-muted/5 rounded-2xl p-5 space-y-4.5 shadow-xs hover:shadow-md transition-all duration-300 relative group">
      <AdminQuizQuestionCard.Header
        index={index}
        hasCorrect={question.answers.some((a: any) => a.isCorrect)}
        canRemove={canRemove}
        onRemove={onRemove}
      />
      <AdminQuizQuestionCard.Body
        content={question.content}
        explanation={question.explanation}
        onChangeContent={(content: string) => onUpdate({ ...question, content })}
        onChangeExplanation={(explanation: string) => onUpdate({ ...question, explanation })}
      />
      <AdminQuizQuestionCard.AnswersList
        answers={question.answers}
        onUpdateAnswers={(answers: any[]) => onUpdate({ ...question, answers })}
      />
    </div>
  );
}

// ── SUBCOMPONENTS (Dot Notation namespaces) ──────────────────────────

AdminQuizQuestionCard.Header = function QuestionCardHeader({ index, hasCorrect, canRemove, onRemove }: any) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-muted/40 dark:border-muted/20">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/60 shrink-0 cursor-grab" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Câu {index + 1}</span>
        {hasCorrect ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 animate-pulse" />
        )}
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="absolute top-3 right-3 h-7 px-2.5 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 flex items-center justify-center p-0"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa câu hỏi
        </Button>
      )}
    </div>
  );
};

AdminQuizQuestionCard.Body = function QuestionCardBody({ content, explanation, onChangeContent, onChangeExplanation }: any) {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Nội dung câu hỏi <span className="text-rose-500">*</span></Label>
        <Input
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          placeholder="Nhập nội dung câu hỏi..."
          className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all duration-200"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Giải thích đáp án đúng (hiển thị sau khi học viên nộp bài)</Label>
        <Input
          value={explanation}
          onChange={(e) => onChangeExplanation(e.target.value)}
          placeholder="Nhập phần giải thích chi tiết..."
          className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all duration-200"
        />
      </div>
    </div>
  );
};

AdminQuizQuestionCard.AnswersList = function QuestionCardAnswersList({ answers, onUpdateAnswers }: any) {
  const addAnswer = () => onUpdateAnswers([...answers, createEmptyAnswer()]);
  const removeAnswer = (idx: number) => {
    const next = answers.filter((_: any, i: number) => i !== idx);
    if (!next.some((a: any) => a.isCorrect) && next.length > 0) next[0].isCorrect = true;
    onUpdateAnswers(next);
  };
  const toggleCorrect = (idx: number) => onUpdateAnswers(answers.map((a: any, i: number) => ({ ...a, isCorrect: i === idx ? !a.isCorrect : a.isCorrect })));
  const updateAnswer = (idx: number, content: string) => {
    const next = [...answers];
    next[idx] = { ...next[idx], content };
    onUpdateAnswers(next);
  };

  return (
    <div className="space-y-3 pt-2">
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 block">
        Các lựa chọn đáp án (click biểu tượng để chọn đáp án đúng) <span className="text-rose-500">*</span>
      </Label>
      
      <div className="space-y-2.5">
        {answers.map((answer: any, answerIndex: number) => (
          <div
            key={answer.id}
            className="flex items-center gap-2.5 p-2 bg-background/50 hover:bg-muted/15 dark:hover:bg-muted/5 border border-muted/40 rounded-xl transition-all duration-200 group/choice"
          >
            <button
              type="button"
              onClick={() => toggleCorrect(answerIndex)}
              className="shrink-0 text-muted-foreground/50 hover:text-emerald-500 transition-colors active:scale-90"
            >
              {answer.isCorrect ? (
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4.5 w-4.5 shrink-0" />
              )}
            </button>
            <Input
              value={answer.content}
              onChange={(e) => updateAnswer(answerIndex, e.target.value)}
              placeholder={`Đáp án ${String.fromCharCode(65 + answerIndex)}`}
              className="h-8.5 text-xs flex-1 rounded-lg border-muted/50 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all"
            />
            {answers.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAnswer(answerIndex)}
                className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover/choice:opacity-100 scale-90 group-hover/choice:scale-100 transition-all duration-200 flex items-center justify-center shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {answers.length < 6 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAnswer}
          className="h-8 text-[10px] font-bold w-full border-dashed border-2 border-muted-foreground/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-muted-foreground hover:text-emerald-600 rounded-xl flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Thêm lựa chọn đáp án
        </Button>
      )}
    </div>
  );
};
