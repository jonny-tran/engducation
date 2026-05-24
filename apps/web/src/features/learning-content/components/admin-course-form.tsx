"use client";
import { useState, useEffect } from "react";
import { useCourseMutations } from "../hooks/use-course-mutations";
import { useCloudinaryUpload } from "../hooks/use-cloudinary-upload";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Label } from "@engducation/ui/components/label";
import { Progress } from "@engducation/ui/components/progress";
import { Upload, Trash2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface AdminCourseFormProps {
  editingCourse?: {
    id: string;
    title: string;
    description: string | null;
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    status: "draft" | "published" | "archived";
    thumbnailUrl: string | null;
    price: number;
    certificateTemplateUrl: string | null;
  } | null;
  onFinished: () => void;
}

export function AdminCourseForm({ editingCourse, onFinished }: AdminCourseFormProps) {
  const { createCourse, updateCourse } = useCourseMutations();

  const { upload: uploadThumbnail } = useCloudinaryUpload({
    folder: "engducation/courses/thumbnails",
    resourceType: "image",
  });

  const { upload: uploadCertificate } = useCloudinaryUpload({
    folder: "engducation/courses/certificates",
    resourceType: "auto",
  });

  const [title, setTitle] = useState(editingCourse?.title ?? "");
  const [description, setDescription] = useState(editingCourse?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(editingCourse?.thumbnailUrl ?? "");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2" | "C1" | "C2">(
    editingCourse?.level ?? "A1"
  );
  const [price, setPrice] = useState<number>(editingCourse?.price ?? 0);
  const [certificateTemplateUrl, setCertificateTemplateUrl] = useState<string>(
    editingCourse?.certificateTemplateUrl ?? ""
  );

  const [thumbnailProgress, setThumbnailProgress] = useState<number | null>(null);
  const [certificateProgress, setCertificateProgress] = useState<number | null>(null);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh đại diện phải nhỏ hơn 5MB");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")) {
      toast.error("Chỉ hỗ trợ định dạng hình ảnh (png, jpg, jpeg, webp, gif)");
      return;
    }

    try {
      setThumbnailProgress(0);
      const res = await uploadThumbnail.mutateAsync({
        file,
        onProgress: (p) => {
          const percent = Math.round((p.loaded / p.total) * 100);
          setThumbnailProgress(percent);
        },
      });

      setThumbnailUrl(res.secureUrl);
      if (errors.thumbnailUrl) setErrors((prev) => ({ ...prev, thumbnailUrl: "" }));
      toast.success("Tải ảnh đại diện lên thành công!");
    } catch (err: any) {
      toast.error(err.message || "Tải ảnh đại diện lên thất bại");
    } finally {
      setThumbnailProgress(null);
    }
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh/tài liệu chứng chỉ phải nhỏ hơn 5MB");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["png", "jpg", "jpeg", "webp", "pdf"].includes(ext || "")) {
      toast.error("Chỉ hỗ trợ định dạng hình ảnh (png, jpg, jpeg, webp) hoặc tệp PDF (.pdf)");
      return;
    }

    try {
      setCertificateProgress(0);
      const res = await uploadCertificate.mutateAsync({
        file,
        onProgress: (p) => {
          const percent = Math.round((p.loaded / p.total) * 100);
          setCertificateProgress(percent);
        },
      });

      setCertificateTemplateUrl(res.secureUrl);
      if (errors.certificateTemplateUrl) setErrors((prev) => ({ ...prev, certificateTemplateUrl: "" }));
      toast.success("Tải ảnh chứng chỉ lên thành công!");
    } catch (err: any) {
      toast.error(err.message || "Tải ảnh chứng chỉ lên thất bại");
    } finally {
      setCertificateProgress(null);
    }
  };

  // Client-side validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingCourse) {
      setTitle(editingCourse.title);
      setDescription(editingCourse.description ?? "");
      setThumbnailUrl(editingCourse.thumbnailUrl ?? "");
      setLevel(editingCourse.level);
      setPrice(editingCourse.price ?? 0);
      setCertificateTemplateUrl(editingCourse.certificateTemplateUrl ?? "");
    } else {
      setTitle("");
      setDescription("");
      setThumbnailUrl("");
      setLevel("A1");
      setPrice(0);
      setCertificateTemplateUrl("");
    }
    setErrors({});
  }, [editingCourse]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = "Tiêu đề không được để trống";
    }
    if (thumbnailUrl && thumbnailUrl.trim() && !isValidUrl(thumbnailUrl.trim())) {
      newErrors.thumbnailUrl = "URL ảnh đại diện không hợp lệ";
    }
    if (certificateTemplateUrl && certificateTemplateUrl.trim() && !isValidUrl(certificateTemplateUrl.trim())) {
      newErrors.certificateTemplateUrl = "URL ảnh chứng chỉ không hợp lệ";
    }
    if (price < 0) {
      newErrors.price = "Giá tiền không được nhỏ hơn 0";
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
      price: Number(price),
      certificateTemplateUrl: certificateTemplateUrl.trim() || null,
    };

    if (editingCourse) {
      await updateCourse.mutateAsync({ id: editingCourse.id, ...payload });
    } else {
      await createCourse.mutateAsync(payload);
    }
    onFinished();
  };

  const isPending = createCourse.isPending || updateCourse.isPending;
  const isUploading = thumbnailProgress !== null || certificateProgress !== null;

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

          {/* Thumbnail Image Upload */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Ảnh đại diện khóa học
            </Label>
            
            <div className="relative group overflow-hidden border border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-4 bg-muted/5 transition-all duration-300 flex flex-col items-center justify-center min-h-[160px]">
              {thumbnailUrl ? (
                <div className="relative w-full aspect-[16/9] max-h-[160px] rounded-xl overflow-hidden shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    <label
                      htmlFor="thumbnail-upload"
                      className="px-3 py-1.5 bg-white/95 hover:bg-white text-slate-900 rounded-xl text-xs font-bold shadow-sm transition-all transform translate-y-2 group-hover:translate-y-0 cursor-pointer"
                    >
                      Thay đổi ảnh
                    </label>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setThumbnailUrl("")}
                      className="rounded-xl text-xs font-bold transform translate-y-2 group-hover:translate-y-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa
                    </Button>
                  </div>
                </div>
              ) : thumbnailProgress !== null ? (
                <div className="w-full flex flex-col items-center justify-center p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Đang tải lên... {thumbnailProgress}%</span>
                  </div>
                  <Progress value={thumbnailProgress} className="h-1.5 w-full max-w-xs" />
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                    onChange={handleThumbnailUpload}
                    disabled={thumbnailProgress !== null}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer py-6"
                  >
                    <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform duration-300 mb-2">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Click để tải ảnh lên</span>
                    <span className="text-[10px] text-muted-foreground mt-1">Hỗ trợ PNG, JPG, WEBP, GIF (Tối đa 5MB)</span>
                  </label>
                </>
              )}
            </div>
            {errors.thumbnailUrl && (
              <p className="text-xs text-destructive font-medium">{errors.thumbnailUrl}</p>
            )}
          </div>

          {/* Certificate Template Image Upload */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Tệp mẫu chứng chỉ (Ảnh hoặc PDF)
            </Label>
            
            <div className="relative group overflow-hidden border border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-4 bg-muted/5 transition-all duration-300 flex flex-col items-center justify-center min-h-[160px]">
              {certificateTemplateUrl ? (
                (() => {
                  const isPdf = certificateTemplateUrl.toLowerCase().endsWith(".pdf") || certificateTemplateUrl.toLowerCase().includes("/raw/upload/");
                  
                  if (isPdf) {
                    return (
                      <div className="relative w-full flex flex-col items-center justify-center p-6 bg-red-500/5 border border-red-500/10 rounded-xl min-h-[128px] overflow-hidden shadow-sm">
                        <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-2">
                          <FileText className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-bold text-foreground max-w-xs truncate text-center">
                          {certificateTemplateUrl.split("/").pop()}
                        </span>
                        <a
                          href={certificateTemplateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline mt-1.5 font-bold flex items-center gap-1"
                        >
                          Xem chi tiết tệp PDF →
                        </a>
                        
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                          <label
                            htmlFor="certificate-upload"
                            className="px-3 py-1.5 bg-white/95 hover:bg-white text-slate-900 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                          >
                            Thay đổi tệp
                          </label>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setCertificateTemplateUrl("")}
                            className="rounded-xl text-xs font-bold"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="relative w-full aspect-[16/9] max-h-[160px] rounded-xl overflow-hidden shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={certificateTemplateUrl}
                        alt="Certificate preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                        <label
                          htmlFor="certificate-upload"
                          className="px-3 py-1.5 bg-white/95 hover:bg-white text-slate-900 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                        >
                          Thay đổi ảnh
                        </label>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setCertificateTemplateUrl("")}
                          className="rounded-xl text-xs font-bold"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa
                        </Button>
                      </div>
                    </div>
                  );
                })()
              ) : certificateProgress !== null ? (
                <div className="w-full flex flex-col items-center justify-center p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Đang tải lên... {certificateProgress}%</span>
                  </div>
                  <Progress value={certificateProgress} className="h-1.5 w-full max-w-xs" />
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                    onChange={handleCertificateUpload}
                    disabled={certificateProgress !== null}
                    className="hidden"
                    id="certificate-upload"
                  />
                  <label
                    htmlFor="certificate-upload"
                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer py-6"
                  >
                    <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform duration-300 mb-2">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Click để tải tệp mẫu lên</span>
                    <span className="text-[10px] text-muted-foreground mt-1">Hỗ trợ PNG, JPG, WEBP hoặc PDF (Tối đa 5MB)</span>
                  </label>
                </>
              )}
            </div>
            {errors.certificateTemplateUrl && (
              <p className="text-xs text-destructive font-medium">{errors.certificateTemplateUrl}</p>
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

          {/* Level & Price */}
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
                Giá khóa học (VNĐ - 0 là Miễn phí)
              </Label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => {
                  setPrice(Number(e.target.value));
                  if (errors.price) setErrors((prev) => ({ ...prev, price: "" }));
                }}
                placeholder="0"
                aria-invalid={!!errors.price}
              />
              {errors.price && (
                <p className="text-xs text-destructive font-medium">{errors.price}</p>
              )}
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
              disabled={isPending || isUploading}
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
