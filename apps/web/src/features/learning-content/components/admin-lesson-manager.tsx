"use client";
import { useState, useEffect } from "react";
import { useLessonMutations } from "../hooks/use-lesson-mutations";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";

interface LessonData {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  videoPublicId: string | null;
  videoUrl: string | null;
  order: number;
  status: string;
}

interface AdminLessonManagerProps {
  courseId: string;
  lessons: LessonData[];
  onSelectLessonForQuiz: (lesson: LessonData) => void;
}

export function AdminLessonManager({ courseId, lessons, onSelectLessonForQuiz }: AdminLessonManagerProps) {
  const { createLesson, updateLesson, deleteLesson, reorderLessons } = useLessonMutations(courseId);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lessonType, setLessonType] = useState<"TEXT" | "VIDEO">("TEXT");
  const [videoPublicId, setVideoPublicId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [orderInput, setOrderInput] = useState<string>("");

  useEffect(() => {
    resetForm();
  }, [courseId]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLessonType("TEXT");
    setVideoPublicId("");
    setVideoUrl("");
    setStatus("draft");
    setOrderInput("");
    setEditingLessonId(null);
  };

  const handleEditClick = (lesson: LessonData) => {
    setEditingLessonId(lesson.id);
    setTitle(lesson.title);
    setDescription(lesson.description ?? "");
    setLessonType(lesson.videoUrl || lesson.videoPublicId ? "VIDEO" : "TEXT");
    setVideoPublicId(lesson.videoPublicId ?? "");
    setVideoUrl(lesson.videoUrl ?? "");
    setStatus(lesson.status as any);
    setOrderInput(lesson.order.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      description: description || undefined,
      videoPublicId: lessonType === "VIDEO" ? videoPublicId || undefined : null as any,
      videoUrl: lessonType === "VIDEO" ? videoUrl || undefined : null as any,
      status,
      order: orderInput ? parseInt(orderInput, 10) : undefined,
    };

    if (editingLessonId) {
      await updateLesson.mutateAsync({
        id: editingLessonId,
        ...payload,
      });
    } else {
      await createLesson.mutateAsync({
        courseId,
        ...payload,
      });
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài học này?")) {
      await deleteLesson.mutateAsync({ id });
    }
  };

  const handleMove = async (index: number, direction: "UP" | "DOWN") => {
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const currentLesson = lessons[index]!;
    const adjacentLesson = lessons[targetIndex]!;

    // Swap their order numbers
    const currentOrder = currentLesson.order;
    const adjacentOrder = adjacentLesson.order;

    await reorderLessons.mutateAsync({
      courseId,
      movements: [
        { id: currentLesson.id, order: adjacentOrder },
        { id: adjacentLesson.id, order: currentOrder },
      ],
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Lesson List View */}
      <Card className="lg:col-span-2 border border-border bg-card">
        <CardHeader className="py-3 border-b border-border bg-muted/20">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
            Danh sách bài học ({lessons.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {lessons.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground italic">Chưa có bài học nào trong khóa này.</p>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border font-bold uppercase text-muted-foreground">
                  <th className="p-2.5 w-12 text-center">STT</th>
                  <th className="p-2.5">Bài học</th>
                  <th className="p-2.5 w-16 text-center">Loại</th>
                  <th className="p-2.5 w-20 text-center">Trạng thái</th>
                  <th className="p-2.5 w-40 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lessons.map((lesson, index) => {
                  const isVideo = lesson.videoUrl || lesson.videoPublicId;
                  return (
                    <tr key={lesson.id} className="hover:bg-muted/30">
                      <td className="p-2.5 text-center font-mono text-muted-foreground">{lesson.order}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-foreground">{lesson.title}</div>
                        {lesson.description && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{lesson.description}</div>
                        )}
                        {isVideo && (
                          <div className="text-[9px] text-muted-foreground font-mono mt-0.5 break-all">
                            ID: {lesson.videoPublicId} | URL: {lesson.videoUrl?.slice(0, 40)}...
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold ${
                            isVideo
                              ? "border-blue-500/20 text-blue-600 bg-blue-500/10"
                              : "border-border text-muted-foreground bg-muted"
                          }`}
                        >
                          {isVideo ? "VIDEO" : "TEXT"}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold uppercase ${
                            lesson.status === "published"
                              ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/10"
                              : "border-amber-500/20 text-amber-600 bg-amber-500/10"
                          }`}
                        >
                          {lesson.status}
                        </Badge>
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1 justify-center">
                          <Button
                            variant="outline"
                            onClick={() => handleEditClick(lesson)}
                            className="px-1.5 py-0.5 h-6 text-[10px] font-bold"
                          >
                            SỬA
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(lesson.id)}
                            className="px-1.5 py-0.5 h-6 text-[10px] font-bold"
                          >
                            XÓA
                          </Button>
                          <Button
                            variant="outline"
                            disabled={index === 0}
                            onClick={() => handleMove(index, "UP")}
                            className="px-1.5 py-0.5 h-6 text-[10px]"
                          >
                            ▲
                          </Button>
                          <Button
                            variant="outline"
                            disabled={index === lessons.length - 1}
                            onClick={() => handleMove(index, "DOWN")}
                            className="px-1.5 py-0.5 h-6 text-[10px]"
                          >
                            ▼
                          </Button>
                          <Button
                            variant="default"
                            onClick={() => onSelectLessonForQuiz(lesson)}
                            className="px-1.5 py-0.5 h-6 text-[10px] font-bold"
                          >
                            QUIZ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Lesson Creation / Edit Form */}
      <Card className="border border-border bg-card">
        <CardHeader className="py-3 border-b border-border bg-muted/20">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
            {editingLessonId ? "Sửa bài học" : "Thêm bài học"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase text-muted-foreground">Tiêu đề bài học *</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase text-muted-foreground">Mô tả ngắn</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả bài học..."
                className="min-h-[50px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold uppercase text-muted-foreground">Loại bài học</label>
                <select
                  value={lessonType}
                  onChange={(e) => setLessonType(e.target.value as any)}
                  className="flex h-8 w-full border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
                >
                  <option value="TEXT">Bài học đọc (TEXT)</option>
                  <option value="VIDEO">Bài giảng video (VIDEO)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold uppercase text-muted-foreground">Thứ tự (Order)</label>
                <Input
                  type="number"
                  min="1"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  placeholder="Để trống = tự tăng"
                />
              </div>
            </div>

            {lessonType === "VIDEO" && (
              <div className="p-3 border border-dashed border-border bg-muted/30 space-y-2 rounded-md">
                <div className="flex flex-col gap-1">
                  <label className="font-bold uppercase text-muted-foreground text-[10px]">Cloudinary Public ID *</label>
                  <Input
                    required={lessonType === "VIDEO"}
                    value={videoPublicId}
                    onChange={(e) => setVideoPublicId(e.target.value)}
                    placeholder="ví dụ: courses/intro_video"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold uppercase text-muted-foreground text-[10px]">Cloudinary Video URL *</label>
                  <Input
                    required={lessonType === "VIDEO"}
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase text-muted-foreground">Trạng thái (Status)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-8 w-full border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="draft">DRAFT (Bản nháp)</option>
                <option value="published">PUBLISHED (Xuất bản)</option>
                <option value="archived">ARCHIVED (Lưu trữ)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingLessonId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="font-bold"
                >
                  HỦY
                </Button>
              )}
              <Button
                type="submit"
                disabled={createLesson.isPending || updateLesson.isPending}
                variant="default"
                className="font-bold"
              >
                {createLesson.isPending || updateLesson.isPending ? "ĐANG LƯU..." : editingLessonId ? "CẬP NHẬT" : "THÊM MỚI"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
