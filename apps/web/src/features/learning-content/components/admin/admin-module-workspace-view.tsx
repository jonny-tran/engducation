"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useLessonMutations } from "../../hooks/use-lesson-mutations";
import { useQuizMutations } from "../../hooks/use-quiz-mutations";
import { useWritingMutations } from "../../hooks/use-writing-mutations";
import { useCloudinaryUpload } from "../../hooks/use-cloudinary-upload";
import { AdminQuizBuilder } from "./admin-quiz-builder";
import { AdminWritingBuilder } from "./admin-writing-builder";
import { AdminVocabularyManager, useVocabularyMutations } from "@/features/vocabulary";
import { AdminHeaderBanner } from "./admin-course-header-banner";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import { Label } from "@engducation/ui/components/label";
import { Progress } from "@engducation/ui/components/progress";
import { Skeleton } from "@engducation/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@engducation/ui/components/tabs";
import {
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Play,
  HelpCircle,
  PenTool,
  Upload,
  X,
  Plus,
  Trash2,
  Layers,
  Award,
  BookMarked,
  Download,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@engducation/ui/components/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@engducation/ui/components/table";
import {
  parseVocabularyExcel,
  parseQuizExcel,
  downloadVocabularyTemplate,
  downloadQuizTemplate,
} from "@/utils/excel-parser";


type ActiveEditorState =
  | { type: "empty" }
  | { type: "new_lesson" }
  | { type: "edit_lesson"; lesson: any }
  | { type: "new_quiz" }
  | { type: "edit_quiz"; quiz: any }
  | { type: "new_writing" }
  | { type: "edit_writing"; writing: any }
  | { type: "new_vocab" }
  | { type: "edit_vocab"; vocab: any };

interface AdminModuleWorkspaceViewProps {
  adminId: string;
  courseId: string;
  moduleId: string;
}

export function AdminModuleWorkspaceView({ adminId, courseId, moduleId }: AdminModuleWorkspaceViewProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("lessons");
  const [activeEditor, setActiveEditor] = useState<ActiveEditorState>({ type: "empty" });

  // Fetch course detail to retrieve module contents
  const { data: courseDetail, isLoading, error } = useQuery(
    trpc.admin.courseGetDetail.queryOptions({ courseId })
  );

  const { data: vocabData, isLoading: isVocabLoading } = useQuery(
    trpc.adminVocabulary.list.queryOptions({ courseId, moduleId, pageSize: 100 })
  );

  const { createLesson, updateLesson, deleteLesson } = useLessonMutations(courseId);
  const { deleteQuiz, importQuizFromExcel } = useQuizMutations(courseId);
  const { deleteWriting } = useWritingMutations(courseId);
  const { remove: deleteVocabulary, importFromExcel } = useVocabularyMutations();
  const { upload: uploadVideo } = useCloudinaryUpload({
    folder: "engducation/courses/videos",
    resourceType: "video",
  });

  // Lesson Form states
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonType, setLessonType] = useState<"TEXT" | "VIDEO">("TEXT");
  const [videoPublicId, setVideoPublicId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [lessonStatus, setLessonStatus] = useState<"draft" | "published" | "archived">("draft");

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto load first lesson into editor if available
  const currentModule = courseDetail?.modules?.find((m) => m.id === moduleId);
  const moduleLessons = currentModule?.contents?.filter((c) => c.type === "lesson") ?? [];

  useEffect(() => {
    if (moduleLessons.length > 0 && activeEditor.type === "empty" && activeTab === "lessons") {
      setActiveEditor({ type: "edit_lesson", lesson: moduleLessons[0] });
    }
  }, [courseDetail, activeTab]);

  // Bind lesson form values when switching selected lesson
  useEffect(() => {
    if (activeEditor.type === "edit_lesson") {
      const { lesson } = activeEditor;
      setLessonTitle(lesson.title);
      setLessonDescription(lesson.description ?? "");
      setLessonType(lesson.videoUrl || lesson.videoPublicId ? "VIDEO" : "TEXT");
      setVideoPublicId(lesson.videoPublicId ?? "");
      setVideoUrl(lesson.videoUrl ?? "");
      setLessonStatus(lesson.status as any);
    } else if (activeEditor.type === "new_lesson") {
      setLessonTitle("");
      setLessonDescription("");
      setLessonType("TEXT");
      setVideoPublicId("");
      setVideoUrl("");
      setLessonStatus("draft");
    }
    setUploadProgress(null);
  }, [activeEditor]);

  // Excel Import States
  const [importType, setImportType] = useState<"vocab" | "quiz" | null>(null);
  const [parsedVocabItems, setParsedVocabItems] = useState<any[]>([]);
  const [parsedQuizQuestions, setParsedQuizQuestions] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [quizImportTitle, setQuizImportTitle] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "vocab" | "quiz") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportType(type);
    setImportFileName(file.name);

    try {
      if (type === "vocab") {
        const items = await parseVocabularyExcel(file);
        if (items.length === 0) {
          toast.error("Không tìm thấy dữ liệu từ vựng trong file Excel.");
          return;
        }
        setParsedVocabItems(items);
        setParsedQuizQuestions([]);
        setIsImportPreviewOpen(true);
      } else {
        const questions = await parseQuizExcel(file);
        if (questions.length === 0) {
          toast.error("Không tìm thấy dữ liệu câu hỏi trong file Excel.");
          return;
        }
        setQuizImportTitle(`Bài tập trắc nghiệm: ${currentModule?.title ?? ""}`);
        setParsedQuizQuestions(questions);
        setParsedVocabItems([]);
        setIsImportPreviewOpen(true);
      }
    } catch (err: any) {
      toast.error(`Lỗi đọc file Excel: ${err.message || "File không hợp lệ"}`);
    } finally {
      e.target.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (importType === "vocab") {
      if (parsedVocabItems.length === 0) return;
      try {
        await importFromExcel.mutateAsync({
          courseId,
          moduleId,
          items: parsedVocabItems,
        });
        setIsImportPreviewOpen(false);
        setParsedVocabItems([]);
      } catch {
        // toast handles error
      }
    } else if (importType === "quiz") {
      if (parsedQuizQuestions.length === 0) return;
      if (!quizImportTitle.trim()) {
        toast.error("Vui lòng nhập tiêu đề bài tập trắc nghiệm");
        return;
      }
      try {
        await importQuizFromExcel.mutateAsync({
          moduleId,
          title: quizImportTitle.trim(),
          questions: parsedQuizQuestions.map((q, idx) => ({
            content: q.content,
            explanation: q.explanation || undefined,
            order: q.order || idx + 1,
            answers: q.answers,
          })),
        });
        setIsImportPreviewOpen(false);
        setParsedQuizQuestions([]);
      } catch {
        // toast handles error
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 h-full w-full">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/50 px-6 bg-background/60 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Đang tải không gian học phần...
          </div>
        </header>
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !courseDetail || !currentModule) {
    return (
      <div className="flex flex-col flex-1 h-full w-full">
        <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
          <Layers className="h-10 w-10 text-destructive/40 mb-3" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Không tìm thấy học phần</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Học phần không tồn tại hoặc dữ liệu của khóa học bị lỗi.
          </p>
          <Button
            onClick={() => router.push(`/admin/${adminId}/courses/${courseId}`)}
            className="mt-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
          >
            Quay lại Đề cương
          </Button>
        </div>
      </div>
    );
  }

  const moduleQuizzes = currentModule?.contents?.filter((c) => c.type === "quiz") ?? [];
  const moduleWritings = currentModule?.contents?.filter((c) => c.type === "writing") ?? [];

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn tệp video hợp lệ");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error("Tệp video quá lớn (tối đa 500MB)");
      return;
    }

    setUploadProgress(0);
    try {
      const res = await uploadVideo.mutateAsync({
        file,
        onProgress: (p) => {
          setUploadProgress(Math.round((p.loaded / p.total) * 100));
        },
      });
      setVideoPublicId(res.publicId);
      setVideoUrl(res.secureUrl);
      toast.success("Tải bài giảng video lên thành công!");
    } catch {
      toast.error("Tải tệp video lên Cloudinary thất bại.");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;

    const payload = {
      title: lessonTitle.trim(),
      description: lessonDescription.trim() || undefined,
      videoPublicId: lessonType === "VIDEO" ? (videoPublicId || undefined) : undefined,
      videoUrl: lessonType === "VIDEO" ? (videoUrl || undefined) : undefined,
      status: activeEditor.type === "new_lesson" ? "draft" : lessonStatus,
    };

    try {
      if (activeEditor.type === "edit_lesson") {
        await updateLesson.mutateAsync({ id: activeEditor.lesson.id, ...payload });
      } else if (activeEditor.type === "new_lesson") {
        await createLesson.mutateAsync({ moduleId, ...payload });
      }
      setActiveEditor({ type: "empty" });
    } catch {
      // toast is standard
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài giảng/bài tập "${item.title}"?`)) {
      try {
        if (item.type === "lesson") {
          await deleteLesson.mutateAsync({ id: item.id });
        } else if (item.type === "quiz") {
          await deleteQuiz.mutateAsync({ id: item.id });
        } else if (item.type === "writing") {
          await deleteWriting.mutateAsync({ id: item.id });
        }
        setActiveEditor({ type: "empty" });
        toast.success("Đã xóa nội dung học trình thành công!");
      } catch {
        // Handled
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {/* Visual Navigation Header with Breadcrumbs */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/50 px-6 bg-background/60 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-0">
          <Link href={`/admin/${adminId}/courses`} className="hover:text-rose-500 transition-colors">
            Khóa học
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link
            href={`/admin/${adminId}/courses/${courseId}`}
            className="hover:text-rose-500 transition-colors truncate max-w-[120px]"
          >
            {courseDetail.title}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground truncate max-w-[160px]">{currentModule.title}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/${adminId}/courses/${courseId}`)}
          className="h-8 text-[10px] font-bold gap-1 rounded-xl"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Lộ trình
        </Button>
      </header>

      {/* Main workspace wrapping tabs */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={(tab) => {
          setActiveTab(tab);
          setActiveEditor({ type: "empty" });
        }}>
          {/* Custom Styled Premium Tabs trigger list */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-6">
            <TabsList className="bg-muted/40 p-1 rounded-xl gap-1">
              <TabsTrigger
                value="lessons"
                className="text-xs font-bold uppercase py-2 px-4 rounded-lg data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Bài giảng Video
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                className="text-xs font-bold uppercase py-2 px-4 rounded-lg data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Award className="h-3.5 w-3.5 mr-1.5" />
                Bài tập &amp; Quiz
              </TabsTrigger>
              <TabsTrigger
                value="vocabulary"
                className="text-xs font-bold uppercase py-2 px-4 rounded-lg data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <BookMarked className="h-3.5 w-3.5 mr-1.5" />
                Từ vựng
              </TabsTrigger>
            </TabsList>
            <div className="text-[10px] text-muted-foreground font-mono font-bold hidden sm:block uppercase">
              Không gian biên soạn học thuật
            </div>
          </div>

          {/* TAB 1: VIDEOS AND TEXT LESSONS */}
          <TabsContent value="lessons" className="outline-none mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left timeline section */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="border border-border/60 bg-card/30 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden">
                  <CardHeader className="py-3 border-b border-border/50 bg-muted/5 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Bài học ({moduleLessons.length})
                    </CardTitle>
                    <Button
                      onClick={() => setActiveEditor({ type: "new_lesson" })}
                      size="sm"
                      className="h-7 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-2.5 shadow-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Thêm bài giảng
                    </Button>
                  </CardHeader>
                  <CardContent className="p-3">
                    {moduleLessons.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground italic">
                        Chưa có bài học nào trong tuần này.
                      </p>
                    ) : (
                      <div className="space-y-2 relative pl-2 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border/60">
                        {moduleLessons.map((lesson) => {
                          const isSelected =
                            activeEditor.type === "edit_lesson" &&
                            activeEditor.lesson.id === lesson.id;
                          const hasVideo = !!lesson.videoUrl || !!lesson.videoPublicId;

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => setActiveEditor({ type: "edit_lesson", lesson })}
                              className={`relative flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? "border-rose-500/30 bg-rose-500/5 text-rose-500 hover:bg-rose-500/5 shadow-xs font-medium"
                                  : "border-border/50 bg-background/50 hover:bg-background/80"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`h-5 w-5 rounded-full text-[9px] font-mono font-bold flex items-center justify-center shrink-0 border ${
                                    isSelected
                                      ? "border-rose-500 bg-rose-500/10 text-rose-500"
                                      : "border-border bg-muted/30 text-muted-foreground"
                                  }`}
                                >
                                  {lesson.order}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate max-w-[140px] text-foreground">
                                    {lesson.title}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <Badge
                                      variant="outline"
                                      className={`text-[8px] font-bold px-1 rounded-full ${
                                        hasVideo
                                          ? "border-indigo-500/20 text-indigo-600 bg-indigo-500/5"
                                          : "border-blue-500/20 text-blue-600 bg-blue-500/5"
                                      }`}
                                    >
                                      {hasVideo ? "VIDEO" : "BÀI ĐỌC"}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={`text-[8px] font-bold px-1 rounded-full ${
                                        lesson.status === "published"
                                          ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/5"
                                          : "border-amber-500/20 text-amber-600 bg-amber-500/5"
                                      }`}
                                    >
                                      {lesson.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(lesson);
                                }}
                                className="h-7 w-7 p-0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right column master workspace */}
              <div className="lg:col-span-2">
                {activeEditor.type === "empty" ? (
                  <Card className="border border-border/60 bg-card/20 backdrop-blur-md shadow-xs p-10 text-center rounded-2xl">
                    <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3 mx-auto" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Không gian bài giảng
                    </h3>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed mt-2">
                      Chọn một bài học từ danh mục bên trái hoặc nhấn nút tạo mới để tiến hành chỉnh sửa nội dung bài giảng.
                    </p>
                  </Card>
                ) : activeEditor.type === "new_lesson" || activeEditor.type === "edit_lesson" ? (
                  <Card className="border border-border/60 bg-card/50 backdrop-blur-md shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="py-4 border-b border-border/50 bg-muted/10 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {activeEditor.type === "edit_lesson" ? "Biên soạn bài học" : "Thiết kế bài học mới"}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        onClick={() => setActiveEditor({ type: "empty" })}
                        className="h-7 w-7 p-0 rounded-lg hover:bg-muted"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4">
                      <form onSubmit={handleLessonSubmit} className="space-y-4 text-xs">
                        <div className="flex flex-col gap-1.5">
                           <Label className="font-bold uppercase text-muted-foreground">Tiêu đề bài học *</Label>
                          <Input
                            required
                            value={lessonTitle}
                            onChange={(e) => setLessonTitle(e.target.value)}
                            placeholder="Nhập tiêu đề bài học..."
                            className="text-xs focus:border-rose-500/50 rounded-xl"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <Label className="font-bold uppercase text-muted-foreground">Mô tả chi tiết bài học</Label>
                          <Textarea
                            value={lessonDescription}
                            onChange={(e) => setLessonDescription(e.target.value)}
                            placeholder="Tóm tắt giáo trình, tài liệu liên quan cho bài đọc/bài giảng video này..."
                            className="min-h-[100px] text-xs focus:border-rose-500/50 rounded-xl"
                          />
                        </div>

                        <div className="max-w-xs flex flex-col gap-1.5">
                          <Label className="font-bold uppercase text-muted-foreground">Thể loại giảng dạy</Label>
                          <select
                            value={lessonType}
                            onChange={(e) => setLessonType(e.target.value as "TEXT" | "VIDEO")}
                            className="flex h-9 w-full border border-border/80 bg-background rounded-xl px-2.5 py-1 text-xs text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50"
                          >
                            <option value="TEXT">Bài đọc giáo khoa (TEXT)</option>
                            <option value="VIDEO">Bài giảng ghi hình (VIDEO)</option>
                          </select>
                        </div>

                        {/* Video Upload section */}
                        {lessonType === "VIDEO" && (
                          <div className="p-4 border border-dashed border-border/80 bg-muted/10 rounded-2xl space-y-4">
                            <div className="flex flex-col gap-2">
                              <Label className="font-bold uppercase text-muted-foreground text-[10px]">Tệp video bài giảng</Label>

                              {videoPublicId && !uploadProgress && (
                                <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2 text-[10px] shadow-xs">
                                  <span className="text-indigo-600 dark:text-indigo-400 truncate flex-1 font-mono">
                                    Mã video: {videoPublicId}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVideoPublicId("");
                                      setVideoUrl("");
                                    }}
                                    className="text-muted-foreground hover:text-destructive transition-colors ml-2 shrink-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              )}

                              {uploadProgress !== null && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                      <Upload className="h-3.5 w-3.5 animate-pulse text-indigo-500" />
                                      Đang upload bài giảng lên Cloudinary...
                                    </span>
                                    <span className="font-mono">{uploadProgress}%</span>
                                  </div>
                                  <Progress value={uploadProgress} className="h-1.5 rounded-full" />
                                </div>
                              )}

                              {uploadProgress === null && !videoPublicId && (
                                <>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    className="hidden"
                                    id="video-upload-trigger"
                                  />
                                  <label
                                    htmlFor="video-upload-trigger"
                                    className="flex flex-col items-center justify-center gap-2 border border-dashed border-border/80 bg-background/50 hover:bg-muted hover:border-primary/50 cursor-pointer rounded-2xl py-6 transition-all"
                                  >
                                    <Upload className="h-5 w-5 text-indigo-500 animate-bounce" />
                                    <span className="text-xs font-bold text-foreground">Chọn video bài học để tải lên</span>
                                    <span className="text-[9px] text-muted-foreground">Tệp video chất lượng tối đa 500MB (MP4, MKV, AVI, v.v.)</span>
                                  </label>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveEditor({ type: "empty" })}
                            className="font-bold text-xs rounded-xl"
                          >
                            Hủy
                          </Button>
                          <Button
                            type="submit"
                            disabled={createLesson.isPending || updateLesson.isPending || uploadProgress !== null}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                          >
                            {createLesson.isPending || updateLesson.isPending
                              ? "Đang lưu..."
                              : activeEditor.type === "edit_lesson"
                              ? "Cập nhật bài học"
                              : "Lưu bài giảng"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ASSIGNMENTS (QUIZZES & AI ESSAYS) */}
          <TabsContent value="assignments" className="outline-none mt-0">
            {activeEditor.type === "edit_quiz" || activeEditor.type === "new_quiz" ? (
              <div className="space-y-4">
                <Button
                  onClick={() => setActiveEditor({ type: "empty" })}
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold gap-1 rounded-xl mb-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
                </Button>
                <AdminQuizBuilder
                  courseId={courseId}
                  moduleId={moduleId}
                  quiz={activeEditor.type === "edit_quiz" ? activeEditor.quiz : undefined}
                  onFinished={() => {
                    setActiveEditor({ type: "empty" });
                    toast.success("Đã đồng bộ bài tập trắc nghiệm thành công!");
                  }}
                />
              </div>
            ) : activeEditor.type === "edit_writing" || activeEditor.type === "new_writing" ? (
              <div className="space-y-4">
                <Button
                  onClick={() => setActiveEditor({ type: "empty" })}
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold gap-1 rounded-xl mb-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
                </Button>
                <AdminWritingBuilder
                  courseId={courseId}
                  moduleId={moduleId}
                  writingAssignment={activeEditor.type === "edit_writing" ? activeEditor.writing : undefined}
                  onFinished={() => {
                    setActiveEditor({ type: "empty" });
                    toast.success("Đã lưu bài viết luận AI thành công!");
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Card for Quizzes */}
                <Card className="border border-border/60 bg-card/30 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden flex flex-col">
                  <CardHeader className="py-4 border-b border-border/50 bg-muted/5 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-emerald-500" />
                      Bài tập Trắc nghiệm
                    </CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadQuizTemplate}
                        className="h-7 text-[9px] font-bold px-2 rounded-lg border flex items-center gap-1 bg-background hover:bg-muted/10 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-500" /> Tải mẫu
                      </Button>
                      <label className="h-7 text-[9px] font-bold px-2 rounded-lg border hover:bg-muted/10 transition-colors flex items-center gap-1 cursor-pointer bg-background">
                        <Upload className="h-3.5 w-3.5 text-emerald-500" /> Import Excel
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => handleFileChange(e, "quiz")}
                          className="hidden"
                        />
                      </label>
                      <Button
                        onClick={() => setActiveEditor({ type: "new_quiz" })}
                        size="sm"
                        className="h-7 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 shadow-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Tạo Quiz
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1">
                    {moduleQuizzes.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground italic">
                        Học phần này hiện chưa có câu hỏi trắc nghiệm nào.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {moduleQuizzes.map((quiz) => (
                          <div
                            key={quiz.id}
                            className="flex items-center justify-between p-3 border border-border/50 bg-background/50 hover:bg-background/80 rounded-xl transition-all"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-foreground truncate">{quiz.title}</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge variant="outline" className="text-[8px] font-bold border-emerald-500/20 text-emerald-600 bg-emerald-500/5 px-1.5 py-0 rounded-full">
                                  {quiz.questions?.length ?? 0} CÂU HỎI
                                </Badge>
                                <Badge variant="outline" className={`text-[8px] font-bold px-1.5 py-0 rounded-full uppercase ${
                                  quiz.status === "published"
                                    ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/5"
                                    : "border-amber-500/20 text-amber-600 bg-amber-500/5"
                                }`}>
                                  {quiz.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="outline"
                                onClick={() => setActiveEditor({ type: "edit_quiz", quiz })}
                                className="h-7 text-[9px] font-bold rounded-lg border px-2.5"
                              >
                                SỬA
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleDeleteItem(quiz)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Visual Card for Writing assignments */}
                <Card className="border border-border/60 bg-card/30 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden flex flex-col">
                  <CardHeader className="py-4 border-b border-border/50 bg-muted/5 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-amber-500" />
                      Viết luận AI Assistant
                    </CardTitle>
                    <Button
                      onClick={() => setActiveEditor({ type: "new_writing" })}
                      size="sm"
                      className="h-7 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2.5 shadow-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Tập viết AI
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 flex-1">
                    {moduleWritings.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground italic">
                        Chưa thiết lập bài viết luận với AI trong tuần này.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {moduleWritings.map((writing) => (
                          <div
                            key={writing.id}
                            className="flex items-center justify-between p-3 border border-border/50 bg-background/50 hover:bg-background/80 rounded-xl transition-all"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-foreground truncate">{writing.title}</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge variant="outline" className="text-[8px] font-bold border-amber-500/20 text-amber-600 bg-amber-500/5 px-1.5 py-0 rounded-full">
                                  GIỚI HẠN {writing.wordLimit ?? "∞"} TỪ
                                </Badge>
                                <Badge variant="outline" className={`text-[8px] font-bold px-1.5 py-0 rounded-full uppercase ${
                                  writing.status === "published"
                                    ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/5"
                                    : "border-amber-500/20 text-amber-600 bg-amber-500/5"
                                }`}>
                                  {writing.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="outline"
                                onClick={() => setActiveEditor({ type: "edit_writing", writing })}
                                className="h-7 text-[9px] font-bold rounded-lg border px-2.5"
                              >
                                SỬA
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleDeleteItem(writing)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: VOCABULARY */}
          <TabsContent value="vocabulary" className="outline-none mt-0">
            {activeEditor.type === "new_vocab" || activeEditor.type === "edit_vocab" ? (
              <div className="space-y-4">
                <Button
                  onClick={() => setActiveEditor({ type: "empty" })}
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold gap-1 rounded-xl mb-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
                </Button>
                <AdminVocabularyManager
                  courseId={courseId}
                  moduleId={moduleId}
                  vocabulary={activeEditor.type === "edit_vocab" ? activeEditor.vocab : null}
                  onFinished={() => {
                    setActiveEditor({ type: "empty" });
                  }}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Reusable Header Banner */}
                <AdminHeaderBanner
                  title="Quản lý Từ vựng Học phần"
                  subtitle="Thêm và biên soạn danh mục từ vựng học thuật trực thuộc học phần này."
                  icon={<BookMarked className="h-5 w-5" />}
                  rightAction={
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadVocabularyTemplate}
                        className="h-8 text-[10px] font-bold px-3 border rounded-xl flex items-center gap-1 bg-background hover:bg-muted/10 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5 text-rose-500" /> Tải mẫu
                      </Button>
                      <label className="h-8 text-[10px] font-bold px-3 border hover:bg-muted/10 transition-colors rounded-xl flex items-center gap-1 cursor-pointer bg-background">
                        <Upload className="h-3.5 w-3.5 text-rose-500" /> Import Excel
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => handleFileChange(e, "vocab")}
                          className="hidden"
                        />
                      </label>
                      <Button
                        onClick={() => setActiveEditor({ type: "new_vocab" })}
                        size="sm"
                        className="h-8 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-3.5 shadow-xs shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Thêm từ mới
                      </Button>
                    </div>
                  }
                />

                <Card className="border border-border/60 bg-card/30 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden">
                  <CardHeader className="py-4 border-b border-border/50 bg-muted/5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Từ vựng hiện có ({vocabData?.items?.length ?? 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {isVocabLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </div>
                    ) : !vocabData?.items || vocabData.items.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground italic">
                        Học phần này hiện chưa có từ vựng nào.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {vocabData.items.map((vocab: any) => (
                          <div
                            key={vocab.id}
                            className="flex items-center justify-between p-3.5 border border-border/50 bg-background/50 hover:bg-background/80 rounded-xl transition-all"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">{vocab.word}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">/{vocab.phonetics}/</span>
                                <Badge variant="outline" className="text-[8px] font-mono border-rose-500/20 text-rose-600 bg-rose-500/5 px-1.5 py-0 rounded-full uppercase leading-none">
                                  {vocab.partOfSpeech}
                                </Badge>
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-xl">
                                <strong className="text-foreground font-semibold">Định nghĩa:</strong> {vocab.definition}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-xl">
                                <strong className="text-foreground font-semibold">Dịch nghĩa:</strong> {vocab.translation}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0 ml-4">
                              <Button
                                variant="outline"
                                onClick={() => setActiveEditor({ type: "edit_vocab", vocab })}
                                className="h-7 text-[9px] font-bold rounded-lg border px-2.5"
                              >
                                SỬA
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={async () => {
                                  if (confirm(`Bạn có chắc chắn muốn xóa từ vựng "${vocab.word}"?`)) {
                                    try {
                                      await deleteVocabulary.mutateAsync({ id: vocab.id });
                                      toast.success("Xóa từ vựng thành công!");
                                    } catch {
                                      // Handled
                                    }
                                  }
                                }}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Import Preview Modal */}
      <Dialog open={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border/80 shadow-2xl p-6 bg-background text-foreground">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
              Xem trước dữ liệu import ({importFileName})
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {importType === "vocab"
                ? `Hệ thống đã nhận diện được ${parsedVocabItems.length} từ vựng từ file Excel của bạn. Vui lòng rà soát lại thông tin bên dưới trước khi đồng ý nạp.`
                : `Hệ thống đã nhận diện được ${parsedQuizQuestions.length} câu hỏi từ file Excel của bạn. Vui lòng rà soát lại thông tin bên dưới trước khi đồng ý nạp.`}
            </DialogDescription>
          </DialogHeader>

          {importType === "quiz" && (
            <div className="flex flex-col gap-1.5 my-3 max-w-md">
              <Label htmlFor="import-quiz-title" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tiêu đề bài tập trắc nghiệm *
              </Label>
              <Input
                id="import-quiz-title"
                value={quizImportTitle}
                onChange={(e) => setQuizImportTitle(e.target.value)}
                placeholder="Ví dụ: Quiz: Grammar checkpoint 1"
                className="h-9 text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500/20"
              />
            </div>
          )}

          <div className="my-4 border rounded-xl overflow-hidden bg-muted/5 max-h-[40vh] overflow-y-auto">
            {importType === "vocab" ? (
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-12 text-center text-[10px] font-bold uppercase">STT</TableHead>
                    <TableHead className="w-32 text-[10px] font-bold uppercase">Từ vựng</TableHead>
                    <TableHead className="w-24 text-[10px] font-bold uppercase">Loại từ</TableHead>
                    <TableHead className="w-28 text-[10px] font-bold uppercase">Phiên âm</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">Định nghĩa &amp; Nghĩa Việt</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">Ví dụ &amp; Dịch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedVocabItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-center font-mono font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-foreground">{item.word}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-mono px-1 rounded bg-rose-500/5 text-rose-500 border-rose-500/10 uppercase">
                          {item.partOfSpeech}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">{item.phonetics}</TableCell>
                      <TableCell className="max-w-[200px] whitespace-normal break-words">
                        <div className="font-medium text-foreground">{item.definition}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{item.translation}</div>
                      </TableCell>
                      <TableCell className="max-w-[220px] whitespace-normal break-words">
                        <div className="italic text-foreground">{item.example}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{item.exampleTranslation}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-12 text-center text-[10px] font-bold uppercase">STT</TableHead>
                    <TableHead className="w-64 text-[10px] font-bold uppercase">Nội dung câu hỏi</TableHead>
                    <TableHead className="w-20 text-center text-[10px] font-bold uppercase">Thứ tự</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">Các phương án trả lời &amp; Giải thích</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedQuizQuestions.map((q, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-center font-mono font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-foreground max-w-[200px] whitespace-normal break-words">{q.content}</TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground">{q.order}</TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="space-y-1">
                          {q.answers.map((ans: any, aIdx: number) => (
                            <div key={aIdx} className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[8px] font-bold px-1 rounded-sm ${
                                  ans.isCorrect
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-muted text-muted-foreground border-border"
                                }`}
                              >
                                {ans.isCorrect ? "ĐÚNG" : "SAI"}
                              </Badge>
                              <span className="text-[11px] text-foreground">{ans.content}</span>
                            </div>
                          ))}
                          {q.explanation && (
                            <div className="text-[9px] text-muted-foreground mt-1.5 p-1.5 bg-muted/20 border rounded-lg whitespace-normal break-words">
                              <strong className="font-bold uppercase text-[8px] block mb-0.5">Giải thích:</strong>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="pt-3 border-t gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImportPreviewOpen(false)}
              className="h-9 text-xs font-bold rounded-xl"
            >
              HỦY
            </Button>
            <Button
              type="button"
              onClick={handleConfirmImport}
              disabled={importFromExcel.isPending || importQuizFromExcel.isPending}
              className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md px-5"
            >
              {importFromExcel.isPending || importQuizFromExcel.isPending ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ĐANG NẠP...
                </div>
              ) : (
                "XÁC NHẬN NẠP DỮ LIỆU"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
