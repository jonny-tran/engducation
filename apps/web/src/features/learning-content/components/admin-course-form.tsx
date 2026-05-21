"use client";
import { useState, useEffect } from "react";
import { useCourseMutations } from "../hooks/use-course-mutations";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";

interface AdminCourseFormProps {
  editingCourse?: {
    id: string;
    title: string;
    description: string | null;
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    status: "draft" | "published" | "archived";
    thumbnailUrl: string | null;
  } | null;
  onFinished: () => void;
}

export function AdminCourseForm({ editingCourse, onFinished }: AdminCourseFormProps) {
  const { createCourse, updateCourse } = useCourseMutations();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2" | "C1" | "C2">("A1");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  useEffect(() => {
    if (editingCourse) {
      setTitle(editingCourse.title);
      setDescription(editingCourse.description ?? "");
      setLevel(editingCourse.level);
      setStatus(editingCourse.status);
      setThumbnailUrl(editingCourse.thumbnailUrl ?? "");
    } else {
      setTitle("");
      setDescription("");
      setLevel("A1");
      setStatus("draft");
      setThumbnailUrl("");
    }
  }, [editingCourse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      description: description || undefined,
      level,
      status,
      thumbnailUrl: thumbnailUrl || undefined,
    };

    if (editingCourse) {
      await updateCourse.mutateAsync({
        id: editingCourse.id,
        ...payload,
      });
    } else {
      await createCourse.mutateAsync(payload);
    }
    onFinished();
  };

  return (
    <Card className="border border-slate-300 dark:border-slate-800 rounded-none bg-slate-50/50 dark:bg-slate-900/50">
      <CardHeader className="py-3 border-b border-slate-200 dark:border-slate-800">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">
          {editingCourse ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Tiêu đề khóa học *</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề khóa học..."
                className="rounded-none border-slate-300 dark:border-slate-800 focus-visible:ring-0 focus-visible:border-slate-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Ảnh đại diện (URL)</label>
              <Input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className="rounded-none border-slate-300 dark:border-slate-800 focus-visible:ring-0 focus-visible:border-slate-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">Mô tả khóa học</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả chi tiết cho khóa học..."
              className="rounded-none border-slate-300 dark:border-slate-800 focus-visible:ring-0 focus-visible:border-slate-500 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Trình độ (Level)</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="flex h-9 w-full border border-slate-300 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-0 rounded-none dark:bg-slate-950"
              >
                <option value="A1">A1 (Beginner - Sơ cấp)</option>
                <option value="A2">A2 (Elementary - Sơ cấp)</option>
                <option value="B1">B1 (Intermediate - Trung cấp)</option>
                <option value="B2">B2 (Upper Intermediate - Trung cấp)</option>
                <option value="C1">C1 (Advanced - Cao cấp)</option>
                <option value="C2">C2 (Proficient - Cao cấp)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Trạng thái (Status)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-9 w-full border border-slate-300 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-0 rounded-none dark:bg-slate-950"
              >
                <option value="draft">DRAFT (Bản nháp)</option>
                <option value="published">PUBLISHED (Xuất bản)</option>
                <option value="archived">ARCHIVED (Lưu trữ)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingCourse && (
              <Button
                type="button"
                variant="outline"
                onClick={onFinished}
                className="rounded-none border-slate-300 hover:bg-slate-100 text-xs font-bold"
              >
                HỦY CHỈNH SỬA
              </Button>
            )}
            <Button
              type="submit"
              disabled={createCourse.isPending || updateCourse.isPending}
              className="rounded-none bg-slate-950 text-white hover:bg-slate-850 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 text-xs font-bold"
            >
              {createCourse.isPending || updateCourse.isPending
                ? "ĐANG LƯU..."
                : editingCourse
                ? "CẬP NHẬT KHÓA HỌC"
                : "TẠO KHÓA HỌC"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
