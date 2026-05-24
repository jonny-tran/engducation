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
        <Card className="border border-border bg-card/60 backdrop-blur-md shadow-sm">
          <CardHeader className="py-3 border-b border-border bg-muted/10 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FolderPlus className="h-4 w-4 text-emerald-500" />
              Thêm tuần / Module học mới
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <form onSubmit={handleAddModule} className="flex gap-2">
              <Input
                required
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Ví dụ: Tuần 1: Giới thiệu thì hiện tại đơn..."
                className="text-xs flex-1 bg-background/50 focus-visible:ring-emerald-500/50"
              />
              <Button type="submit" disabled={createModule.isPending} className="bg-emerald-500 hover:bg-emerald-600 font-bold text-xs h-9">
                <Plus className="h-3.5 w-3.5 mr-1" /> Thêm Module
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Modules Accordion list */}
        <div className="space-y-4">
          {modules.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border bg-card/40 rounded-lg">
              <p className="text-xs text-muted-foreground italic">Chưa có module nào. Hãy nhập tên module phía trên để bắt đầu tạo giáo trình.</p>
            </div>
          ) : (
            modules.map((mod, modIdx) => {
              const isExpanded = !!expandedModules[mod.id];
              const isEditing = editingModuleId === mod.id;

              return (
                <Card
                  key={mod.id}
                  className={`border transition-all duration-300 ${
                    isExpanded ? "border-emerald-500/30 bg-card/80 shadow-md" : "border-border bg-card/40 hover:bg-card/60"
                  }`}
                >
                  {/* Module Header */}
                  <div className="p-3 border-b border-border flex items-center justify-between gap-3 bg-muted/5 select-none">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleModuleExpand(mod.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <Folder className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Input
                            value={editingModuleTitle}
                            onChange={(e) => setEditingModuleTitle(e.target.value)}
                            className="h-8 text-xs font-bold bg-background py-1 flex-1 focus-visible:ring-emerald-500/50"
                            placeholder="Tiêu đề module..."
                          />
                          <Input
                            value={editingModuleDesc}
                            onChange={(e) => setEditingModuleDesc(e.target.value)}
                            className="h-8 text-[11px] bg-background py-1 flex-1"
                            placeholder="Mô tả module học..."
                          />
                          <Button onClick={handleSaveRenameModule} size="sm" className="h-8 bg-emerald-500 hover:bg-emerald-600 text-[10px] font-bold py-0 px-2 shrink-0">LƯU</Button>
                          <Button onClick={() => setEditingModuleId(null)} variant="outline" size="sm" className="h-8 text-[10px] py-0 px-2 shrink-0">HỦY</Button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0" onClick={() => toggleModuleExpand(mod.id)}>
                          <div className="text-xs font-bold text-foreground flex items-center gap-2">
                            <span>Module {modIdx + 1}: {mod.title}</span>
                            <Badge variant="outline" className="text-[9px] font-mono border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
                              {mod.contents.length} NỘI DUNG
                            </Badge>
                          </div>
                          {mod.description && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{mod.description}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          onClick={() => handleStartRenameModule(mod)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Sửa thông tin Module"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                title="Xóa Module"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa Module học?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa Module <strong>&ldquo;{mod.title}&rdquo;</strong>? Hành động này yêu cầu Module phải trống (không chứa bài học, quiz, viết luận nào) và không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteModule(mod.id)}
                                disabled={deleteModule.isPending}
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
                    <CardContent className="p-3 space-y-2">
                      {mod.contents.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted-foreground italic bg-muted/10 rounded">Không có nội dung nào trong module này.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {mod.contents.map((item, itemIdx) => {
                            let icon = <BookOpen className="h-3.5 w-3.5 text-blue-500" />;
                            let badgeStyle = "border-blue-500/20 text-blue-600 bg-blue-500/5";
                            let badgeName = "BÀI ĐỌC";
                            let cardStyle = "hover:border-blue-500/20";

                            if (item.type === "lesson" && (item.videoPublicId || item.videoUrl)) {
                              icon = <Play className="h-3.5 w-3.5 text-indigo-500" />;
                              badgeStyle = "border-indigo-500/20 text-indigo-600 bg-indigo-500/5";
                              badgeName = "VIDEO";
                              cardStyle = "hover:border-indigo-500/20";
                            } else if (item.type === "quiz") {
                              icon = <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />;
                              badgeStyle = "border-emerald-500/20 text-emerald-600 bg-emerald-500/5";
                              badgeName = "TRẮC NGHIỆM";
                              cardStyle = "hover:border-emerald-500/20";
                            } else if (item.type === "writing") {
                              icon = <PenTool className="h-3.5 w-3.5 text-amber-500" />;
                              badgeStyle = "border-amber-500/20 text-amber-600 bg-amber-500/5";
                              badgeName = "TẬP VIẾT AI";
                              cardStyle = "hover:border-amber-500/20";
                            }

                            const isActive =
                              (activeEditor.type === "edit_lesson" && activeEditor.lesson.id === item.id) ||
                              (activeEditor.type === "edit_quiz" && activeEditor.quiz.id === item.id) ||
                              (activeEditor.type === "edit_writing" && activeEditor.writing.id === item.id);

                            return (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between gap-3 p-2.5 rounded-md border bg-background/50 hover:bg-background/80 transition-all duration-200 ${cardStyle} ${
                                  isActive ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/5 shadow-sm" : "border-border"
                                }`}
                              >
                                {/* Left Item details */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="font-mono text-[10px] text-muted-foreground shrink-0 w-4">
                                    {item.order}
                                  </div>
                                  <div className="p-1.5 rounded bg-muted shrink-0">
                                    {icon}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-foreground truncate">{item.title}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Badge variant="outline" className={`text-[8px] font-bold px-1 py-0 ${badgeStyle}`}>
                                        {badgeName}
                                      </Badge>
                                      <Badge variant="outline" className={`text-[8px] font-bold px-1 py-0 uppercase ${
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
                                <div className="flex items-center gap-1 shrink-0">
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
                                    className="h-7 text-[10px] font-bold px-2 border"
                                  >
                                    SỬA
                                  </Button>
                                  {/* Delete button */}
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDeleteItem(item)}
                                    className="h-7 text-[10px] font-bold px-2 text-destructive hover:bg-destructive hover:text-white"
                                  >
                                    XÓA
                                  </Button>

                                  {/* Reordering */}
                                  <Button
                                    variant="ghost"
                                    disabled={itemIdx === 0 || reorderContent.isPending}
                                    onClick={() => handleMove(mod, itemIdx, "UP")}
                                    className="h-7 w-7 p-0 shrink-0 text-muted-foreground"
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    disabled={itemIdx === mod.contents.length - 1 || reorderContent.isPending}
                                    onClick={() => handleMove(mod, itemIdx, "DOWN")}
                                    className="h-7 w-7 p-0 shrink-0 text-muted-foreground"
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add new items triggers row */}
                      <div className="flex flex-wrap gap-2 pt-2.5 border-t border-dashed border-border justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveEditor({ type: "new_lesson", moduleId: mod.id })}
                          className="h-7 text-[9px] font-bold border-blue-500/20 text-blue-600 hover:bg-blue-500/5"
                        >
                          <Plus className="h-3 w-3 mr-1" /> + BÀI HỌC
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveEditor({ type: "new_quiz", moduleId: mod.id })}
                          className="h-7 text-[9px] font-bold border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5"
                        >
                          <Plus className="h-3 w-3 mr-1" /> + TRẮC NGHIỆM
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveEditor({ type: "new_writing", moduleId: mod.id })}
                          className="h-7 text-[9px] font-bold border-amber-500/20 text-amber-600 hover:bg-amber-500/5"
                        >
                          <Plus className="h-3 w-3 mr-1" /> + VIẾT LUẬN AI
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onManageVocabulary?.(mod.id)}
                          className="h-7 text-[9px] font-bold border-purple-500/20 text-purple-600 hover:bg-purple-500/5"
                        >
                          <Plus className="h-3 w-3 mr-1" /> + TỪ VỰNG
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
          <Card className="border border-border bg-card/40 backdrop-blur-md shadow-lg p-6 text-center sticky top-6">
            <div className="py-12 flex flex-col items-center justify-center space-y-3.5">
              <div className="p-4 rounded-full bg-muted text-muted-foreground/60 scale-110 mb-2">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Khu vực cấu hình học trình</h3>
              <p className="text-[11px] text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
                Nhấp vào nút <strong className="text-emerald-500">Sửa</strong> trên một bài học/bài tập có sẵn, hoặc nhấn các nút <strong className="text-emerald-500">Thêm mới (+)</strong> ở cuối mỗi Module để bắt đầu thiết lập.
              </p>
            </div>
          </Card>
        ) : activeEditor.type === "new_lesson" || activeEditor.type === "edit_lesson" ? (
          <Card className="border border-border bg-card/60 backdrop-blur-md shadow-lg sticky top-6">
            <CardHeader className="py-3 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                {activeEditor.type === "edit_lesson" ? "Sửa bài học" : "Thêm bài học mới"}
              </CardTitle>
              <Button variant="ghost" onClick={() => setActiveEditor({ type: "empty" })} className="h-6 w-6 p-0">
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
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="font-bold uppercase text-muted-foreground">Mô tả ngắn</Label>
                  <Textarea
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    placeholder="Mô tả tóm tắt nội dung bài giảng..."
                    className="min-h-[60px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="font-bold uppercase text-muted-foreground">Loại bài học</Label>
                    <select
                      value={lessonType}
                      onChange={(e) => setLessonType(e.target.value as "TEXT" | "VIDEO")}
                      className="flex h-8 w-full border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
                    >
                      <option value="TEXT">Bài đọc (TEXT)</option>
                      <option value="VIDEO">Bài giảng video (VIDEO)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="font-bold uppercase text-muted-foreground">Thứ tự (Order)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={lessonOrder}
                      onChange={(e) => setLessonOrder(e.target.value)}
                      placeholder="Trống = Tự tăng"
                    />
                  </div>
                </div>

                {/* Video Upload fields */}
                {lessonType === "VIDEO" && (
                  <div className="p-3 border border-dashed border-border bg-muted/20 space-y-3.5 rounded-md">
                    <div className="flex flex-col gap-1.5">
                      <Label className="font-bold uppercase text-muted-foreground text-[10px]">Tệp video bài giảng</Label>

                      {videoPublicId && !isUploading && (
                        <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-1.5 text-[10px]">
                          <span className="text-indigo-600 dark:text-indigo-400 truncate flex-1 font-mono">
                            {videoPublicId}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setVideoPublicId("");
                              setVideoUrl("");
                            }}
                            className="text-muted-foreground hover:text-destructive ml-2 shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {isUploading && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Upload className="h-3 w-3 animate-pulse text-indigo-500" />
                              Đang upload lên Cloudinary...
                            </span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress ?? 0} className="h-1.5" />
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
                            className="flex items-center justify-center gap-2 h-9 border border-border bg-background hover:bg-muted cursor-pointer rounded text-[10px] font-bold transition-colors"
                          >
                            <Upload className="h-3.5 w-3.5 text-indigo-500" />
                            Chọn video từ thiết bị
                          </label>
                          <p className="text-[9px] text-muted-foreground text-center">Tối đa 500MB. Hệ thống sẽ tối ưu hóa luồng phát.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}


                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setActiveEditor({ type: "empty" })} className="font-bold">
                    HỦY
                  </Button>
                  <Button type="submit" disabled={createLesson.isPending || updateLesson.isPending || isUploading} className="bg-blue-500 hover:bg-blue-600 font-bold text-white">
                    {createLesson.isPending || updateLesson.isPending ? "ĐANG LƯU..." : activeEditor.type === "edit_lesson" ? "CẬP NHẬT" : "THÊM MỚI"}
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
