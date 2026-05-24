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
    <div className="border border-border bg-card rounded-md p-3 space-y-3 shadow-sm hover:border-emerald-500/30 transition-all duration-200">
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-bold uppercase text-muted-foreground">Câu {index + 1}</span>
        {hasCorrect ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        )}
      </div>
      {canRemove && (
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="h-7 px-2 text-[10px] text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa câu hỏi
        </Button>
      )}
    </div>
  );
};

AdminQuizQuestionCard.Body = function QuestionCardBody({ content, explanation, onChangeContent, onChangeExplanation }: any) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nội dung câu hỏi *</Label>
        <Input value={content} onChange={(e) => onChangeContent(e.target.value)} placeholder="Nhập nội dung câu hỏi..." className="text-xs" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Giải thích đáp án đúng (hiển thị sau khi học viên nộp bài)</Label>
        <Input value={explanation} onChange={(e) => onChangeExplanation(e.target.value)} placeholder="Nhập phần giải thích..." className="text-xs" />
      </div>
    </>
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
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Các lựa chọn đáp án (click biểu tượng để chọn đáp án đúng) *</Label>
      {answers.map((answer: any, answerIndex: number) => (
        <div key={answer.id} className="flex items-center gap-2">
          <button type="button" onClick={() => toggleCorrect(answerIndex)} className="shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors">
            {answer.isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />}
          </button>
          <Input value={answer.content} onChange={(e) => updateAnswer(answerIndex, e.target.value)} placeholder={`Đáp án ${String.fromCharCode(65 + answerIndex)}`} className="text-xs flex-1" />
          {answers.length > 2 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => removeAnswer(answerIndex)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
          )}
        </div>
      ))}
      {answers.length < 6 && (
        <Button type="button" variant="outline" size="sm" onClick={addAnswer} className="h-7 text-[10px] font-bold w-full border-dashed"><Plus className="h-3 w-3 mr-1" /> Thêm lựa chọn đáp án</Button>
      )}
    </div>
  );
};
