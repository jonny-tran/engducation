"use client";

import React, { use, useState } from "react";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@engducation/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@engducation/ui/components/table";
import { Button } from "@engducation/ui/components/button";
import { Badge } from "@engducation/ui/components/badge";
import { Input } from "@engducation/ui/components/input";
import { Label } from "@engducation/ui/components/label";
import { Textarea } from "@engducation/ui/components/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@engducation/ui/components/dialog";
import { toast } from "sonner";
import { Eye, Edit3, CheckCircle, HelpCircle, FileText, User, MessageSquare, ArrowRight, BookOpen } from "lucide-react";
import { SidebarTrigger } from "@engducation/ui/components/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@engducation/ui/components/breadcrumb";
import { Separator } from "@engducation/ui/components/separator";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default function AdminReviewsPage({ params }: PageProps) {
  const { adminId } = use(params);
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<"pending" | "resolved">("pending");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  // Correction Form State
  const [teacherEssay, setTeacherEssay] = useState("");
  const [teacherScore, setTeacherScore] = useState<number>(85);
  const [teacherFeedback, setTeacherFeedback] = useState("");

  // Queries
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery(
    trpc.adminAdvanced.getReviewTickets.queryOptions({
      status: filterStatus,
    })
  );

  // Mutations
  const resolveTicketMutation = useMutation(
    trpc.adminAdvanced.resolveReviewTicket.mutationOptions({
      onSuccess: () => {
        toast.success("Đã phê duyệt kết quả chấm bài của Giáo viên & cập nhật tiến độ cho Học sinh!");
        setWorkspaceOpen(false);
        setSelectedTicket(null);
        setTeacherEssay("");
        setTeacherScore(85);
        setTeacherFeedback("");
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.getReviewTickets.path });
      },
      onError: (err) => {
        toast.error(err.message || "Không thể gửi kết quả chấm");
      },
    })
  );

  const handleOpenWorkspace = (ticket: any) => {
    setSelectedTicket(ticket);
    setTeacherEssay(ticket.originalEssay);
    setTeacherScore(ticket.submission?.score ?? 80);
    setTeacherFeedback(
      ticket.submission?.feedback?.overallFeedback || "Sau khi đối chiếu và xem xét lại, Giáo viên nhận định bài viết của em như sau..."
    );
    setWorkspaceOpen(true);
  };

  const handleSubmitResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!teacherEssay.trim() || !teacherFeedback.trim()) {
      toast.error("Vui lòng điền đầy đủ các thông tin biên tập và nhận xét");
      return;
    }
    resolveTicketMutation.mutate({
      ticketId: selectedTicket.id,
      teacherEssay,
      teacherScore,
      teacherFeedback,
    });
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {/* Top Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/60 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Khiếu nại & Chấm lại</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-amber-600 to-red-600 p-6 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  Không gian Tiếp nhận & Chấm điểm Khiếu nại Bài viết
                </h1>
                <p className="text-rose-100 text-xs md:text-sm mt-0.5 font-light">
                  Phân hệ Human-in-the-loop: Tiếp nhận khiếu nại của học sinh, so sánh với kết quả chấm tự động của AI, biên tập lại văn bản, cập nhật đè điểm số đã được chuẩn hóa.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter status tab */}
        <div className="flex items-center gap-2">
          <Button
            variant={filterStatus === "pending" ? "default" : "outline"}
            className="rounded-xl font-bold active:scale-95"
            onClick={() => setFilterStatus("pending")}
          >
            Chờ giải quyết ({ticketsData?.filter((t) => t.status === "pending").length ?? 0})
          </Button>
          <Button
            variant={filterStatus === "resolved" ? "default" : "outline"}
            className="rounded-xl font-bold active:scale-95"
            onClick={() => setFilterStatus("resolved")}
          >
            Đã giải quyết ({ticketsData?.filter((t) => t.status === "resolved").length ?? 0})
          </Button>
        </div>

        {/* List Card */}
        <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              {filterStatus === "pending" ? "Yêu cầu cần Giáo viên Chấm lại" : "Lịch sử khiếu nại đã giải quyết"}
            </CardTitle>
            <CardDescription>
              Xem lời nhắn giải trình từ học viên, đối chiếu điểm AI cũ và bắt đầu giải quyết khiếu nại.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full" />
                <span className="text-sm text-muted-foreground">Đang tải danh sách khiếu nại...</span>
              </div>
            ) : !ticketsData || ticketsData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                <HelpCircle className="h-12 w-12 text-muted-foreground/30" />
                Không có phiếu khiếu nại nào trong bộ lọc này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học Viên</TableHead>
                      <TableHead>Bài Tập</TableHead>
                      <TableHead>Điểm Số AI</TableHead>
                      <TableHead>Lời Nhắn Học Viên</TableHead>
                      <TableHead>Ngày Khiếu Nại</TableHead>
                      {filterStatus === "resolved" && (
                        <>
                          <TableHead>Điểm Giáo Viên</TableHead>
                          <TableHead>Giáo Viên Chấm</TableHead>
                        </>
                      )}
                      <TableHead className="text-right">Thao Tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketsData.map((t) => (
                      <TableRow key={t.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground text-sm">{t.user?.name}</span>
                            <span className="text-[10px] text-muted-foreground">{t.user?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm text-foreground max-w-[200px] truncate">
                          {t.writingAssignment?.title}
                        </TableCell>
                        <TableCell className="font-bold text-center">
                          <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50/10">
                            {t.submission?.score ?? "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate italic">
                          "{t.userMessage}"
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(t.createdAt).toLocaleString("vi-VN")}
                        </TableCell>
                        {filterStatus === "resolved" && (
                          <>
                            <TableCell className="font-bold text-center">
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {t.teacherScore}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-rose-600 font-semibold">
                              {t.resolvedBy?.name}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-right">
                          {t.status === "pending" ? (
                            <Button
                              size="sm"
                              className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1 active:scale-95 ml-auto"
                              onClick={() => handleOpenWorkspace(t)}
                            >
                              <Edit3 className="h-4 w-4" /> Bắt đầu Chấm
                            </Button>
                          ) : (
                            <Dialog>
                              <DialogTrigger
                                render={
                                  <Button size="sm" variant="outline" className="rounded-lg flex items-center gap-1 ml-auto" />
                                }
                              >
                                <Eye className="h-4 w-4" /> Xem kết quả
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl bg-card rounded-2xl border">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold">Chi tiết kết quả giải quyết khiếu nại</DialogTitle>
                                  <DialogDescription>
                                    Điểm số và biên tập chính thức được áp dụng đè cho học viên.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                  <div className="grid grid-cols-2 gap-4 text-sm border-b pb-3">
                                    <div>
                                      <span className="text-muted-foreground block text-xs">Học viên khiếu nại</span>
                                      <span className="font-bold">{t.user?.name}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block text-xs">Giáo viên chấm lại</span>
                                      <span className="font-bold text-rose-600">{t.resolvedBy?.name}</span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <span className="text-muted-foreground text-xs block">Điểm AI Cũ</span>
                                      <span className="text-sm font-bold text-purple-600 line-through">
                                        {t.submission?.score} điểm
                                      </span>
                                    </div>
                                    <div className="space-y-1.5">
                                      <span className="text-muted-foreground text-xs block">Điểm Giáo Viên Mới</span>
                                      <span className="text-sm font-bold text-emerald-600">
                                        {t.teacherScore} điểm (Đã cập nhật đè)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <span className="text-muted-foreground text-xs block">Lời nhận xét chính thức</span>
                                    <p className="bg-muted/50 p-3 rounded-xl border text-sm italic">
                                      "{t.teacherFeedback}"
                                    </p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <span className="text-muted-foreground text-xs block">Bài viết sau biên tập của Giáo viên</span>
                                    <p className="bg-muted/50 p-3 rounded-xl border text-sm max-h-[150px] overflow-y-auto whitespace-pre-wrap font-serif">
                                      {t.teacherEssay}
                                    </p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Moderation Workspace Dialog */}
      <Dialog open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] bg-card rounded-2xl border flex flex-col p-0">
          <DialogHeader className="p-6 border-b flex flex-row items-center justify-between shrink-0">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5 text-rose-600" /> Không gian Chấm lại & Biên tập Học viên
              </DialogTitle>
              <DialogDescription>
                Đối chiếu bài luận gốc với lỗi mà AI đã đánh giá để đưa ra điểm số tối ưu nhất của con người.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3 pr-8">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 border">
                Bài viết gốc: {selectedTicket?.submission?.feedback?.wordCount} từ
              </Badge>
              <Badge variant="outline" className="text-purple-600 border-purple-200 font-bold">
                Điểm AI: {selectedTicket?.submission?.score}
              </Badge>
            </div>
          </DialogHeader>

          {/* SPLIT LAYOUT IN WORKSPACE */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Left side: Student Essay & AI Corrections display */}
            <div className="w-1/2 p-6 overflow-y-auto border-r space-y-6">
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <User className="h-4 w-4" /> Học viên giải trình & Lời nhắn:
                </h3>
                <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200/50 italic text-sm text-foreground">
                  "{selectedTicket?.userMessage}"
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" /> Nhận xét tự động từ AI Writing Assistant:
                </h3>
                <div className="bg-purple-50/30 dark:bg-purple-950/10 p-4 rounded-xl border border-purple-100 text-xs md:text-sm space-y-3">
                  <div className="font-semibold text-purple-800 dark:text-purple-400">
                    Đánh giá tổng quan:
                  </div>
                  <p className="text-muted-foreground italic">
                    "{selectedTicket?.submission?.feedback?.overallFeedback}"
                  </p>

                  {/* Corrections list */}
                  {selectedTicket?.submission?.feedback?.corrections && selectedTicket.submission.feedback.corrections.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="font-semibold text-rose-600">Lỗi Ngữ pháp & Chính tả AI phát hiện:</div>
                      <div className="space-y-2">
                        {selectedTicket.submission.feedback.corrections.map((c: any, index: number) => (
                          <div key={index} className="p-2.5 rounded-lg border bg-rose-50/10 dark:bg-rose-950/5 text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="line-through text-rose-500 font-mono">{c.original}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="font-bold text-emerald-500 font-mono">{c.corrected}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{c.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Teacher Editing Workspace Form */}
            <form onSubmit={handleSubmitResolution} className="w-1/2 p-6 overflow-y-auto space-y-4 flex flex-col h-full justify-between">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs uppercase text-rose-600">
                    Trình biên tập văn bản - Sửa lỗi tay cho Học viên *
                  </Label>
                  <Textarea
                    className="flex-1 font-serif text-base border rounded-xl p-4 focus:ring-rose-500 h-[220px]"
                    value={teacherEssay}
                    onChange={(e) => setTeacherEssay(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Giáo viên biên tập lại các câu từ viết sai và chỉnh sửa cho hoàn thiện.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="col-span-1 space-y-1.5">
                    <Label htmlFor="teacher-score" className="font-bold text-xs uppercase text-rose-600">
                      Nhập Điểm Chuẩn Hóa *
                    </Label>
                    <Input
                      id="teacher-score"
                      type="number"
                      min="0"
                      max="100"
                      value={teacherScore}
                      onChange={(e) => setTeacherScore(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-2 pt-5">
                    <span className="text-[11px] text-muted-foreground block italic">
                      Quy chuẩn: Điểm từ 0 - 100. Điểm này sẽ lập tức thay thế band điểm cũ của AI trong học bạ của người dùng.
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="teacher-feedback" className="font-bold text-xs uppercase text-rose-600">
                    Lời nhận xét & Chỉ dẫn của Giáo viên *
                  </Label>
                  <Textarea
                    id="teacher-feedback"
                    rows={4}
                    placeholder="VD: Cô đã xem lại bài luận của em và đồng ý rằng AI đã bắt lỗi quá cứng nhắc ở câu... Bài viết của em rất sáng tạo..."
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 shrink-0">
                <Button type="button" variant="outline" onClick={() => setWorkspaceOpen(false)} className="rounded-xl">
                  Quay lại
                </Button>
                <Button type="submit" disabled={resolveTicketMutation.isPending} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                  {resolveTicketMutation.isPending ? "Đang gửi kết quả..." : "Gửi Kết Quả Chuẩn Hóa"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
