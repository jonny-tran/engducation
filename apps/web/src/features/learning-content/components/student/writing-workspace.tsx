"use client";
import { useWritingWorkspace } from "../../hooks/use-writing-workspace";
import { GrammarDiffViewer } from "../shared/grammar-diff-viewer";
import { Button } from "@engducation/ui/components/button";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import { Progress } from "@engducation/ui/components/progress";
import {
  PenTool,
  BookOpen,
  Sparkles,
  Award,
  AlertTriangle,
  History,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

interface WritingWorkspaceProps {
  writingId: string;
  courseId: string;
  onComplete?: () => void;
}

export function WritingWorkspace({ writingId, courseId, onComplete }: WritingWorkspaceProps) {
  const {
    essay,
    setEssay,
    activeSubmission,
    setActiveSubmission,
    assignment,
    isAssignmentLoading,
    historyData,
    wordCount,
    wordLimit,
    isOverLimit,
    handleSubmit,
    isSubmitting,
  } = useWritingWorkspace({ writingId, courseId, onComplete });

  if (isAssignmentLoading) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
        Đang tải thông tin đề bài luận...
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-8 text-center text-xs text-destructive font-medium">
        Không tìm thấy thông tin bài viết luận này.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 text-slate-800 dark:text-slate-100">
      {/* 2-COLS LEFT: ASSIGNMENT INFORMATION & PROMPT */}
      <div className="xl:col-span-2 space-y-6">
        {/* Essay Prompt Card */}
        <Card className="border border-border bg-card/40 backdrop-blur-md shadow-sm">
          <CardHeader className="py-3 border-b border-border bg-muted/10 flex flex-row items-center gap-2">
            <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
              <BookOpen className="h-4 w-4" />
            </div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Đề bài viết luận
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-sm font-bold text-foreground">{assignment.title}</h2>
            <div className="p-3 bg-muted/20 border border-border rounded text-xs leading-relaxed whitespace-pre-wrap font-medium">
              {assignment.prompt}
            </div>

            {assignment.wordLimit && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-2.5">
                <span>Số từ yêu cầu:</span>
                <span className="font-bold text-foreground">{assignment.wordLimit} từ</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grading Rubric Card */}
        <Card className="border border-border bg-card/40 backdrop-blur-md shadow-sm">
          <CardHeader className="py-3 border-b border-border bg-muted/10 flex flex-row items-center gap-2">
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500">
              <Award className="h-4 w-4" />
            </div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tiêu chí chấm điểm (Rubric)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono bg-muted/10 p-3 border border-border rounded">
              {assignment.rubric}
            </div>
          </CardContent>
        </Card>

        {/* Suggested Answer Card (If available and student has submitted at least once) */}
        {assignment.suggestedAnswer && historyData && historyData.length > 0 && (
          <Card className="border border-border bg-card/40 backdrop-blur-md shadow-sm">
            <CardHeader className="py-3 border-b border-border bg-muted/10 flex flex-row items-center gap-2">
              <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-500">
                <Sparkles className="h-4 w-4" />
              </div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Bài mẫu tham khảo (Suggested Model)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap bg-indigo-500/5 p-3.5 border border-indigo-500/10 rounded-md">
                {assignment.suggestedAnswer}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 3-COLS RIGHT: WORKSPACE EDITOR OR SUBMISSION REPORT */}
      <div className="xl:col-span-3 space-y-6">
        {!activeSubmission ? (
          /* ESSAY WRITING WORKSPACE FORM */
          <Card className="border border-border bg-card/60 backdrop-blur-md shadow-lg sticky top-6">
            <CardHeader className="py-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                  <PenTool className="h-4 w-4" />
                </div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-card-foreground">
                  Trình soạn thảo luận văn học viên
                </CardTitle>
              </div>
              {historyData && historyData.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const latest = historyData[historyData.length - 1];
                    setActiveSubmission(latest);
                  }}
                  className="h-7 text-[10px] font-bold"
                >
                  <History className="h-3.5 w-3.5 mr-1" />
                  Xem bài nộp gần nhất
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Textarea
                    required
                    value={essay}
                    onChange={(e) => setEssay(e.target.value)}
                    placeholder="Bắt đầu viết bài luận của bạn tại đây bằng tiếng Anh..."
                    className="min-h-[280px] text-xs leading-relaxed focus-visible:ring-amber-500/50 resize-y"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Dynamic Word Limit Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {wordCount} / {wordLimit} từ
                      {isOverLimit && (
                        <span className="text-destructive flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3" /> Vượt tối đa
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {Math.round(Math.min(100, (wordCount / wordLimit) * 100))}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (wordCount / wordLimit) * 100)}
                    className={`h-1.5 ${
                      isOverLimit
                        ? "[&>div]:bg-destructive"
                        : wordCount >= wordLimit
                        ? "[&>div]:bg-emerald-500"
                        : "[&>div]:bg-amber-500"
                    }`}
                  />
                </div>

                <div className="flex justify-end pt-2 border-t border-border">
                  <Button
                    type="submit"
                    disabled={isSubmitting || essay.trim().length === 0 || isOverLimit}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-6"
                  >
                    {isSubmitting ? "ĐANG GỬI CHẤM AI..." : "NỘP BÀI LUẬN & CHẤM ĐIỂM AI"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* AI SCORING & INTERACTIVE FEEDBACK VIEW */
          <div className="space-y-6">
            <Card className="border border-emerald-500/30 bg-card/60 backdrop-blur-md shadow-lg overflow-hidden">
              {/* Header scoreboard */}
              <CardHeader className="py-4 border-b border-border bg-emerald-500/5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Kết quả chấm bài bằng AI
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Điểm tổng quát</div>
                    <div className="text-xl font-black text-emerald-500 font-mono">{activeSubmission.score}/100</div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveSubmission(null);
                      setEssay("");
                    }}
                    className="h-8 text-[10px] font-bold ml-3"
                  >
                    VIẾT LẠI BÀI MỚI
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-5">
                {/* Overall feedback card */}
                <div className="p-3 bg-muted/20 border border-border rounded-lg text-xs leading-relaxed font-medium">
                  <div className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                    Đánh giá chi tiết từ AI:
                  </div>
                  {activeSubmission.feedback?.overallFeedback}
                </div>

                {/* Interactive Diff section */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                    <span>INTERACTIVE ERROR DIFF VIEW</span>
                    <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Rà soát lỗi chính tả & ngữ pháp trực quan
                    </span>
                  </div>
                  <GrammarDiffViewer
                    text={activeSubmission.essay}
                    corrections={activeSubmission.feedback?.corrections ?? []}
                  />
                  {(!activeSubmission.feedback?.corrections || activeSubmission.feedback.corrections.length === 0) && (
                    <p className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 p-2 rounded border border-emerald-500/20 text-center">
                      Xuất sắc! AI không phát hiện lỗi chính tả hoặc ngữ pháp cơ bản nào trong bài viết.
                    </p>
                  )}
                </div>

                {/* Vocabulary suggestions table */}
                {activeSubmission.feedback?.vocabUpgrades && activeSubmission.feedback.vocabUpgrades.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                      ĐỀ XUẤT NÂNG CẤP TỪ VỰNG HỌC THUẬT (C1/C2 LEVEL)
                    </div>
                    <div className="border border-border bg-background/50 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border font-bold uppercase text-[10px] text-muted-foreground">
                            <th className="p-2">Từ đã dùng</th>
                            <th className="p-2 w-28">Nâng cấp học thuật</th>
                            <th className="p-2">Lợi ích & Giải thích</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-[11px]">
                          {activeSubmission.feedback.vocabUpgrades.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-muted/30">
                              <td className="p-2 font-mono line-through text-red-500">{item.original}</td>
                              <td className="p-2">
                                <span className="font-bold text-emerald-500 font-mono">{item.upgrade}</span>
                                <Badge variant="outline" className="text-[9px] font-mono border-amber-500/20 text-amber-600 bg-amber-500/5 ml-1.5">
                                  {item.level}
                                </Badge>
                              </td>
                              <td className="p-2 text-muted-foreground">{item.explanation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* SUBMISSION HISTORY ACCORDION LOG */}
        {historyData && historyData.length > 0 && (
          <Card className="border border-border bg-card/40 backdrop-blur-md shadow-sm">
            <CardHeader className="py-3.5 border-b border-border bg-muted/10 flex flex-row items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Lịch sử nộp bài học viên ({historyData.length} lần nộp)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {historyData.map((sub: any, idx: number) => {
                  const isActive = activeSubmission?.id === sub.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setActiveSubmission(sub)}
                      className={`p-3 text-xs flex items-center justify-between gap-3 hover:bg-muted/50 cursor-pointer transition-colors duration-150 ${
                        isActive ? "bg-muted/70 font-semibold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[9px] text-muted-foreground bg-background">
                          LẦN NỘP {idx + 1}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(sub.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-500 font-bold">{sub.score} / 100</span>
                        <Button variant="ghost" size="xs" className="text-[10px] font-bold h-6 px-1.5 border">
                          XEM LẠI
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
