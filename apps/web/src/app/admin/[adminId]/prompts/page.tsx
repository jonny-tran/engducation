"use client";

import React, { use, useState } from "react";
import { trpc } from "@/utils/trpc";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@engducation/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@engducation/ui/components/table";
import { Button } from "@engducation/ui/components/button";
import { Badge } from "@engducation/ui/components/badge";
import { Input } from "@engducation/ui/components/input";
import { Label } from "@engducation/ui/components/label";
import { Textarea } from "@engducation/ui/components/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@engducation/ui/components/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@engducation/ui/components/tabs";
import { toast } from "sonner";
import { Plus, Edit3, Trash2, Cpu, Wrench, Settings, AlertTriangle, RefreshCw } from "lucide-react";
import { SidebarTrigger } from "@engducation/ui/components/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@engducation/ui/components/breadcrumb";
import { Separator } from "@engducation/ui/components/separator";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default function AdminPromptsPage({ params }: PageProps) {
  const { adminId } = use(params);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("prompts");
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Prompt Form State
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [promptTitle, setPromptTitle] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPromptTemplate, setUserPromptTemplate] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);

  // Assign Form State
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [assignedPromptId, setAssignedPromptId] = useState<string>("");
  const [maxAiRequests, setMaxAiRequests] = useState<number>(5);

  // Queries
  const { data: promptsList, isLoading: promptsLoading } = useQuery(
    trpc.adminAdvanced.aiConfigList.queryOptions()
  );

  const { data: coursesData } = useQuery(
    trpc.admin.courseList.queryOptions({ pageSize: 100 })
  );

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const { data: courseDetail } = useQuery(
    trpc.user.courseGetDetail.queryOptions(
      { courseId: selectedCourseId },
      { enabled: !!selectedCourseId }
    )
  );

  // Mutations
  const upsertPromptMutation = useMutation(
    trpc.adminAdvanced.aiConfigUpsert.mutationOptions({
      onSuccess: () => {
        toast.success(selectedPromptId ? "Cập nhật prompt thành công" : "Tạo prompt thành công");
        setPromptDialogOpen(false);
        resetPromptForm();
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.aiConfigList.queryOptions().queryKey });
      },
      onError: (err) => {
        toast.error(err.message || "Thao tác thất bại");
      },
    })
  );

  const deletePromptMutation = useMutation(
    trpc.adminAdvanced.aiConfigDelete.mutationOptions({
      onSuccess: () => {
        toast.success("Đã xóa prompt thành công");
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.aiConfigList.queryOptions().queryKey });
      },
      onError: (err) => {
        toast.error(err.message || "Xóa prompt thất bại");
      },
    })
  );

  const updateExerciseMutation = useMutation(
    trpc.admin.writingUpdate.mutationOptions({
      onSuccess: () => {
        toast.success("Liên kết prompt & cập nhật hạn mức bài viết thành công!");
        setAssignDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["admin_course_detail", selectedCourseId] });
      },
      onError: (err) => {
        toast.error(err.message || "Cập nhật thất bại");
      },
    })
  );

  const resetPromptForm = () => {
    setSelectedPromptId(null);
    setPromptTitle("");
    setSystemPrompt("");
    setUserPromptTemplate("");
    setTemperature(0.7);
    setMaxTokens(2000);
  };

  const handleEditPrompt = (prompt: any) => {
    setSelectedPromptId(prompt.id);
    setPromptTitle(prompt.title);
    setSystemPrompt(prompt.systemPrompt);
    setUserPromptTemplate(prompt.userPromptTemplate);
    setTemperature(prompt.temperature);
    setMaxTokens(prompt.maxTokens);
    setPromptDialogOpen(true);
  };

  const handleCreatePrompt = () => {
    resetPromptForm();
    setPromptDialogOpen(true);
  };

  const handleSavePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptTitle || !systemPrompt || !userPromptTemplate) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }
    upsertPromptMutation.mutate({
      id: selectedPromptId || undefined,
      title: promptTitle,
      systemPrompt,
      userPromptTemplate,
      temperature,
      maxTokens,
    });
  };

  const handleDeletePrompt = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa Prompt này không? Thao tác này không thể hoàn tác.")) {
      deletePromptMutation.mutate({ id });
    }
  };

  const handleOpenAssignDialog = (exercise: any) => {
    setSelectedExerciseId(exercise.id);
    setAssignedPromptId(exercise.promptId || "");
    setMaxAiRequests(exercise.maxAiRequests ?? 5);
    setAssignDialogOpen(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExerciseId) return;

    updateExerciseMutation.mutate({
      id: selectedExerciseId,
      promptId: assignedPromptId || null,
      maxAiRequests,
    } as any);
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
                <BreadcrumbPage>Cấu hình Prompt AI & Hạn mức</BreadcrumbPage>
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <Cpu className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  Quản lý Prompt & Hạn mức AI Writing Assistant
                </h1>
                <p className="text-purple-100 text-xs md:text-sm mt-0.5 font-light">
                  Định nghĩa động System Prompt, User Prompt Template, và cấu hình hạn ngạch quota sử dụng AI cho từng bài tập viết.
                </p>
              </div>
            </div>
            <Button
              className="bg-white text-purple-700 hover:bg-purple-50 rounded-xl font-bold shadow-lg border-none flex items-center gap-2 shrink-0 transition-transform active:scale-95"
              onClick={handleCreatePrompt}
            >
              <Plus className="h-4 w-4" /> Định Nghĩa Prompt Mới
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-muted/60 dark:bg-muted/30 p-1 rounded-xl">
            <TabsTrigger value="prompts" className="rounded-lg font-semibold">Danh mục Prompt</TabsTrigger>
            <TabsTrigger value="exercises" className="rounded-lg font-semibold">Liên kết bài tập viết</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="mt-6 space-y-4">
            <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Thư viện Prompt mẫu của hệ thống</CardTitle>
                <CardDescription>
                  Chứa các vai trò, chỉ dẫn AI và nhiệt độ (Temperature) chấm bài. Bạn có thể áp dụng Prompt này cho bất kỳ bài viết nào.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {promptsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                    <span className="text-sm text-muted-foreground">Đang tải danh mục prompt...</span>
                  </div>
                ) : !promptsList || promptsList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Không tìm thấy Prompt nào. Nhấp vào nút ở trên để tạo một Prompt mới!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên Prompt</TableHead>
                          <TableHead>System Prompt (Chỉ dẫn vai trò)</TableHead>
                          <TableHead>User Template (Mẫu câu hỏi)</TableHead>
                          <TableHead>Nhiệt độ (Temp)</TableHead>
                          <TableHead>Max Tokens</TableHead>
                          <TableHead>Ngày Cập Nhật</TableHead>
                          <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {promptsList.map((p) => (
                          <TableRow key={p.id} className="hover:bg-muted/30">
                            <TableCell className="font-bold text-foreground text-sm max-w-[150px] truncate">
                              {p.title}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                              {p.systemPrompt}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate font-mono bg-muted/20 px-1 py-0.5 rounded">
                              {p.userPromptTemplate}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-center">
                              {p.temperature}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-center">
                              {p.maxTokens}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(p.updatedAt).toLocaleDateString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg h-8 w-8 p-0"
                                  onClick={() => handleEditPrompt(p)}
                                >
                                  <Edit3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg h-8 w-8 p-0 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                  onClick={() => handleDeletePrompt(p.id)}
                                  disabled={deletePromptMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exercises" className="mt-6 space-y-4">
            <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div>
                  <CardTitle className="text-lg font-bold">Liên kết Prompt cho từng Bài Tập Viết</CardTitle>
                  <CardDescription>
                    Lựa chọn một Khóa Học để hiển thị danh sách bài tập luận, thực hiện liên kết Prompt động và cấu hình Quota.
                  </CardDescription>
                </div>
                <select
                  className="bg-background border rounded-lg p-2 text-sm w-[250px]"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="">-- Chọn Khóa học --</option>
                  {coursesData?.items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </CardHeader>
              <CardContent className="pt-4">
                {!selectedCourseId ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Vui lòng chọn một khóa học ở góc trên bên phải để bắt đầu quản lý bài tập viết.
                  </div>
                ) : !courseDetail || courseDetail.modules.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Khóa học này chưa có nội dung hoặc bài tập viết luận nào được thiết lập.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {courseDetail.modules.map((module) => {
                      const writingItems = module.contents.filter((c: any) => c.type === "writing");
                      if (writingItems.length === 0) return null;

                      return (
                        <div key={module.id} className="space-y-3">
                          <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            Học phần: {module.title}
                          </h3>
                          <div className="border rounded-xl overflow-hidden bg-background">
                            <Table>
                              <TableHeader className="bg-muted/30">
                                <TableRow>
                                  <TableHead>Tên Bài Viết</TableHead>
                                  <TableHead>Đề Bài / Hướng dẫn</TableHead>
                                  <TableHead>Giới Hạn Từ</TableHead>
                                  <TableHead>Prompt Liên Kết</TableHead>
                                  <TableHead>Lượt AI Quota</TableHead>
                                  <TableHead className="text-right">Cấu hình</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {writingItems.map((w: any) => {
                                  const linkedPrompt = promptsList?.find((p) => p.id === w.promptId);
                                  return (
                                    <TableRow key={w.id} className="hover:bg-muted/10">
                                      <TableCell className="font-semibold text-foreground text-sm">
                                        {w.title}
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                                        {w.prompt}
                                      </TableCell>
                                      <TableCell className="font-mono text-sm">
                                        {w.wordLimit ? `${w.wordLimit} từ` : "Không giới hạn"}
                                      </TableCell>
                                      <TableCell>
                                        {linkedPrompt ? (
                                          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border border-purple-200">
                                            {linkedPrompt.title}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50/10">
                                            Default System Prompt
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="font-mono font-bold text-center">
                                        {w.maxAiRequests ?? 5} lượt/học viên
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          size="sm"
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 active:scale-95 ml-auto"
                                          onClick={() => handleOpenAssignDialog(w)}
                                        >
                                          <Settings className="h-4 w-4" /> Thiết lập
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upsert Prompt Dialog */}
      <Dialog open={promptDialogOpen} onOpenChange={setPromptDialogOpen}>
        <DialogContent className="max-w-xl bg-card rounded-2xl border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {selectedPromptId ? "Chỉnh sửa Prompt" : "Tạo Prompt Mới"}
            </DialogTitle>
            <DialogDescription>
              Định nghĩa tham số System, User Template để cấu hình động cách AI phản hồi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePrompt} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="prompt-title">Tên Prompt *</Label>
              <Input
                id="prompt-title"
                placeholder="VD: Luyện thi IELTS Writing Task 2, Sửa lỗi cơ bản..."
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="system-prompt">System Prompt * (Định nghĩa vai trò và chuyên môn của AI)</Label>
              <Textarea
                id="system-prompt"
                rows={4}
                placeholder="VD: You are an IELTS expert and writing examiner. Evaluate and give band scores strictly under the official rubric..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-template">
                User Prompt Template * (Mẫu gửi lên AI, hỗ trợ các biến: <code className="bg-muted px-1 rounded text-rose-500 font-mono text-xs">{"{{student_answer}}"}</code>, <code className="bg-muted px-1 rounded text-rose-500 font-mono text-xs">{"{{exercise_requirement}}"}</code>)
              </Label>
              <Textarea
                id="user-template"
                rows={5}
                placeholder="VD: Student essay:\n{{student_answer}}\nRequirement:\n{{exercise_requirement}}"
                value={userPromptTemplate}
                onChange={(e) => setUserPromptTemplate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="temperature">Nhiệt độ (Temperature: 0 - 1) *</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1.2"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-tokens">Số Tokens Tối Đa (Max Tokens) *</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  required
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setPromptDialogOpen(false)} className="rounded-xl">
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={upsertPromptMutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                {upsertPromptMutation.isPending ? "Đang lưu..." : "Xác nhận lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Prompt Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md bg-card rounded-2xl border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Cấu hình bài tập viết luận</DialogTitle>
            <DialogDescription>
              Liên kết một Prompt động trong thư viện và quy định số lần AI hỗ trợ tối đa cho học viên.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAssignment} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="assign-prompt-select">Chọn Prompt liên kết</Label>
              <select
                id="assign-prompt-select"
                className="w-full bg-background border rounded-lg p-2.5 text-sm"
                value={assignedPromptId}
                onChange={(e) => setAssignedPromptId(e.target.value)}
              >
                <option value="">-- Mặc định (Default System Prompt) --</option>
                {promptsList?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-ai-quota">Số lần tối đa AI hỗ trợ chấm bài * (Quota)</Label>
              <Input
                id="max-ai-quota"
                type="number"
                min="1"
                max="50"
                value={maxAiRequests}
                onChange={(e) => setMaxAiRequests(Number(e.target.value))}
                required
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                Vượt quá số lần này học viên buộc phải tự viết hoặc chờ giáo viên chấm tay.
              </p>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button type="submit" disabled={updateExerciseMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                {updateExerciseMutation.isPending ? "Đang cấu hình..." : "Xác nhận thiết lập"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
