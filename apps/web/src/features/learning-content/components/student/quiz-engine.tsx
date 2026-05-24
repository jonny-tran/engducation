"use client";
import { useQuizEngine } from "../../hooks/use-quiz-engine";
import { Button } from "@engducation/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";

interface QuizEngineProps {
  courseId: string;
  quizId: string;
  quizTitle: string;
  onClose: () => void;
}

export function QuizEngine({ courseId, quizId, quizTitle, onClose }: QuizEngineProps) {
  const {
    quizData, isQuizLoading, quizError, quizResult,
    handleOptionChange, getSelectedOptionForQuestion, handleSubmit, handleRetake, isSubmitting
  } = useQuizEngine({ courseId, quizId });

  if (isQuizLoading) return <QuizEngine.Loading />;
  if (quizError) return <QuizEngine.Error error={quizError} onClose={onClose} />;
  if (!quizData) return <div className="p-4 text-xs italic text-muted-foreground text-center">Không có dữ liệu bài tập trắc nghiệm.</div>;

  return (
    <Card className="border border-border rounded-md bg-card">
      <CardHeader className="py-3.5 border-b border-border flex flex-row items-center justify-between bg-muted/20">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Bài tập: {quizData.title}</CardTitle>
          <div className="text-[10px] text-muted-foreground mt-1">Bài tập trắc nghiệm: {quizTitle}</div>
        </div>
        <Button variant="outline" onClick={onClose} size="sm" className="font-bold">QUAY LẠI HỌC 📖</Button>
      </CardHeader>
      <CardContent className="p-4 space-y-5 text-xs text-foreground">
        {quizResult ? (
          <QuizEngine.Result result={quizResult} data={quizData} handleRetake={handleRetake} onClose={onClose} />
        ) : (
          <QuizEngine.Form
            data={quizData}
            getSelectedOption={getSelectedOptionForQuestion}
            onOptionChange={handleOptionChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onClose={onClose}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ── SUBCOMPONENTS (Dot Notation namespaces) ──────────────────────────

QuizEngine.Loading = function QuizLoading() {
  return <div className="p-4 text-xs italic text-slate-500 text-center animate-pulse">Đang tải bài tập trắc nghiệm...</div>;
};

QuizEngine.Error = function QuizError({ error, onClose }: any) {
  return (
    <Card className="border border-destructive bg-destructive/10 text-destructive p-4 text-xs text-center space-y-2 rounded-md">
      <p className="font-bold">Không tìm thấy bài tập trắc nghiệm này.</p>
      <p className="text-[10px] font-mono">Chi tiết: {error.message}</p>
      <Button variant="destructive" onClick={onClose} size="sm" className="mt-1">Quay lại học</Button>
    </Card>
  );
};

QuizEngine.Result = function QuizResult({ result, data, handleRetake, onClose }: any) {
  return (
    <div className="space-y-4">
      <div className={`p-4 border rounded-md flex items-center justify-between ${
        result.passed ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
      }`}>
        <div className="space-y-1">
          <div className="text-sm font-bold uppercase tracking-wide">Kết quả: {result.passed ? "👉 ĐÃ HOÀN THÀNH" : "👉 CHƯA ĐẠT"}</div>
          <div className="text-[11px] leading-relaxed opacity-90">Bạn trả lời đúng {result.correctCount}/{result.totalQuestions} câu hỏi. Điểm số: <span className="font-bold font-mono text-xs">{result.score}/100</span></div>
          <div className="text-[10px] opacity-75 italic">(Yêu cầu vượt qua: 70 điểm)</div>
        </div>
        <span className="text-3xl">{result.passed ? "🎉" : "😭"}</span>
      </div>
      <div className="space-y-3">
        <div className="font-bold uppercase text-muted-foreground text-[10px] tracking-wider">Chi tiết sửa bài chi tiết từ Server</div>
        {result.results.map((res: any, idx: number) => {
          const q = data.questions.find((item: any) => item.id === res.questionId);
          return (
            <div key={res.questionId} className="p-3 border border-border bg-card rounded-md space-y-2">
              <div className="font-bold flex items-start gap-1.5 text-foreground"><span>Câu {idx + 1}:</span><span>{q?.content}</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                <div className={`p-2 border rounded-md ${res.isCorrect ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-destructive/30 bg-destructive/10 text-destructive'} text-[11px]`}>Lựa chọn của bạn: <span className="font-bold">{res.selectedOption}</span>{res.isCorrect ? " (Chính xác!)" : " (Sai)"}</div>
                <div className="p-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium rounded-md">Đáp án đúng từ server: <span className="font-bold">{res.correctOption}</span></div>
              </div>
              {res.explanation && (
                <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 border-l-2 border-primary italic mt-2.5 leading-relaxed rounded-r-md">
                  <span className="font-bold text-[10px] uppercase text-primary not-italic block mb-0.5">Lời giải &amp; Giải thích của giáo viên:</span>"{res.explanation}"
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" onClick={handleRetake} className="font-bold">LÀM LẠI BÀI (RETAKE) 🔄</Button>
        <Button onClick={onClose} variant="default" className="font-bold">HOÀN THÀNH QUIZ</Button>
      </div>
    </div>
  );
};

QuizEngine.Form = function QuizForm({ data, getSelectedOption, onOptionChange, onSubmit, isSubmitting, onClose }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-4">
        {data.questions.map((q: any, qIdx: number) => {
          const selected = getSelectedOption(q.id);
          const letters = ["A", "B", "C", "D"] as const;
          return (
            <div key={q.id} className="p-4 border border-border bg-muted/20 rounded-md space-y-3">
              <div className="font-bold text-foreground">Câu {qIdx + 1}: {q.content}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-2.5">
                {q.answers.map((ans: any, aIdx: number) => {
                  const letter = letters[aIdx]!;
                  const isChecked = selected === letter;
                  return (
                    <label key={ans.id} className={`flex items-center gap-2.5 p-2.5 border border-border transition-all cursor-pointer select-none text-[11px] rounded-md ${
                      isChecked ? "border-primary bg-accent text-accent-foreground font-bold" : "hover:bg-accent/50 hover:text-accent-foreground bg-card text-card-foreground"
                    }`}>
                      <input type="radio" name={`question-${q.id}`} value={letter} checked={isChecked} onChange={() => onOptionChange(q.id, letter)} className="h-4 w-4 text-primary focus:ring-0 accent-primary" />
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
        <Button type="button" variant="outline" onClick={onClose} className="font-bold">BỎ QUA (CANCEL)</Button>
        <Button type="submit" disabled={isSubmitting} variant="default" size="lg" className="font-bold">{isSubmitting ? "ĐANG CHẤM ĐIỂM..." : "NỘP BÀI TẬP (SUBMIT ANSWERS) 🚀"}</Button>
      </div>
    </form>
  );
};
