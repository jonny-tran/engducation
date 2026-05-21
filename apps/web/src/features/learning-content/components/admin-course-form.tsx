"use client";
import { useState, useEffect } from "react";
import { useCourseMutations } from "../hooks/use-course-mutations";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Label } from "@engducation/ui/components/label";

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

  const [title, setTitle] = useState(editingCourse?.title ?? "");
  const [description, setDescription] = useState(editingCourse?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(editingCourse?.thumbnailUrl ?? "");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2" | "C1" | "C2">(
    editingCourse?.level ?? "A1"
  );
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    editingCourse?.status ?? "draft"
  );

  // Client-side validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingCourse) {
      setTitle(editingCourse.title);
      setDescription(editingCourse.description ?? "");
      setThumbnailUrl(editingCourse.thumbnailUrl ?? "");
      setLevel(editingCourse.level);
      setStatus(editingCourse.status);
    } else {
      setTitle("");
      setDescription("");
      setThumbnailUrl("");
      setLevel("A1");
      setStatus("draft");
    }
    setErrors({});
  }, [editingCourse]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = "Tiêu đề không được để trống";
    }
    if (thumbnailUrl && thumbnailUrl.trim() && !isValidUrl(thumbnailUrl.trim())) {
      newErrors.thumbnailUrl = "URL ảnh không hợp lệ";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      level,
      status,
    };

    if (editingCourse) {
      await updateCourse.mutateAsync({ id: editingCourse.id, ...payload });
    } else {
      await createCourse.mutateAsync(payload);
    }
    onFinished();
  };

  const isPending = createCourse.isPending || updateCourse.isPending;

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="py-3 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
          {editingCourse ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Tiêu đề khóa học *
            </Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              placeholder="Nhập tiêu đề khóa học..."
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-destructive font-medium">{errors.title}</p>
            )}
          </div>

          {/* Thumbnail URL */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Ảnh đại diện (URL)
            </Label>
            <Input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => {
                setThumbnailUrl(e.target.value);
                if (errors.thumbnailUrl) setErrors((prev) => ({ ...prev, thumbnailUrl: "" }));
              }}
              placeholder="https://example.com/image.png"
              aria-invalid={!!errors.thumbnailUrl}
            />
            {errors.thumbnailUrl && (
              <p className="text-xs text-destructive font-medium">{errors.thumbnailUrl}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Mô tả khóa học
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả chi tiết cho khóa học..."
              className="min-h-[80px]"
            />
          </div>

          {/* Level & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Trình độ (Level)
              </Label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as typeof level)}
                className="flex h-8 w-full border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
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
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Trạng thái (Status)
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="flex h-8 w-full border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="draft">DRAFT (Bản nháp)</option>
                <option value="published">PUBLISHED (Xuất bản)</option>
                <option value="archived">ARCHIVED (Lưu trữ)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            {editingCourse && (
              <Button
                type="button"
                variant="outline"
                onClick={onFinished}
                className="text-xs font-bold"
              >
                HỦY CHỈNH SỬA
              </Button>
            )}
            <Button
              type="submit"
              disabled={isPending}
              variant="default"
              className="text-xs font-bold"
            >
              {isPending
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
