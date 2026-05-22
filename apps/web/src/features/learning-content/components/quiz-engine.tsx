"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useStudentLearning } from "../hooks/use-student-learning";
import { Button } from "@engducation/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";

interface QuizEngineProps {
  courseId: string;
  quizId: string;
  quizTitle: string;
  onClose: () => void;
}

interface SelectedAnswerState {
  questionId: string;
  selectedOption: "A" | "B" | "C" | "D";
}

export function QuizEngine({ courseId, quizId, quizTitle, onClose }: QuizEngineProps) {
  const { submitQuiz } = useStudentLearning(courseId);

  // Fetch the quiz by quizId
  const {
    data: quizData,
    isLoading: isQuizLoading,
    error: quizError,
  } = useQuery(trpc.user.getQuiz.queryOptions({ quizId }));

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswerState[]>([]);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // Reset states when quiz changes
  useEffect(() => {
    setSelectedAnswers([]);
    setQuizResult(null);
  }, [quizId]);

  const handleOptionChange = (questionId: string, option: "A" | "B" | "C" | "D") => {
    setSelectedAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, { questionId, selectedOption: option }];
    });
  };

  const getSelectedOptionForQuestion = (questionId: string): "A" | "B" | "C" | "D" | undefined => {
    return selectedAnswers.find((a) => a.questionId === questionId)?.selectedOption;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quizData) return;

    if (selectedAnswers.length < quizData.questions.length) {
      if (!confirm("Bạn chưa trả lời hết các câu hỏi. Bạn vẫn muốn nộp bài chứ?")) {
        return;
      }
    }

    try {
      const data = await submitQuiz.mutateAsync({
        quizId,
        answers: selectedAnswers,
      });
      setQuizResult(data);
    } catch (err) {
      // Errors handled inside the custom hook
    }
  };

  const handleRetake = () => {
    setSelectedAnswers([]);
    setQuizResult(null);
  };

  if (isQuizLoading) {
    return (
      <div className="p-4 text-xs italic text-slate-500 text-center animate-pulse">
        Đang tải bài tập trắc nghiệm...
      </div>
    );
  }

  if (quizError) {
    return (
      <Card className="border border-destructive bg-destructive/10 text-destructive dark:bg-destructive/20 p-4 text-xs text-center space-y-2 rounded-md">
        <p className="font-bold">Không tìm thấy bài tập trắc nghiệm này.</p>
        <p className="text-[10px] text-destructive font-mono">Chi tiết: {quizError.message}</p>
        <Button variant="destructive" onClick={onClose} size="sm" className="mt-1">
          Quay lại học
        </Button>
      </Card>
    );
  }

  if (!quizData) {
    return (
      <div className="p-4 text-xs italic text-muted-foreground text-center">
        Không có dữ liệu bài tập trắc nghiệm.
      </div>
    );
  }

  return (
    <Card className="border border-border rounded-md bg-card">
      <CardHeader className="py-3.5 border-b border-border flex flex-row items-center justify-between bg-muted/20">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
            Bài tập: {quizData.title}
          </CardTitle>
          <div className="text-[10px] text-muted-foreground mt-1">Bài tập trắc nghiệm: {quizTitle}</div>
        </div>
        <Button
          variant="outline"
          onClick={onClose}
          size="sm"
          className="font-bold"
        >
          QUAY LẠI HỌC 📖
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-5 text-xs text-foreground">
        {quizResult ? (
          /* DISPLAY EVALUATION BREAKDOWN BOX BELOW THE FORM */
          <div className="space-y-4">
            {/* Grade summary card */}
            <div className={`p-4 border rounded-md flex items-center justify-between ${
              quizResult.passed 
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
            }`}>
              <div className="space-y-1">
                <div className="text-sm font-bold uppercase tracking-wide">
                  Kết quả: {quizResult.passed ? "👉 ĐÃ HOÀN THÀNH" : "👉 CHƯA ĐẠT"}
                </div>
                <div className="text-[11px] leading-relaxed opacity-90">
                  Bạn trả lời đúng {quizResult.correctCount}/{quizResult.totalQuestions} câu hỏi.
                  Điểm số đạt được: <span className="font-bold font-mono text-xs">{quizResult.score}/100</span>
                </div>
                <div className="text-[10px] opacity-75 italic">
                  (Yêu cầu vượt qua: 70 điểm)
                </div>
              </div>
              <span className="text-3xl">{quizResult.passed ? "🎉" : "😭"}</span>
            </div>

            {/* Answer details list */}
            <div className="space-y-3">
              <div className="font-bold uppercase text-muted-foreground text-[10px] tracking-wider">Chi tiết sửa bài chi tiết từ Server</div>
              {quizResult.results.map((res: any, idx: number) => {
                const questionDetail = quizData.questions.find((q) => q.id === res.questionId);
                return (
                  <div key={res.questionId} className="p-3 border border-border bg-card rounded-md space-y-2">
                    <div className="font-bold flex items-start gap-1.5 text-foreground">
                      <span>Câu {idx + 1}:</span>
                      <span>{questionDetail?.content}</span>
                    </div>

                    {/* Breakdown details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                      <div className={`p-2 border rounded-md ${
                        res.isCorrect 
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                          : 'border-destructive/30 bg-destructive/10 text-destructive'
                      } text-[11px]`}>
                        Lựa chọn của bạn: <span className="font-bold">{res.selectedOption}</span>
                        {res.isCorrect ? " (Chính xác!)" : " (Sai)"}
                      </div>
                      <div className="p-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium rounded-md">
                        Đáp án đúng từ server: <span className="font-bold">{res.correctOption}</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    {res.explanation && (
                      <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 border-l-2 border-primary italic mt-2.5 leading-relaxed rounded-r-md">
                        <span className="font-bold text-[10px] uppercase text-primary not-italic block mb-0.5">Lời giải & Giải thích của giáo viên:</span>
                        "{res.explanation}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={handleRetake} className="font-bold">
                LÀM LẠI BÀI (RETAKE) 🔄
              </Button>
              <Button onClick={onClose} variant="default" className="font-bold">
                HOÀN THÀNH QUIZ
              </Button>
            </div>
          </div>
        ) : (
          /* ACTIVE QUIZ ENGINE FORM */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {quizData.questions.map((q, qIdx) => {
                const selected = getSelectedOptionForQuestion(q.id);
                const letters = ["A", "B", "C", "D"] as const;

                return (
                  <div key={q.id} className="p-4 border border-border bg-muted/20 rounded-md space-y-3">
                    <div className="font-bold text-foreground">
                      Câu {qIdx + 1}: {q.content}
                    </div>

                    {/* Loop through answers mapped explicitly to letters A, B, C, D */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-2.5">
                      {q.answers.map((ans, aIdx) => {
                        const letter = letters[aIdx]!;
                        const isChecked = selected === letter;

                        return (
                          <label
                            key={ans.id}
                            className={`flex items-center gap-2.5 p-2.5 border border-border transition-all cursor-pointer select-none text-[11px] rounded-md ${
                              isChecked
                                ? "border-primary bg-accent text-accent-foreground font-bold"
                                : "hover:bg-accent/50 hover:text-accent-foreground bg-card text-card-foreground"
                            }`}
                          >
                            {/* 🔒 ANTI-CHEAT: Absolutely NO answer UUID bound to value input, only the safe string literal index letter "A","B","C","D" */}
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              value={letter}
                              checked={isChecked}
                              onChange={() => handleOptionChange(q.id, letter)}
                              className="h-4 w-4 text-primary focus:ring-0 accent-primary"
                            />
                            <span className="font-mono font-bold text-muted-foreground">{letter}.</span>
                            <span>{ans.content}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} className="font-bold">
                BỎ QUA (CANCEL)
              </Button>
              <Button
                type="submit"
                disabled={submitQuiz.isPending}
                variant="default"
                size="lg"
                className="font-bold"
              >
                {submitQuiz.isPending ? "ĐANG CHẤM ĐIỂM..." : "NỘP BÀI TẬP (SUBMIT ANSWERS) 🚀"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
