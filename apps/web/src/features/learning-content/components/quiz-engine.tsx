"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useStudentLearning } from "../hooks/use-student-learning";
import { Button } from "@engducation/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";

interface QuizEngineProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}

interface SelectedAnswerState {
  questionId: string;
  selectedOption: "A" | "B" | "C" | "D";
}

export function QuizEngine({ courseId, lessonId, lessonTitle, onClose }: QuizEngineProps) {
  const { submitQuiz } = useStudentLearning(courseId);

  // Fetch the quiz for this lesson
  const {
    data: quizData,
    isLoading: isQuizLoading,
    error: quizError,
  } = useQuery(trpc.user.getQuiz.queryOptions({ lessonId }));

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswerState[]>([]);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // Reset states when lesson changes
  useEffect(() => {
    setSelectedAnswers([]);
    setQuizResult(null);
  }, [lessonId]);

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
        lessonId,
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
        Đang tải bài trắc nghiệm củng cố của bài học...
      </div>
    );
  }

  if (quizError) {
    return (
      <Card className="border border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-none p-4 text-xs text-center space-y-2">
        <p className="font-bold">Không tìm thấy bài tập trắc nghiệm cho bài học này.</p>
        <p className="text-[10px] text-red-500 font-mono">Chi tiết: {quizError.message}</p>
        <Button variant="outline" onClick={onClose} className="rounded-none border-red-300 text-xs h-7 py-1 px-3 mt-1">
          Quay lại bài học
        </Button>
      </Card>
    );
  }

  if (!quizData) {
    return (
      <div className="p-4 text-xs italic text-slate-500 text-center">
        Không có dữ liệu bài tập trắc nghiệm.
      </div>
    );
  }

  return (
    <Card className="border-2 border-slate-900 dark:border-slate-100 rounded-none bg-white dark:bg-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
      <CardHeader className="py-3.5 border-b-2 border-slate-900 dark:border-slate-800 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Bài tập: {quizData.title}
          </CardTitle>
          <div className="text-[10px] text-slate-400 mt-1">Gắn với bài học: {lessonTitle}</div>
        </div>
        <Button
          variant="outline"
          onClick={onClose}
          className="rounded-none border-slate-300 dark:border-slate-700 text-xs h-7 py-0 px-2.5 font-bold"
        >
          QUAY LẠI HỌC 📖
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-5 text-xs">
        {quizResult ? (
          /* DISPLAY EVALUATION BREAKDOWN BOX BELOW THE FORM */
          <div className="space-y-4">
            {/* Grade summary card */}
            <div className={`p-4 border-2 border-slate-900 dark:border-slate-100 rounded-none flex items-center justify-between ${quizResult.passed ? 'bg-green-50/50 dark:bg-green-950/20' : 'bg-amber-50/50 dark:bg-amber-950/20'}`}>
              <div className="space-y-1">
                <div className="text-sm font-bold uppercase tracking-wide">
                  Kết quả: {quizResult.passed ? "👉 ĐÃ HOÀN THÀNH" : "👉 CHƯA ĐẠT"}
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Bạn trả lời đúng {quizResult.correctCount}/{quizResult.totalQuestions} câu hỏi.
                  Điểm số đạt được: <span className="font-bold font-mono text-xs">{quizResult.score}/100</span>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  (Yêu cầu vượt qua: 70 điểm)
                </div>
              </div>
              <span className="text-3xl">{quizResult.passed ? "🎉" : "😭"}</span>
            </div>

            {/* Answer details list */}
            <div className="space-y-3">
              <div className="font-bold uppercase text-slate-500 text-[10px] tracking-wider">Chi tiết sửa bài chi tiết từ Server</div>
              {quizResult.results.map((res: any, idx: number) => {
                const questionDetail = quizData.questions.find((q) => q.id === res.questionId);
                return (
                  <div key={res.questionId} className={`p-3 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2`}>
                    <div className="font-bold flex items-start gap-1.5">
                      <span>Câu {idx + 1}:</span>
                      <span>{questionDetail?.content}</span>
                    </div>

                    {/* Breakdown details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                      <div className={`p-2 border ${res.isCorrect ? 'border-green-300 bg-green-50/50 text-green-700 dark:bg-green-950/10 dark:text-green-400' : 'border-red-300 bg-red-50/50 text-red-700 dark:bg-red-950/10 dark:text-red-400'} text-[11px]`}>
                        Lựa chọn của bạn: <span className="font-bold">{res.selectedOption}</span>
                        {res.isCorrect ? " (Chính xác!)" : " (Sai)"}
                      </div>
                      <div className="p-2 border border-green-300 bg-green-50/50 text-green-700 dark:bg-green-950/10 dark:text-green-400 text-[11px] font-medium">
                        Đáp án đúng từ server: <span className="font-bold">{res.correctOption}</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    {res.explanation && (
                      <div className="text-[11.px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 border-l-2 border-indigo-500 italic mt-2.5 leading-relaxed">
                        <span className="font-bold text-[10px] uppercase text-indigo-500 not-italic block mb-0.5">Lời giải & Giải thích của giáo viên:</span>
                        "{res.explanation}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" onClick={handleRetake} className="rounded-none border-slate-300 font-bold">
                LÀM LẠI BÀI (RETAKE) 🔄
              </Button>
              <Button onClick={onClose} className="rounded-none bg-slate-950 text-white hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-950 font-bold">
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
                  <div key={q.id} className="p-4 border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
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
                            className={`flex items-center gap-2.5 p-2.5 border transition-all cursor-pointer select-none text-[11px] ${
                              isChecked
                                ? "border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-950 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                                : "border-slate-200 hover:border-slate-400 bg-white dark:bg-slate-950 dark:border-slate-800"
                            }`}
                          >
                            {/* 🔒 ANTI-CHEAT: Absolutely NO answer UUID bound to value input, only the safe string literal index letter "A","B","C","D" */}
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              value={letter}
                              checked={isChecked}
                              onChange={() => handleOptionChange(q.id, letter)}
                              className="h-4 w-4 text-slate-900 focus:ring-0"
                            />
                            <span className="font-mono font-bold text-slate-500">{letter}.</span>
                            <span>{ans.content}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-none border-slate-300 font-bold">
                BỎ QUA (CANCEL)
              </Button>
              <Button
                type="submit"
                disabled={submitQuiz.isPending}
                className="rounded-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 px-5"
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
