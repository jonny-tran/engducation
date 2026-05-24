"use client";
import { useState, useEffect, useRef } from "react";
import { useLessonMutations } from "../../hooks/use-lesson-mutations";
import { useModuleMutations } from "../../hooks/use-module-mutations";
import { useWritingMutations } from "../../hooks/use-writing-mutations";
import { useQuizMutations } from "../../hooks/use-quiz-mutations";
import { useCloudinaryUpload } from "../../hooks/use-cloudinary-upload";
import { AdminQuizBuilder } from "./admin-quiz-builder";
import { AdminWritingBuilder } from "./admin-writing-builder";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@engducation/ui/components/alert-dialog";
import { Progress } from "@engducation/ui/components/progress";
import { Label } from "@engducation/ui/components/label";
import {
  Upload,
  X,
  Plus,
  Play,
  BookOpen,
  HelpCircle,
  PenTool,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  Folder,
  Sparkles,
  Loader2,
} from "lucide-react";

interface PeerItem {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  status: string;
  type: "lesson" | "quiz" | "writing";
  description?: string | null;
  videoPublicId?: string | null;
  videoUrl?: string | null;
  prompt?: string;
  rubric?: string;
  wordLimit?: number | null;
  suggestedAnswer?: string | null;
  questions?: any[];
}

interface ModuleData {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  contents: PeerItem[];
}

interface AdminLessonManagerProps {
  courseId: string;
  modules: ModuleData[];
  onManageVocabulary?: (moduleId: string) => void;
}

type ActiveEditorState =
  | { type: "empty" }
  | { type: "new_lesson"; moduleId: string }
  | { type: "edit_lesson"; lesson: PeerItem }
  | { type: "new_quiz"; moduleId: string }
  | { type: "edit_quiz"; quiz: PeerItem }
  | { type: "new_writing"; moduleId: string }
  | { type: "edit_writing"; writing: PeerItem };

export function AdminLessonManager({ courseId, modules, onManageVocabulary }: AdminLessonManagerProps) {
  // Mutations hooks
  const { createLesson, updateLesson, deleteLesson, reorderContent } = useLessonMutations(courseId);
  const { createModule, updateModule, deleteModule } = useModuleMutations(courseId);
  const { deleteWriting } = useWritingMutations(courseId);
  const { deleteQuiz } = useQuizMutations(courseId);
  const { upload } = useCloudinaryUpload();

  // Component states
  const [activeEditor, setActiveEditor] = useState<ActiveEditorState>({ type: "empty" });
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  const [editingModuleDesc, setEditingModuleDesc] = useState("");

  // Lesson Form states
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonType, setLessonType] = useState<"TEXT" | "VIDEO">("TEXT");
  const [videoPublicId, setVideoPublicId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [lessonStatus, setLessonStatus] = useState<"draft" | "published" | "archived">("draft");
  const [lessonOrder, setLessonOrder] = useState("");

  // Cloudinary video upload states
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-expand first module if none is expanded
  useEffect(() => {
    if (modules.length > 0 && Object.keys(expandedModules).length === 0) {
      setExpandedModules({ [modules[0]!.id]: true });
    }
  }, [modules]);

  const toggleModuleExpand = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    await createModule.mutateAsync({
      courseId,
      title: newModuleTitle.trim(),
    });
    setNewModuleTitle("");
  };

  const handleStartRenameModule = (mod: ModuleData) => {
    setEditingModuleId(mod.id);
    setEditingModuleTitle(mod.title);
    setEditingModuleDesc(mod.description ?? "");
  };

  const handleSaveRenameModule = async () => {
    if (!editingModuleTitle.trim() || !editingModuleId) return;
    await updateModule.mutateAsync({
      id: editingModuleId,
      title: editingModuleTitle.trim(),
      description: editingModuleDesc.trim() || undefined,
    });
    setEditingModuleId(null);
  };

  const handleDeleteModule = async (modId: string) => {
    await deleteModule.mutateAsync({ id: modId });
    if (activeEditor.type !== "empty") {
      setActiveEditor({ type: "empty" });
    }
  };

  // Lesson Form management
  const resetLessonForm = () => {
    setLessonTitle("");
    setLessonDescription("");
    setLessonType("TEXT");
    setVideoPublicId("");
    setVideoUrl("");
    setLessonStatus("draft");
    setLessonOrder("");
    setUploadProgress(null);
    setIsUploading(false);
  };

  useEffect(() => {
    if (activeEditor.type === "edit_lesson") {
      const { lesson } = activeEditor;
      setLessonTitle(lesson.title);
      setLessonDescription(lesson.description ?? "");
      setLessonType(lesson.videoUrl || lesson.videoPublicId ? "VIDEO" : "TEXT");
      setVideoPublicId(lesson.videoPublicId ?? "");
      setVideoUrl(lesson.videoUrl ?? "");
      setLessonStatus(lesson.status as any);
      setLessonOrder(lesson.order.toString());
    } else {
      resetLessonForm();
    }
  }, [activeEditor]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      window.alert("Vui lòng chọn tệp video hợp lệ");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      window.alert("Tệp video quá lớn (tối đa 500MB)");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await upload.mutateAsync({
        file,
        onProgress: (progress) => {
          setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
        },
      });
      setVideoPublicId(result.publicId);
      setVideoUrl(result.secureUrl);
      setUploadProgress(100);
    } catch {
      // Toast handles error automatically
    } finally {
      setIsUploading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      status: lessonStatus,
      order: lessonOrder ? parseInt(lessonOrder, 10) : undefined,
    };

    if (activeEditor.type === "edit_lesson") {
      await updateLesson.mutateAsync({
        id: activeEditor.lesson.id,
        ...payload,
      });
    } else if (activeEditor.type === "new_lesson") {
      await createLesson.mutateAsync({
        moduleId: activeEditor.moduleId,
        ...payload,
      });
    }
    setActiveEditor({ type: "empty" });
  };

  const handleDeleteItem = async (item: PeerItem) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài học/bài tập "${item.title}"?`)) {
      if (item.type === "lesson") {
        await deleteLesson.mutateAsync({ id: item.id });
      } else if (item.type === "quiz") {
        await deleteQuiz.mutateAsync({ id: item.id });
      } else if (item.type === "writing") {
        await deleteWriting.mutateAsync({ id: item.id });
      }

      if (
        (activeEditor.type === "edit_lesson" && activeEditor.lesson.id === item.id) ||
        (activeEditor.type === "edit_quiz" && activeEditor.quiz.id === item.id) ||
        (activeEditor.type === "edit_writing" && activeEditor.writing.id === item.id)
      ) {
        setActiveEditor({ type: "empty" });
      }
    }
  };

  const handleMove = async (mod: ModuleData, currentIndex: number, direction: "UP" | "DOWN") => {
    const targetIndex = direction === "UP" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= mod.contents.length) return;

    const currentItem = mod.contents[currentIndex]!;
    const adjacentItem = mod.contents[targetIndex]!;

    await reorderContent.mutateAsync({
      moduleId: mod.id,
      movements: [
        { id: currentItem.id, type: currentItem.type, order: adjacentItem.order },
        { id: adjacentItem.id, type: adjacentItem.type, order: currentItem.order },
      ],
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN: MODULE LIST & ACCORDIONS (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Module creator */}
        <Card className="border border-muted/60 dark:border-muted/30 bg-gradient-to-b from-card to-muted/10 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden transition-all duration-300">
          <CardHeader className="py-3 px-5 border-b border-muted/40 dark:border-muted/20 bg-muted/10 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-card-foreground flex items-center gap-2">
              <FolderPlus className="h-4.5 w-4.5 text-emerald-500" />
              Thêm tuần / Module học mới
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleAddModule} className="flex gap-3">
              <Input
                required
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Ví dụ: Tuần 1: Giới thiệu thì hiện tại đơn..."
                className="h-9 text-xs flex-1 rounded-xl border-muted/60 bg-background/50 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all duration-200"
              />
              <Button type="submit" disabled={createModule.isPending} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs h-9 rounded-xl px-4.5 shadow-sm active:scale-95 transition-all">
                <Plus className="h-4 w-4 mr-1" /> Thêm Module
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Modules Accordion list */}
        <div className="space-y-4">
          {modules.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-muted-foreground/20 bg-card/20 rounded-2xl">
              <p className="text-xs text-muted-foreground italic font-medium">Chưa có module nào. Hãy nhập tên module phía trên để bắt đầu tạo giáo trình.</p>
            </div>
          ) : (
            modules.map((mod, modIdx) => {
              const isExpanded = !!expandedModules[mod.id];
              const isEditing = editingModuleId === mod.id;

              return (
                <Card
                  key={mod.id}
                  className={`border transition-all duration-300 rounded-2xl overflow-hidden ${
                    isExpanded
                      ? "border-emerald-500/30 bg-gradient-to-b from-card to-emerald-500/5 dark:to-emerald-950/5 shadow-md"
                      : "border-muted/60 dark:border-muted/30 bg-card/40 hover:bg-card/60"
                  }`}
                >
                  {/* Module Header */}
                  <div className="p-4 border-b border-muted/40 dark:border-muted/20 flex items-center justify-between gap-3 bg-muted/10 dark:bg-muted/5 select-none">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={() => toggleModuleExpand(mod.id)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground/80 shrink-0 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                      </button>
                      <Folder className="h-5 w-5 text-emerald-500 shrink-0" />
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Input
                            value={editingModuleTitle}
                            onChange={(e) => setEditingModuleTitle(e.target.value)}
                            className="h-8.5 text-xs font-bold bg-background py-1 flex-1 rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                            placeholder="Tiêu đề module..."
                          />
                          <Input
                            value={editingModuleDesc}
                            onChange={(e) => setEditingModuleDesc(e.target.value)}
                            className="h-8.5 text-[11px] bg-background py-1 flex-1 rounded-xl border-muted/60"
                            placeholder="Mô tả module học..."
                          />
                          <Button onClick={handleSaveRenameModule} size="sm" className="h-8.5 bg-emerald-500 hover:bg-emerald-600 text-[10px] font-bold px-3.5 rounded-xl shrink-0">LƯU</Button>
                          <Button onClick={() => setEditingModuleId(null)} variant="outline" size="sm" className="h-8.5 text-[10px] px-3.5 rounded-xl border-muted/60 shrink-0">HỦY</Button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleModuleExpand(mod.id)}>
                          <div className="text-xs font-bold text-foreground flex items-center gap-2 flex-wrap">
                            <span>Module {modIdx + 1}: {mod.title}</span>
                            <Badge variant="outline" className="text-[9px] font-semibold border-emerald-500/20 text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                              {mod.contents.length} NỘI DUNG
                            </Badge>
                          </div>
                          {mod.description && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-lg">{mod.description}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          onClick={() => handleStartRenameModule(mod)}
                          className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-xl transition-all"
                          title="Sửa thông tin Module"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                title="Xóa Module"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <AlertDialogContent className="rounded-2xl border border-border/80 shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-sm font-bold uppercase">Xác nhận xóa Module học</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground mt-2">
                                Bạn có chắc chắn muốn xóa Module <strong>&ldquo;{mod.title}&rdquo;</strong>? Hành động này yêu cầu Module phải trống (không chứa bài học, quiz, viết luận nào) và không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4 gap-2">
                              <AlertDialogCancel className="rounded-xl h-9 text-xs font-bold">Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteModule(mod.id)}
                                disabled={deleteModule.isPending}
                                className="rounded-xl h-9 text-xs font-bold bg-destructive hover:bg-destructive"
                              >
                                {deleteModule.isPending ? "Đang xóa..." : "Xóa Module"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>

                  {/* Module Content list (Lessons, Quizzes, Essays) */}
                  {isExpanded && (
                    <CardContent className="p-4 space-y-3 bg-card/20 backdrop-blur-md">
                      {mod.contents.length === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground italic bg-muted/10 dark:bg-muted/5 rounded-xl border border-dashed border-muted-foreground/10">Không có nội dung học trình nào trong module này.</p>
                      ) : (
                        <div className="space-y-3">
                          {mod.contents.map((item, itemIdx) => {
                            let icon = <BookOpen className="h-3.5 w-3.5 text-blue-500" />;
                            let badgeStyle = "border-blue-500/20 text-blue-600 bg-blue-500/5";
                            let badgeName = "BÀI ĐỌC";
                            let cardStyle = "hover:border-blue-500/25 hover:shadow-xs";

                            if (item.type === "lesson" && (item.videoPublicId || item.videoUrl)) {
                                icon = <Play className="h-3.5 w-3.5 text-indigo-500" />;
                                badgeStyle = "border-indigo-500/20 text-indigo-600 bg-indigo-500/5";
                                badgeName = "VIDEO";
                                cardStyle = "hover:border-indigo-500/25 hover:shadow-xs";
                            } else if (item.type === "quiz") {
                              icon = <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />;
                              badgeStyle = "border-emerald-500/20 text-emerald-600 bg-emerald-500/5";
                              badgeName = "TRẮC NGHIỆM";
                              cardStyle = "hover:border-emerald-500/25 hover:shadow-xs";
                            } else if (item.type === "writing") {
                              icon = <PenTool className="h-3.5 w-3.5 text-amber-500" />;
                              badgeStyle = "border-amber-500/20 text-amber-600 bg-amber-500/5";
                              badgeName = "TẬP VIẾT AI";
                              cardStyle = "hover:border-amber-500/25 hover:shadow-xs";
                            }

                            const isActive =
                              (activeEditor.type === "edit_lesson" && activeEditor.lesson.id === item.id) ||
                              (activeEditor.type === "edit_quiz" && activeEditor.quiz.id === item.id) ||
                              (activeEditor.type === "edit_writing" && activeEditor.writing.id === item.id);

                            return (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between gap-3 p-3 rounded-xl border bg-background/50 hover:bg-background/80 transition-all duration-200 ${cardStyle} ${
                                  isActive ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/5 shadow-xs" : "border-muted/50 dark:border-muted/30"
                                }`}
                              >
                                {/* Left Item details */}
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="font-mono text-[10px] text-muted-foreground/60 shrink-0 w-4 text-center font-bold">
                                    {item.order}
                                  </div>
                                  <div className="p-2 bg-muted/40 dark:bg-muted/10 rounded-xl shrink-0">
                                    {icon}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-foreground truncate max-w-[200px] md:max-w-xs">{item.title}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Badge variant="outline" className={`text-[8px] font-extrabold px-1.5 py-0 rounded-full ${badgeStyle}`}>
                                        {badgeName}
                                      </Badge>
                                      <Badge variant="outline" className={`text-[8px] font-extrabold px-1.5 py-0 rounded-full uppercase ${
                                        item.status === "published"
                                          ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/5"
                                          : "border-amber-500/20 text-amber-600 bg-amber-500/5"
                                      }`}>
                                        {item.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Item operations */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Edit button */}
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      if (item.type === "lesson") {
                                        setActiveEditor({ type: "edit_lesson", lesson: item });
                                      } else if (item.type === "quiz") {
                                        setActiveEditor({ type: "edit_quiz", quiz: item });
                                      } else if (item.type === "writing") {
                                        setActiveEditor({ type: "edit_writing", writing: item });
                                      }
                                    }}
                                    className="h-7 text-[10px] font-bold px-3 border border-muted/60 bg-background hover:bg-muted/10 text-muted-foreground hover:text-foreground rounded-lg active:scale-95 transition-all"
                                  >
                                    SỬA
                                  </Button>
                                  {/* Delete button */}
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDeleteItem(item)}
                                    className="h-7 text-[10px] font-bold px-3 border border-muted/60 bg-background text-destructive hover:bg-destructive hover:text-white rounded-lg active:scale-95 transition-all"
                                  >
                                    XÓA
                                  </Button>

                                  {/* Reordering */}
                                  <div className="flex flex-col md:flex-row gap-0.5 shrink-0 border border-muted/40 rounded-lg overflow-hidden bg-background">
                                    <Button
                                      variant="ghost"
                                      disabled={itemIdx === 0 || reorderContent.isPending}
                                      onClick={() => handleMove(mod, itemIdx, "UP")}
                                      className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-none transition-colors"
                                    >
                                      <ArrowUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      disabled={itemIdx === mod.contents.length - 1 || reorderContent.isPending}
                                      onClick={() => handleMove(mod, itemIdx, "DOWN")}
                                      className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-none transition-colors"
                                    >
                                      <ArrowDown className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add new items triggers row */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-dashed border-muted-foreground/20 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveEditor({ type: "new_lesson", moduleId: mod.id })}
                          className="h-7.5 text-[9px] font-bold border-blue-500/20 text-blue-600 hover:bg-blue-500/5 px-2.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> BÀI HỌC
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveEditor({ type: "new_quiz", moduleId: mod.id })}
                          className="h-7.5 text-[9px] font-bold border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 px-2.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> TRẮC NGHIỆM
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveEditor({ type: "new_writing", moduleId: mod.id })}
                          className="h-7.5 text-[9px] font-bold border-amber-500/20 text-amber-600 hover:bg-amber-500/5 px-2.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> VIẾT LUẬN AI
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onManageVocabulary?.(mod.id)}
                          className="h-7.5 text-[9px] font-bold border-purple-500/20 text-purple-600 hover:bg-purple-500/5 px-2.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> TỪ VỰNG
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DYNAMIC WORKSPACE EDITOR (1/3 width) */}
      <div>
        {activeEditor.type === "empty" ? (
          <Card className="border border-muted/60 dark:border-muted/30 bg-gradient-to-b from-card to-muted/10 backdrop-blur-md shadow-lg p-6 text-center sticky top-6 rounded-2xl">
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 scale-110 mb-1 shrink-0">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-card-foreground">Khu vực cấu hình học trình</h3>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed mt-1">
                Nhấp vào nút <strong className="text-emerald-500 font-semibold">Sửa</strong> trên một bài học/bài tập có sẵn, hoặc nhấn các nút <strong className="text-emerald-500 font-semibold">Thêm mới (+)</strong> ở cuối mỗi Module để bắt đầu thiết lập.
              </p>
            </div>
          </Card>
        ) : activeEditor.type === "new_lesson" || activeEditor.type === "edit_lesson" ? (
          <Card className="border border-muted/60 dark:border-muted/30 bg-gradient-to-b from-card to-muted/10 backdrop-blur-md shadow-lg sticky top-6 rounded-2xl overflow-hidden">
            <CardHeader className="py-4 border-b border-muted/40 dark:border-muted/20 bg-muted/20 dark:bg-muted/10 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-card-foreground flex items-center gap-2">
                <div className="p-1 bg-blue-500/10 rounded-lg text-blue-500 shrink-0">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span>{activeEditor.type === "edit_lesson" ? "Sửa bài học" : "Thêm bài học mới"}</span>
              </CardTitle>
              <Button
                variant="ghost"
                onClick={() => setActiveEditor({ type: "empty" })}
                className="h-7 w-7 p-0 rounded-lg text-muted-foreground/60 hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleLessonSubmit} className="space-y-4">
                
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lesson-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Tiêu đề bài học <span className="text-rose-500">*</span></Label>
                  <Input
                    id="lesson-title"
                    required
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài học..."
                    className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lesson-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Mô tả ngắn</Label>
                  <Textarea
                    id="lesson-desc"
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    placeholder="Mô tả tóm tắt nội dung bài giảng..."
                    className="min-h-[68px] text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lesson-type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Loại bài học</Label>
                    <select
                      id="lesson-type"
                      value={lessonType}
                      onChange={(e) => setLessonType(e.target.value as "TEXT" | "VIDEO")}
                      className="flex h-9 w-full rounded-xl border border-muted/60 bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 dark:bg-muted/10 dark:border-muted/30"
                    >
                      <option value="TEXT">Bài đọc (TEXT)</option>
                      <option value="VIDEO">Bài giảng video (VIDEO)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lesson-order" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Thứ tự (Order)</Label>
                    <Input
                      id="lesson-order"
                      type="number"
                      min="1"
                      value={lessonOrder}
                      onChange={(e) => setLessonOrder(e.target.value)}
                      placeholder="Trống = Tự tăng"
                      className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Video Upload fields */}
                {lessonType === "VIDEO" && (
                  <div className="p-4 border border-dashed border-muted-foreground/30 bg-muted/10 dark:bg-muted/5 space-y-3.5 rounded-2xl">
                    <div className="flex flex-col gap-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Tệp video bài giảng</Label>

                      {videoPublicId && !isUploading && (
                        <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2 text-[10px] shadow-xs">
                          <span className="text-indigo-600 dark:text-indigo-400 truncate flex-1 font-mono">
                            ID: {videoPublicId}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setVideoPublicId("");
                              setVideoUrl("");
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors ml-2 shrink-0 p-0.5 rounded hover:bg-muted"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {isUploading && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1 font-bold text-indigo-600 animate-pulse">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Đang upload video lên Cloudinary...
                            </span>
                            <span className="font-mono font-bold text-indigo-600">{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress ?? 0} className="h-1.5 bg-indigo-100 dark:bg-indigo-950/20 [&>div]:bg-indigo-600" />
                        </div>
                      )}

                      {!isUploading && !videoPublicId && (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="video-upload"
                          />
                          <label
                            htmlFor="video-upload"
                            className="flex flex-col items-center justify-center gap-2 border border-dashed border-muted-foreground/30 bg-background/50 hover:bg-indigo-500/5 hover:border-indigo-500/50 cursor-pointer rounded-2xl py-6 transition-all duration-200"
                          >
                            <Upload className="h-5.5 w-5.5 text-indigo-500 shrink-0 group-hover:scale-105 transition-transform" />
                            <span className="text-[11px] font-bold text-foreground">Tải video bài giảng lên</span>
                            <span className="text-[9px] text-muted-foreground text-center">Video định dạng tối đa 500MB</span>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-muted/40 dark:border-muted/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveEditor({ type: "empty" })}
                    className="h-9 text-xs font-bold px-4.5 border border-muted/60 bg-background hover:bg-muted/10 text-muted-foreground hover:text-foreground rounded-xl active:scale-95 transition-all"
                  >
                    HỦY
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLesson.isPending || updateLesson.isPending || isUploading}
                    className="h-9 text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md px-5 active:scale-95 transition-all duration-200 hover:shadow-blue-500/20 hover:shadow-lg"
                  >
                    {createLesson.isPending || updateLesson.isPending ? (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ĐANG LƯU...
                      </div>
                    ) : activeEditor.type === "edit_lesson" ? (
                      "CẬP NHẬT"
                    ) : (
                      "THÊM MỚI"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : activeEditor.type === "new_quiz" || activeEditor.type === "edit_quiz" ? (
          <div className="sticky top-6">
            <AdminQuizBuilder
              courseId={courseId}
              moduleId={activeEditor.type === "new_quiz" ? activeEditor.moduleId : activeEditor.quiz.moduleId}
              quiz={activeEditor.type === "edit_quiz" ? (activeEditor.quiz as any) : undefined}
              onFinished={() => setActiveEditor({ type: "empty" })}
            />
          </div>
        ) : activeEditor.type === "new_writing" || activeEditor.type === "edit_writing" ? (
          <div className="sticky top-6">
            <AdminWritingBuilder
              courseId={courseId}
              moduleId={activeEditor.type === "new_writing" ? activeEditor.moduleId : activeEditor.writing.moduleId}
              writingAssignment={activeEditor.type === "edit_writing" ? (activeEditor.writing as any) : undefined}
              onFinished={() => setActiveEditor({ type: "empty" })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
