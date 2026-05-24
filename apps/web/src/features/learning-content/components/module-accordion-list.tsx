"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModuleMutations } from "../hooks/use-module-mutations";
import { useLessonMutations } from "../hooks/use-lesson-mutations";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
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
import {
  ChevronDown,
  ChevronUp,
  Folder,
  FolderPlus,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  BookOpen,
  Play,
  HelpCircle,
  PenTool,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface PeerItem {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  status: string;
  type: "lesson" | "quiz" | "writing";
}

interface ModuleData {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  contents: PeerItem[];
}

interface ModuleAccordionListProps {
  adminId: string;
  courseId: string;
  modules: ModuleData[];
}

export function ModuleAccordionList({ adminId, courseId, modules }: ModuleAccordionListProps) {
  const router = useRouter();
  const { createModule, updateModule, deleteModule } = useModuleMutations(courseId);
  const { reorderContent } = useLessonMutations(courseId);

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  const [editingModuleDesc, setEditingModuleDesc] = useState("");

  // Expand the first module initially
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
  };

  const handleMoveContent = async (mod: ModuleData, currentIndex: number, direction: "UP" | "DOWN") => {
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
    <div className="space-y-6">
      {/* Quick Add Module Card */}
      <Card className="border border-border/60 bg-card/60 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="py-3.5 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-rose-500" />
            Thêm tuần / học phần mới
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleAddModule} className="flex gap-2">
            <Input
              required
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Ví dụ: Tuần 1: Giới thiệu thì hiện tại đơn..."
              className="text-xs flex-1 bg-background/50 border-border/80 focus:border-rose-500/50 rounded-xl"
            />
            <Button
              type="submit"
              disabled={createModule.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 rounded-xl shadow-md shadow-rose-600/10 shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Thêm Module
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Collapsible Accordion Modules List */}
      <div className="space-y-4">
        {modules.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border/60 bg-card/20 rounded-2xl">
            <p className="text-xs text-muted-foreground italic">
              Chưa có học phần nào. Nhập tiêu đề học phần ở trên để bắt đầu thiết kế lộ trình.
            </p>
          </div>
        ) : (
          modules.map((mod, modIdx) => {
            const isExpanded = !!expandedModules[mod.id];
            const isEditing = editingModuleId === mod.id;
            const totalLessons = mod.contents.filter((c) => c.type === "lesson").length;
            const totalQuizzes = mod.contents.filter((c) => c.type === "quiz").length;
            const totalWritings = mod.contents.filter((c) => c.type === "writing").length;

            return (
              <Card
                key={mod.id}
                className={`border transition-all duration-300 rounded-2xl overflow-hidden ${
                  isExpanded
                    ? "border-rose-500/25 bg-card/85 shadow-md"
                    : "border-border/60 bg-card/30 hover:bg-card/50"
                }`}
              >
                {/* Module Header wrapper */}
                <div className="p-4 border-b border-border/50 flex items-center justify-between gap-4 bg-muted/5 select-none">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleModuleExpand(mod.id)}
                      className="p-1 rounded-xl hover:bg-muted text-muted-foreground transition-colors shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <Folder className="h-5 w-5 text-rose-500 shrink-0" />

                    {isEditing ? (
                      <div className="flex flex-col md:flex-row gap-2 flex-1 min-w-0">
                        <Input
                          value={editingModuleTitle}
                          onChange={(e) => setEditingModuleTitle(e.target.value)}
                          className="h-8.5 text-xs font-bold bg-background focus:border-rose-500/50 rounded-xl"
                          placeholder="Tiêu đề học phần..."
                        />
                        <Input
                          value={editingModuleDesc}
                          onChange={(e) => setEditingModuleDesc(e.target.value)}
                          className="h-8.5 text-[11px] bg-background rounded-xl"
                          placeholder="Mô tả tóm tắt học phần..."
                        />
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            onClick={handleSaveRenameModule}
                            size="sm"
                            className="h-8.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold py-0 px-3 rounded-xl shadow-xs"
                          >
                            Lưu
                          </Button>
                          <Button
                            onClick={() => setEditingModuleId(null)}
                            variant="outline"
                            size="sm"
                            className="h-8.5 text-[10px] py-0 px-3 rounded-xl"
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleModuleExpand(mod.id)}>
                        <div className="text-xs font-bold text-foreground flex flex-wrap items-center gap-2">
                          <span>
                            Học phần {modIdx + 1}: {mod.title}
                          </span>
                          <Badge variant="outline" className="text-[9px] font-bold border-rose-500/20 text-rose-600 bg-rose-500/5 px-2 py-0.5 rounded-full uppercase">
                            {mod.contents.length} Nội dung
                          </Badge>
                        </div>
                        {mod.description && (
                          <div className="text-[10px] text-muted-foreground mt-1 line-clamp-1 leading-relaxed">
                            {mod.description}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        onClick={() => handleStartRenameModule(mod)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl"
                        title="Sửa thông tin Học phần"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                              title="Xóa Học phần"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <AlertDialogContent className="rounded-2xl border border-border/80 shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-sm font-bold uppercase">Xác nhận xóa Học phần?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground mt-2">
                              Bạn có chắc chắn muốn xóa Học phần <strong>&ldquo;{mod.title}&rdquo;</strong>? Chỉ có thể xóa học phần trống (không chứa bài giảng video, bài tập trắc nghiệm hay bài viết luận). Hành động này không thể phục hồi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4 gap-2">
                            <AlertDialogCancel className="rounded-xl h-9 text-xs font-bold">Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteModule(mod.id)}
                              disabled={deleteModule.isPending}
                              className="rounded-xl h-9 text-xs font-bold bg-destructive hover:bg-destructive"
                            >
                              {deleteModule.isPending ? "Đang xóa..." : "Xóa Học phần"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>

                {/* Content preview inside Expanded Accordion Panel */}
                {isExpanded && (
                  <CardContent className="p-4 space-y-4">
                    {mod.contents.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground italic bg-muted/5 rounded-xl border border-dashed border-border/50">
                        Học phần này hiện chưa có nội dung bài học nào.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pb-1.5 border-b border-border/40 mb-3 flex items-center justify-between">
                          <span>Danh sách bài giảng & bài tập</span>
                          <span className="font-mono">
                            {totalLessons} bài học · {totalQuizzes} trắc nghiệm · {totalWritings} tự luận
                          </span>
                        </div>
                        <div className="space-y-2">
                          {mod.contents.map((item, itemIdx) => {
                            let icon = <BookOpen className="h-3.5 w-3.5 text-blue-500" />;
                            let badgeName = "BÀI ĐỌC";
                            let badgeStyle = "border-blue-500/20 text-blue-600 bg-blue-500/5";

                            if (item.type === "lesson") {
                              icon = <Play className="h-3.5 w-3.5 text-indigo-500" />;
                              badgeName = "VIDEO";
                              badgeStyle = "border-indigo-500/20 text-indigo-600 bg-indigo-500/5";
                            } else if (item.type === "quiz") {
                              icon = <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />;
                              badgeName = "TRẮC NGHIỆM";
                              badgeStyle = "border-emerald-500/20 text-emerald-600 bg-emerald-500/5";
                            } else if (item.type === "writing") {
                              icon = <PenTool className="h-3.5 w-3.5 text-amber-500" />;
                              badgeName = "TẬP VIẾT AI";
                              badgeStyle = "border-amber-500/20 text-amber-600 bg-amber-500/5";
                            }

                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-background/80 transition-all duration-200"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="font-mono text-[9px] text-muted-foreground shrink-0 w-4 text-center">
                                    {item.order}
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-muted shrink-0">
                                    {icon}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-foreground truncate">
                                      {item.title}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Badge variant="outline" className={`text-[8px] font-bold px-1.5 py-0 rounded-full ${badgeStyle}`}>
                                        {badgeName}
                                      </Badge>
                                      <Badge variant="outline" className={`text-[8px] font-bold px-1.5 py-0 rounded-full uppercase ${
                                        item.status === "published"
                                          ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/5"
                                          : "border-amber-500/20 text-amber-600 bg-amber-500/5"
                                      }`}>
                                        {item.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Quick Content Reordering Arrows */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    disabled={itemIdx === 0 || reorderContent.isPending}
                                    onClick={() => handleMoveContent(mod, itemIdx, "UP")}
                                    className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:bg-muted/80 rounded-lg"
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    disabled={itemIdx === mod.contents.length - 1 || reorderContent.isPending}
                                    onClick={() => handleMoveContent(mod, itemIdx, "DOWN")}
                                    className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:bg-muted/80 rounded-lg"
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Navigation visual callout to drilling workspace */}
                    <div className="flex justify-end pt-3 border-t border-border/40">
                      <Button
                        onClick={() =>
                          router.push(`/admin/${adminId}/courses/${courseId}/modules/${mod.id}`)
                        }
                        className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-rose-500/10 transition-all hover:translate-x-0.5"
                      >
                        Quản lý bài học & Học liệu
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5 animate-pulse" />
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
  );
}
