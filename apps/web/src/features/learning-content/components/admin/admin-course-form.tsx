"use client";
import React, { useState, useEffect } from "react";
import { useCourseMutations } from "../../hooks/use-course-mutations";
import { useCloudinaryUpload } from "../../hooks/use-cloudinary-upload";
import { Button } from "@engducation/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Progress } from "@engducation/ui/components/progress";
import { Upload, Trash2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { FormFieldDynamic } from "@/components/ui/form-field-dynamic";

interface AdminCourseFormProps {
  editingCourse?: any;
  onFinished: () => void;
}

const courseFormFields = [
  { name: "title", label: "Tiêu đề khóa học", type: "text", placeholder: "Nhập tiêu đề khóa học...", required: true },
  { name: "thumbnailUrl", label: "Ảnh đại diện khóa học", type: "custom" },
  { name: "certificateTemplateUrl", label: "Tệp mẫu chứng chỉ (Ảnh hoặc PDF)", type: "custom" },
  { name: "description", label: "Mô tả khóa học", type: "textarea", placeholder: "Nhập mô tả chi tiết cho khóa học..." },
  { name: "level", label: "Trình độ (Level)", type: "select", options: [
      { value: "A1", label: "A1 (Beginner - Sơ cấp)" },
      { value: "A2", label: "A2 (Elementary - Sơ cấp)" },
      { value: "B1", label: "B1 (Intermediate - Trung cấp)" },
      { value: "B2", label: "B2 (Upper Intermediate - Trung cấp)" },
      { value: "C1", label: "C1 (Advanced - Cao cấp)" },
      { value: "C2", label: "C2 (Proficient - Cao cấp)" },
  ] },
  { name: "price", label: "Giá khóa học (VNĐ - 0 là Miễn phí)", type: "number", placeholder: "0" }
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
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="py-3 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
          {editingCourse ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {courseFormFields.map((field) => (
            <FormFieldDynamic
              key={field.name}
              field={field as any}
              value={(formData as any)[field.name]}
              onChange={(val) => updateField(field.name, val)}
              error={errors[field.name]}
              customRender={
                field.name === "thumbnailUrl" ? (
                  <UploadBox
                    id="thumbnail-upload"
                    accept="image/*"
                    url={formData.thumbnailUrl}
                    progress={thumbnailProgress}
                    onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, "thumbnail")}
                    onClear={() => updateField("thumbnailUrl", "")}
                    previewType="image"
                  />
                ) : (
                  <UploadBox
                    id="certificate-upload"
                    accept="image/*,application/pdf"
                    url={formData.certificateTemplateUrl}
                    progress={certificateProgress}
                    onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, "certificate")}
                    onClear={() => updateField("certificateTemplateUrl", "")}
                    previewType="auto"
                  />
                )
              }
            />
          ))}
          <div className="flex justify-end gap-2 pt-2">
            {editingCourse && <Button type="button" variant="outline" onClick={onFinished} className="text-xs font-bold">HỦY</Button>}
            <Button type="submit" disabled={createCourse.isPending || updateCourse.isPending} className="text-xs font-bold">
              {createCourse.isPending || updateCourse.isPending ? "ĐANG LƯU..." : editingCourse ? "CẬP NHẬT" : "TẠO KHÓA HỌC"}
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
      <div className="relative group overflow-hidden border border-border/80 rounded-2xl p-4 bg-muted/5 flex flex-col items-center justify-center min-h-[160px]">
        {isPdf ? (
          <div className="relative w-full flex flex-col items-center justify-center p-6 bg-red-500/5 border border-red-500/10 rounded-xl min-h-[128px]">
            <FileText className="h-6 w-6 text-red-500 mb-2" />
            <span className="text-xs font-bold text-foreground max-w-xs truncate text-center">{url.split("/").pop()}</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline mt-1.5 font-bold">Xem PDF →</a>
          </div>
        ) : (
          <div className="relative w-full aspect-[16/9] max-h-[160px] rounded-xl overflow-hidden shadow-md">
            <img src={url} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <label htmlFor={id} className="px-3 py-1.5 bg-white/95 hover:bg-white text-slate-900 rounded-xl text-xs font-bold cursor-pointer">Thay đổi</label>
          <Button type="button" variant="destructive" size="sm" onClick={onClear} className="rounded-xl text-xs font-bold"><Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group overflow-hidden border border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-4 bg-muted/5 transition-all duration-300 flex flex-col items-center justify-center min-h-[160px]">
      {progress !== null ? (
        <div className="w-full flex flex-col items-center justify-center p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Đang tải lên... {progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 w-full max-w-xs" />
        </div>
      ) : (
        <>
          <input type="file" accept={accept} onChange={onUpload} className="hidden" id={id} />
          <label htmlFor={id} className="flex flex-col items-center justify-center w-full h-full cursor-pointer py-6">
            <Upload className="h-5 w-5 text-primary mb-2" />
            <span className="text-xs font-bold text-foreground">Click để tải tệp lên</span>
            <span className="text-[10px] text-muted-foreground mt-1">Hỗ trợ định dạng dung lượng tối đa 5MB</span>
          </label>
        </>
      )}
    </div>
  );
}
