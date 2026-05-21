"use client";
import { useState, useEffect } from "react";
import { useLessonMutations } from "../hooks/use-lesson-mutations";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";

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
      <Card className="lg:col-span-2 border border-slate-300 dark:border-slate-800 rounded-none">
        <CardHeader className="py-3 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            Danh sách bài học ({lessons.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {lessons.length === 0 ? (
            <p className="p-4 text-xs text-slate-500 italic">Chưa có bài học nào trong khóa này.</p>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-slate-500">
                  <th className="p-2.5 w-12 text-center">STT</th>
                  <th className="p-2.5">Bài học</th>
                  <th className="p-2.5 w-16 text-center">Loại</th>
                  <th className="p-2.5 w-20 text-center">Trạng thái</th>
                  <th className="p-2.5 w-40 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {lessons.map((lesson, index) => {
                  const isVideo = lesson.videoUrl || lesson.videoPublicId;
                  return (
                    <tr key={lesson.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-2.5 text-center font-mono">{lesson.order}</td>
                      <td className="p-2.5">
                        <div className="font-bold">{lesson.title}</div>
                        {lesson.description && (
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{lesson.description}</div>
                        )}
                        {isVideo && (
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5 break-all">
                            ID: {lesson.videoPublicId} | URL: {lesson.videoUrl?.slice(0, 40)}...
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-1.5 py-0.5 border text-[9px] font-bold ${isVideo ? 'border-blue-300 text-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-slate-300 text-slate-500 bg-slate-50 dark:bg-slate-900'}`}>
                          {isVideo ? "VIDEO" : "TEXT"}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-1.5 py-0.5 border text-[9px] font-bold ${lesson.status === 'published' ? 'border-emerald-300 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-amber-300 text-amber-500 bg-amber-50 dark:bg-amber-950/20'}`}>
                          {lesson.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1 justify-center">
                          <Button
                            variant="outline"
                            onClick={() => handleEditClick(lesson)}
                            className="rounded-none border-slate-300 dark:border-slate-700 px-1.5 py-0.5 h-6 text-[10px] font-bold"
                          >
                            SỬA
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(lesson.id)}
                            className="rounded-none px-1.5 py-0.5 h-6 text-[10px] font-bold"
                          >
                            XÓA
                          </Button>
                          <Button
                            variant="outline"
                            disabled={index === 0}
                            onClick={() => handleMove(index, "UP")}
                            className="rounded-none border-slate-300 dark:border-slate-700 px-1.5 py-0.5 h-6 text-[10px]"
                          >
                            ▲
                          </Button>
                          <Button
                            variant="outline"
                            disabled={index === lessons.length - 1}
                            onClick={() => handleMove(index, "DOWN")}
                            className="rounded-none border-slate-300 dark:border-slate-700 px-1.5 py-0.5 h-6 text-[10px]"
                          >
                            ▼
                          </Button>
                          <Button
                            onClick={() => onSelectLessonForQuiz(lesson)}
                            className="rounded-none bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 px-1.5 py-0.5 h-6 text-[10px] font-bold"
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
      <Card className="border border-slate-300 dark:border-slate-800 rounded-none bg-slate-50/50 dark:bg-slate-900/50">
        <CardHeader className="py-3 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            {editingLessonId ? "Sửa bài học" : "Thêm bài học"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase text-slate-500">Tiêu đề bài học *</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề..."
                className="rounded-none border-slate-300 dark:border-slate-800 focus-visible:ring-0 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase text-slate-500">Mô tả ngắn</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả bài học..."
                className="rounded-none border-slate-300 dark:border-slate-800 focus-visible:ring-0 min-h-[50px] text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold uppercase text-slate-500">Loại bài học</label>
                <select
                  value={lessonType}
                  onChange={(e) => setLessonType(e.target.value as any)}
                  className="flex h-9 w-full border border-slate-300 dark:border-slate-800 bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-0 rounded-none dark:bg-slate-950 text-xs"
                >
                  <option value="TEXT">Bài học đọc (TEXT)</option>
                  <option value="VIDEO">Bài giảng video (VIDEO)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold uppercase text-slate-500">Thứ tự (Order)</label>
                <Input
                  type="number"
                  min="1"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  placeholder="Để trống = tự tăng"
                  className="rounded-none border-slate-300 dark:border-slate-800 focus-visible:ring-0 text-xs"
                />
              </div>
            </div>

            {lessonType === "VIDEO" && (
              <div className="p-3 border border-dashed border-slate-300 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 space-y-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold uppercase text-slate-500 text-[10px]">Cloudinary Public ID *</label>
                  <Input
                    required={lessonType === "VIDEO"}
                    value={videoPublicId}
                    onChange={(e) => setVideoPublicId(e.target.value)}
                    placeholder="ví dụ: courses/intro_video"
                    className="rounded-none border-slate-300 dark:border-slate-800 focus-visible:ring-0 h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold uppercase text-slate-500 text-[10px]">Cloudinary Video URL *</label>
                  <Input
                    required={lessonType === "VIDEO"}
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                    className="rounded-none border-slate-300 dark:border-slate-800 focus-visible:ring-0 h-8 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase text-slate-500">Trạng thái (Status)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-9 w-full border border-slate-300 dark:border-slate-800 bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-0 rounded-none dark:bg-slate-950 text-xs"
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
                  className="rounded-none border-slate-300 hover:bg-slate-100 font-bold"
                >
                  HỦY
                </Button>
              )}
              <Button
                type="submit"
                disabled={createLesson.isPending || updateLesson.isPending}
                className="rounded-none bg-slate-950 text-white hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 font-bold"
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
