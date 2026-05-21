"use client";
import { useState } from "react";
import { useQuizMutations } from "../hooks/use-quiz-mutations";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";

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
  title: string;
  questions: QuestionData[];
}

interface LessonData {
  id: string;
  title: string;
  quiz?: QuizData | null;
}

interface AdminQuizBuilderProps {
  courseId: string;
  lesson: LessonData;
}

export function AdminQuizBuilder({ courseId, lesson }: AdminQuizBuilderProps) {
  const { upsertQuizStructure, createQuizQuestion, deleteQuiz } = useQuizMutations(courseId);

  // Form State
  const [quizTitle, setQuizTitle] = useState(`Bài tập củng cố: ${lesson.title}`);
  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [ansA, setAnsA] = useState("");
  const [ansB, setAnsB] = useState("");
  const [ansC, setAnsC] = useState("");
  const [ansD, setAnsD] = useState("");
  const [correctLetter, setCorrectLetter] = useState<"A" | "B" | "C" | "D">("A");

  const existingQuiz = lesson.quiz;

  const resetForm = () => {
    setQuestionText("");
    setExplanation("");
    setAnsA("");
    setAnsB("");
    setAnsC("");
    setAnsD("");
    setCorrectLetter("A");
  };

  const handleInitializeQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim() || !questionText.trim() || !ansA.trim() || !ansB.trim() || !ansC.trim() || !ansD.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin tiêu đề, câu hỏi và 4 đáp án!");
      return;
    }

    const qId = crypto.randomUUID();
    const aId = crypto.randomUUID();
    const bId = crypto.randomUUID();
    const cId = crypto.randomUUID();
    const dId = crypto.randomUUID();

    const payload = {
      lessonId: lesson.id,
      title: quizTitle,
      questions: [
        {
          id: qId,
          content: questionText,
          explanation: explanation || undefined,
          order: 1,
          answers: [
            { id: aId, content: ansA, isCorrect: correctLetter === "A" },
            { id: bId, content: ansB, isCorrect: correctLetter === "B" },
            { id: cId, content: ansC, isCorrect: correctLetter === "C" },
            { id: dId, content: ansD, isCorrect: correctLetter === "D" },
          ],
        },
      ],
    };

    await upsertQuizStructure.mutateAsync(payload);
    resetForm();
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingQuiz) return;
    if (!questionText.trim() || !ansA.trim() || !ansB.trim() || !ansC.trim() || !ansD.trim()) {
      alert("Vui lòng điền nội dung câu hỏi và cả 4 đáp án!");
      return;
    }

    const qId = crypto.randomUUID();
    const aId = crypto.randomUUID();
    const bId = crypto.randomUUID();
    const cId = crypto.randomUUID();
    const dId = crypto.randomUUID();

    const nextOrder = existingQuiz.questions.length + 1;

    const payload = {
      quizId: existingQuiz.id,
      content: questionText,
      explanation: explanation || undefined,
      order: nextOrder,
      answers: [
        { id: aId, content: ansA, isCorrect: correctLetter === "A" },
        { id: bId, content: ansB, isCorrect: correctLetter === "B" },
        { id: cId, content: ansC, isCorrect: correctLetter === "C" },
        { id: dId, content: ansD, isCorrect: correctLetter === "D" },
      ],
    };

    await createQuizQuestion.mutateAsync(payload);
    resetForm();
  };

  const handleDeleteQuiz = async () => {
    if (!existingQuiz) return;
    if (confirm("Bạn có chắc chắn muốn xóa bài tập này? Hành động này sẽ xóa toàn bộ câu hỏi và câu trả lời.")) {
      await deleteQuiz.mutateAsync({ id: existingQuiz.id });
    }
  };

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="py-3 border-b border-border flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-card-foreground">
          Thiết lập Bài tập: {lesson.title}
        </CardTitle>
        {existingQuiz && (
          <Button
            variant="destructive"
            onClick={handleDeleteQuiz}
            disabled={deleteQuiz.isPending}
            className="h-7 text-[10px] font-bold px-3"
          >
            XÓA BÀI TẬP (DELETE)
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {existingQuiz ? (
          /* QUIZ EXISTS - DISPLAY QUESTIONS AND ADD FORM */
          <div className="space-y-4 text-xs">
            <div className="p-3 border border-border bg-muted/20 rounded-md">
              <div className="font-bold text-sm text-foreground">
                Tiêu đề Quiz: <span className="font-mono text-xs">{existingQuiz.title}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">Quiz ID: {existingQuiz.id}</div>
            </div>

            {/* List current questions */}
            <div className="space-y-2.5">
              <div className="font-bold uppercase text-muted-foreground">Các câu hỏi hiện tại ({existingQuiz.questions.length})</div>
              {existingQuiz.questions.map((q, idx) => (
                <div key={q.id} className="p-3 border border-border bg-card space-y-1 rounded-md">
                  <div className="font-bold text-foreground">
                    Câu {q.order}: {q.content}
                  </div>
                  {q.explanation && (
                    <div className="text-[10px] text-muted-foreground bg-muted p-1 border-l-2 border-primary rounded-r-md">
                      Giải thích: {q.explanation}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-2 pl-2">
                    {q.answers.map((a, i) => {
                      const letters = ["A", "B", "C", "D"];
                      return (
                        <div key={a.id} className={`p-1.5 border rounded-md ${a.isCorrect ? 'border-emerald-500 bg-emerald-50/10 text-emerald-600 dark:text-emerald-400' : 'border-border text-muted-foreground'} text-[11px]`}>
                          <span className="font-bold mr-1">{letters[i]}.</span> {a.content}
                          {a.isCorrect && <span className="font-bold ml-1 text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">[ĐÚNG]</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Add question form */}
            <form onSubmit={handleAddQuestion} className="border border-border p-4 bg-muted/10 space-y-3 rounded-md">
              <div className="font-bold text-xs uppercase border-b border-border pb-1.5 text-foreground">
                Thêm câu hỏi mới vào Quiz
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold uppercase text-muted-foreground text-[10px]">Nội dung câu hỏi *</label>
                <Input
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="focus-visible:ring-1 text-xs bg-background"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold uppercase text-muted-foreground text-[10px]">Giải thích đáp án đúng</label>
                <Input
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Nhập phần giải thích sau khi học viên nộp bài..."
                  className="focus-visible:ring-1 text-xs bg-background"
                />
              </div>

              {/* Answers Grid */}
              <div className="space-y-2">
                <label className="font-bold uppercase text-muted-foreground text-[10px]">4 lựa chọn đáp án & Chọn đáp án đúng *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 border border-border p-1.5 bg-background rounded-md">
                    <input
                      type="radio"
                      name="correctLetter"
                      checked={correctLetter === "A"}
                      onChange={() => setCorrectLetter("A")}
                      className="h-3.5 w-3.5 accent-primary text-primary focus:ring-0"
                    />
                    <span className="font-bold w-4 text-foreground">A.</span>
                    <Input
                      required
                      value={ansA}
                      onChange={(e) => setAnsA(e.target.value)}
                      placeholder="Đáp án A"
                      className="focus-visible:ring-1 h-7 text-xs flex-1 bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2 border border-border p-1.5 bg-background rounded-md">
                    <input
                      type="radio"
                      name="correctLetter"
                      checked={correctLetter === "B"}
                      onChange={() => setCorrectLetter("B")}
                      className="h-3.5 w-3.5 accent-primary text-primary focus:ring-0"
                    />
                    <span className="font-bold w-4 text-foreground">B.</span>
                    <Input
                      required
                      value={ansB}
                      onChange={(e) => setAnsB(e.target.value)}
                      placeholder="Đáp án B"
                      className="focus-visible:ring-1 h-7 text-xs flex-1 bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2 border border-border p-1.5 bg-background rounded-md">
                    <input
                      type="radio"
                      name="correctLetter"
                      checked={correctLetter === "C"}
                      onChange={() => setCorrectLetter("C")}
                      className="h-3.5 w-3.5 accent-primary text-primary focus:ring-0"
                    />
                    <span className="font-bold w-4 text-foreground">C.</span>
                    <Input
                      required
                      value={ansC}
                      onChange={(e) => setAnsC(e.target.value)}
                      placeholder="Đáp án C"
                      className="focus-visible:ring-1 h-7 text-xs flex-1 bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2 border border-border p-1.5 bg-background rounded-md">
                    <input
                      type="radio"
                      name="correctLetter"
                      checked={correctLetter === "D"}
                      onChange={() => setCorrectLetter("D")}
                      className="h-3.5 w-3.5 accent-primary text-primary focus:ring-0"
                    />
                    <span className="font-bold w-4 text-foreground">D.</span>
                    <Input
                      required
                      value={ansD}
                      onChange={(e) => setAnsD(e.target.value)}
                      placeholder="Đáp án D"
                      className="focus-visible:ring-1 h-7 text-xs flex-1 bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={createQuizQuestion.isPending}
                  className="font-bold text-xs"
                >
                  {createQuizQuestion.isPending ? "ĐANG THÊM CÂU HỎI..." : "THÊM CÂU HỎI (CREATE)"}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* NO QUIZ - INITIALIZE QUIZ FORM */
          <form onSubmit={handleInitializeQuiz} className="space-y-4 text-xs">
            <div className="p-3 border border-amber-200/50 bg-amber-50/10 text-amber-600 dark:text-amber-400 rounded-md">
              Bài học này hiện chưa có bài tập (Quiz). Vui lòng đặt tiêu đề Quiz và tạo câu hỏi đầu tiên để khởi tạo!
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase text-muted-foreground">Tiêu đề bài tập *</label>
              <Input
                required
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Nhập tiêu đề Quiz..."
                className="focus-visible:ring-1 text-xs"
              />
            </div>

            <div className="border border-border p-4 bg-muted/10 space-y-3 rounded-md">
              <div className="font-bold text-xs uppercase border-b border-border pb-1.5 text-foreground">
                Câu hỏi đầu tiên
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold uppercase text-muted-foreground text-[10px]">Nội dung câu hỏi *</label>
                <Input
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="focus-visible:ring-1 text-xs bg-background"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold uppercase text-muted-foreground text-[10px]">Giải thích đáp án đúng</label>
                <Input
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Giải thích lý do đúng/sai..."
                  className="focus-visible:ring-1 text-xs bg-background"
                />
              </div>

              {/* Answers Grid */}
              <div className="space-y-2">
                <label className="font-bold uppercase text-muted-foreground text-[10px]">4 lựa chọn đáp án & Chọn đáp án đúng *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 border border-border p-1.5 bg-background rounded-md">
                    <input
                      type="radio"
                      name="correctLetter"
                      checked={correctLetter === "A"}
                      onChange={() => setCorrectLetter("A")}
                      className="h-3.5 w-3.5 accent-primary text-primary focus:ring-0"
                    />
                    <span className="font-bold w-4 text-foreground">A.</span>
                    <Input
                      required
                      value={ansA}
                      onChange={(e) => setAnsA(e.target.value)}
                      placeholder="Đáp án A"
                      className="focus-visible:ring-1 h-7 text-xs flex-1 bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2 border border-border p-1.5 bg-background rounded-md">
                    <input
                      type="radio"
                      name="correctLetter"
                      checked={correctLetter === "B"}
                      onChange={() => setCorrectLetter("B")}
                      className="h-3.5 w-3.5 accent-primary text-primary focus:ring-0"
                    />
                    <span className="font-bold w-4 text-foreground">B.</span>
                    <Input
                      required
                      value={ansB}
                      onChange={(e) => setAnsB(e.target.value)}
                      placeholder="Đáp án B"
                      className="focus-visible:ring-1 h-7 text-xs flex-1 bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2 border border-border p-1.5 bg-background rounded-md">
                    <input
                      type="radio"
                      name="correctLetter"
                      checked={correctLetter === "C"}
                      onChange={() => setCorrectLetter("C")}
                      className="h-3.5 w-3.5 accent-primary text-primary focus:ring-0"
                    />
                    <span className="font-bold w-4 text-foreground">C.</span>
                    <Input
                      required
                      value={ansC}
                      onChange={(e) => setAnsC(e.target.value)}
                      placeholder="Đáp án C"
                      className="focus-visible:ring-1 h-7 text-xs flex-1 bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2 border border-border p-1.5 bg-background rounded-md">
                    <input
                      type="radio"
                      name="correctLetter"
                      checked={correctLetter === "D"}
                      onChange={() => setCorrectLetter("D")}
                      className="h-3.5 w-3.5 accent-primary text-primary focus:ring-0"
                    />
                    <span className="font-bold w-4 text-foreground">D.</span>
                    <Input
                      required
                      value={ansD}
                      onChange={(e) => setAnsD(e.target.value)}
                      placeholder="Đáp án D"
                      className="focus-visible:ring-1 h-7 text-xs flex-1 bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={upsertQuizStructure.isPending}
                className="font-bold text-xs"
              >
                {upsertQuizStructure.isPending ? "ĐANG KHỞI TẠO..." : "KHỞI TẠO BÀI TẬP & CÂU HỎI (UPSERT)"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
