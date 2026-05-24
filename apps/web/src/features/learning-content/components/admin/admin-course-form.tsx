"use client";
import React, { useState, useEffect } from "react";
import { useCourseMutations } from "../../hooks/use-course-mutations";
import { useCloudinaryUpload } from "../../hooks/use-cloudinary-upload";
import { Button } from "@engducation/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Progress } from "@engducation/ui/components/progress";
import { Input } from "@engducation/ui/components/input";
import { Label } from "@engducation/ui/components/label";
import { Textarea } from "@engducation/ui/components/textarea";
import { Upload, Trash2, Loader2, FileText, Sparkles, BookOpen, Layers, Award, Coins } from "lucide-react";
import { toast } from "sonner";

interface AdminCourseFormProps {
  editingCourse?: any;
  onFinished: () => void;
}

const LEVELS = [
  { value: "A1", label: "A1 (Beginner - Sơ cấp)" },
  { value: "A2", label: "A2 (Elementary - Sơ cấp)" },
  { value: "B1", label: "B1 (Intermediate - Trung cấp)" },
  { value: "B2", label: "B2 (Upper Intermediate - Trung cấp)" },
  { value: "C1", label: "C1 (Advanced - Cao cấp)" },
  { value: "C2", label: "C2 (Proficient - Cao cấp)" },
] as const;

export function AdminCourseForm({ editingCourse, onFinished }: AdminCourseFormProps) {
  const { createCourse, updateCourse } = useCourseMutations();
  const [formData, setFormData] = useState({
    title: "", description: "", thumbnailUrl: "", level: "A1", price: 0, certificateTemplateUrl: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [thumbnailProgress, setThumbnailProgress] = useState<number | null>(null);
  const [certificateProgress, setCertificateProgress] = useState<number | null>(null);

  const { upload: uploadThumbnail } = useCloudinaryUpload({ folder: "engducation/courses/thumbnails", resourceType: "image" });
  const { upload: uploadCertificate } = useCloudinaryUpload({ folder: "engducation/courses/certificates", resourceType: "auto" });

  useEffect(() => {
    if (editingCourse) {
      setFormData({
        title: editingCourse.title,
        description: editingCourse.description ?? "",
        thumbnailUrl: editingCourse.thumbnailUrl ?? "",
        level: editingCourse.level,
        price: editingCourse.price ?? 0,
        certificateTemplateUrl: editingCourse.certificateTemplateUrl ?? "",
      });
    } else {
      setFormData({ title: "", description: "", thumbnailUrl: "", level: "A1", price: 0, certificateTemplateUrl: "" });
    }
    setErrors({});
  }, [editingCourse]);

  const updateField = (name: string, val: any) => {
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "thumbnail" | "certificate") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Dung lượng tệp phải nhỏ hơn 5MB");

    const isThumb = type === "thumbnail";
    const setProgress = isThumb ? setThumbnailProgress : setCertificateProgress;
    const uploader = isThumb ? uploadThumbnail : uploadCertificate;

    try {
      setProgress(0);
      const res = await uploader.mutateAsync({
        file,
        onProgress: (p) => setProgress(Math.round((p.loaded / p.total) * 100)),
      });
      updateField(isThumb ? "thumbnailUrl" : "certificateTemplateUrl", res.secureUrl);
      toast.success("Tải tệp lên thành công!");
    } catch (err: any) {
      toast.error(err.message || "Tải tệp lên thất bại");
    } finally {
      setProgress(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return setErrors({ title: "Tiêu đề không được để trống" });
    if (formData.price < 0) return setErrors({ price: "Giá tiền không được nhỏ hơn 0" });

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      thumbnailUrl: formData.thumbnailUrl.trim() || undefined,
      level: formData.level as any,
      price: Number(formData.price),
      certificateTemplateUrl: formData.certificateTemplateUrl.trim() || null,
    };

    editingCourse ? await updateCourse.mutateAsync({ id: editingCourse.id, ...payload }) : await createCourse.mutateAsync(payload);
    onFinished();
  };

  return (
    <Card className="border border-muted/60 dark:border-muted/30 bg-gradient-to-b from-card to-muted/10 backdrop-blur-md shadow-md rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="py-4.5 px-6 border-b border-muted/40 dark:border-muted/20 bg-muted/20 dark:bg-muted/10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-card-foreground">
              {editingCourse ? "Chỉnh sửa khóa học" : "Cấu hình khóa học mới"}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
              {editingCourse ? "Thiết lập lại cấu hình và xuất bản" : "Khởi tạo hệ thống lưu trữ thông tin khóa học mới"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Bento: Course Metadata */}
            <div className="space-y-6">
              
              {/* Bento Box 1: Core Details */}
              <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-muted/40 dark:border-muted/20">
                  <BookOpen className="h-4 w-4 text-rose-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
                    Thông tin cơ bản
                  </h3>
                </div>

                <div className="space-y-3.5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="course-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      Tiêu đề khóa học <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="course-title"
                      value={formData.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="Nhập tiêu đề khóa học..."
                      className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all duration-200"
                    />
                    {errors.title && (
                      <p className="text-[10px] text-destructive font-medium mt-0.5">{errors.title}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="course-level" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
                        <Layers className="h-3 w-3 text-rose-500" />
                        Trình độ
                      </Label>
                      <select
                        id="course-level"
                        value={formData.level}
                        onChange={(e) => updateField("level", e.target.value)}
                        className="flex h-9 w-full rounded-xl border border-muted/60 bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 dark:bg-muted/10 dark:border-muted/30"
                      >
                        {LEVELS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="course-price" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
                        <Coins className="h-3 w-3 text-rose-500" />
                        Giá khóa học (VNĐ)
                      </Label>
                      <Input
                        id="course-price"
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={(e) => updateField("price", Number(e.target.value))}
                        placeholder="0 = Miễn phí"
                        className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all duration-200"
                      />
                      {errors.price && (
                        <p className="text-[10px] text-destructive font-medium mt-0.5">{errors.price}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Box 2: Description */}
              <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-muted/40 dark:border-muted/20">
                  <FileText className="h-4 w-4 text-rose-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
                    Mô tả giáo trình
                  </h3>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="course-description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Nội dung mô tả khóa học
                  </Label>
                  <Textarea
                    id="course-description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Nhập mô tả chi tiết, lợi ích khóa học mang lại và đối tượng học viên nhắm tới..."
                    className="min-h-[100px] text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Right Bento: Cover & Certificate Uploaders */}
            <div className="space-y-6">
              
              {/* Bento Box 3: Thumbnail Box */}
              <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-muted/40 dark:border-muted/20">
                  <Layers className="h-4 w-4 text-rose-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
                    Ảnh đại diện khóa học
                  </h3>
                </div>
                <UploadBox
                  id="thumbnail-upload"
                  accept="image/*"
                  url={formData.thumbnailUrl}
                  progress={thumbnailProgress}
                  onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, "thumbnail")}
                  onClear={() => updateField("thumbnailUrl", "")}
                  previewType="image"
                />
              </div>

              {/* Bento Box 4: Certificate Template Box */}
              <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-muted/40 dark:border-muted/20">
                  <Award className="h-4 w-4 text-rose-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
                    Mẫu chứng chỉ bài học (Ảnh hoặc PDF)
                  </h3>
                </div>
                <UploadBox
                  id="certificate-upload"
                  accept="image/*,application/pdf"
                  url={formData.certificateTemplateUrl}
                  progress={certificateProgress}
                  onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, "certificate")}
                  onClear={() => updateField("certificateTemplateUrl", "")}
                  previewType="auto"
                />
              </div>

            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-muted/40 dark:border-muted/20">
            {editingCourse && (
              <Button
                type="button"
                variant="outline"
                onClick={onFinished}
                className="h-9 text-xs font-bold px-5 border border-muted/60 bg-background hover:bg-muted/10 text-muted-foreground hover:text-foreground rounded-xl active:scale-95 transition-all duration-200"
              >
                HỦY
              </Button>
            )}
            <Button
              type="submit"
              disabled={createCourse.isPending || updateCourse.isPending}
              className="h-9 text-xs font-bold bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl shadow-md px-5 active:scale-95 transition-all duration-200 hover:shadow-rose-500/20 hover:shadow-lg"
            >
              {createCourse.isPending || updateCourse.isPending ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ĐANG LƯU...
                </div>
              ) : editingCourse ? (
                "CẬP NHẬT"
              ) : (
                "TẠO KHÓA HỌC"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function UploadBox({ id, accept, url, progress, onUpload, onClear, previewType }: any) {
  if (url) {
    const isPdf = previewType === "auto" && (url.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes("/raw/upload/"));
    return (
      <div className="relative group overflow-hidden border border-muted/55 dark:border-muted/25 rounded-2xl p-4 bg-muted/10 hover:bg-muted/20 transition-all duration-200 flex flex-col items-center justify-center min-h-[160px]">
        {isPdf ? (
          <div className="relative w-full flex flex-col items-center justify-center p-6 bg-rose-500/5 border border-rose-500/10 rounded-xl min-h-[128px]">
            <FileText className="h-7 w-7 text-rose-500 mb-2" />
            <span className="text-xs font-semibold text-foreground max-w-xs truncate text-center">{url.split("/").pop()}</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-rose-600 hover:text-rose-700 hover:underline mt-2 font-bold uppercase tracking-wider">Xem tài liệu PDF →</a>
          </div>
        ) : (
          <div className="relative w-full aspect-[16/9] max-h-[160px] rounded-xl overflow-hidden shadow-xs border border-muted/50 dark:border-muted/30 bg-muted/20">
            <img src={url} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <label htmlFor={id} className="px-3.5 py-1.5 bg-white/95 hover:bg-white text-slate-900 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm">Thay đổi</label>
          <Button type="button" variant="destructive" size="sm" onClick={onClear} className="rounded-xl text-xs font-bold h-8.5 px-3.5 transition-all active:scale-95 shadow-sm"><Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group overflow-hidden border border-dashed border-muted-foreground/30 hover:border-rose-500/50 rounded-2xl p-4 bg-muted/10 hover:bg-rose-500/5 transition-all duration-200 flex flex-col items-center justify-center min-h-[160px]">
      {progress !== null ? (
        <div className="w-full flex flex-col items-center justify-center p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang tải lên... {progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 w-full max-w-xs [&>div]:bg-rose-600 bg-rose-100 dark:bg-rose-950/20" />
        </div>
      ) : (
        <>
          <input type="file" accept={accept} onChange={onUpload} className="hidden" id={id} />
          <label htmlFor={id} className="flex flex-col items-center justify-center w-full h-full cursor-pointer py-6 group-hover:text-rose-600 transition-colors">
            <Upload className="h-6 w-6 text-muted-foreground/60 group-hover:text-rose-500 group-hover:scale-105 transition-all mb-2.5 duration-200" />
            <span className="text-xs font-bold text-foreground">Click để tải tệp lên</span>
            <span className="text-[10px] text-muted-foreground mt-1 font-medium">Hỗ trợ các định dạng tệp tối đa 5MB</span>
          </label>
        </>
      )}
    </div>
  );
}
