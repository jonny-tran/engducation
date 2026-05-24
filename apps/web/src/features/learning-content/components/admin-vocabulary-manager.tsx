"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useVocabularyMutations } from "../hooks/use-vocabulary-mutations";
import { useCloudinaryUpload } from "../hooks/use-cloudinary-upload";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Card, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import { Skeleton } from "@engducation/ui/components/skeleton";
import { Label } from "@engducation/ui/components/label";
import { Progress } from "@engducation/ui/components/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@engducation/ui/components/alert-dialog";
import { Search, Plus, X, Pencil, Trash2, Volume2, VolumeX, Loader2, Music } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const PARTS_OF_SPEECH = [
  { value: "noun", label: "Danh từ (noun)" },
  { value: "verb", label: "Động từ (verb)" },
  { value: "adjective", label: "Tính từ (adjective)" },
  { value: "adverb", label: "Trạng từ (adverb)" },
  { value: "preposition", label: "Giới từ (preposition)" },
  { value: "conjunction", label: "Liên từ (conjunction)" },
  { value: "idiom", label: "Thành ngữ (idiom)" },
  { value: "phrasal_verb", label: "Cụm động từ (phrasal verb)" },
] as const;

type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "preposition" | "conjunction" | "idiom" | "phrasal_verb";

interface VocabularyFormData {
  courseId: string;
  moduleId: string;
  word: string;
  partOfSpeech: PartOfSpeech;
  phonetics: string;
  definition: string;
  translation: string;
  example: string;
  exampleTranslation: string;
  mediaUrl: string;
}

interface VocabularyItem {
  id: string;
  courseId: string;
  moduleId: string | null;
  word: string;
  partOfSpeech: string;
  phonetics: string;
  definition: string;
  translation: string;
  example: string;
  exampleTranslation: string;
  mediaUrl: string | null;
  status: string;
}

const PAGE_SIZE = 20;
const DEFAULT_FORM: VocabularyFormData = {
  courseId: "",
  moduleId: "",
  word: "",
  partOfSpeech: "noun",
  phonetics: "",
  definition: "",
  translation: "",
  example: "",
  exampleTranslation: "",
  mediaUrl: "",
};

// Zod Schema matching backend validation rules and custom specs
const vocabularyFormSchema = z.object({
  courseId: z.string().min(1, "Vui lòng chọn khóa học"),
  moduleId: z.string().optional().nullable().or(z.literal("")),
  word: z
    .string()
    .min(1, "Từ gốc không được để trống")
    .transform((val) => val.trim().toLowerCase()),
  partOfSpeech: z.enum([
    "noun",
    "verb",
    "adjective",
    "adverb",
    "preposition",
    "conjunction",
    "idiom",
    "phrasal_verb",
  ]),
  phonetics: z
    .string()
    .min(1, "Phiên âm không được để trống")
    .refine((val) => val.startsWith("/") && val.endsWith("/"), {
      message: "Phiên âm phải bắt đầu và kết thúc bằng dấu gạch chéo /.../ (ví dụ: /ˈæp.əl/)",
    }),
  definition: z.string().min(1, "Định nghĩa không được để trống").transform((val) => val.trim()),
  translation: z.string().min(1, "Dịch nghĩa không được để trống").transform((val) => val.trim()),
  example: z.string().min(1, "Câu ví dụ tiếng Anh không được để trống").transform((val) => val.trim()),
  exampleTranslation: z.string().min(1, "Bản dịch câu ví dụ không được để trống").transform((val) => val.trim()),
  mediaUrl: z
    .string()
    .url("URL âm thanh phát âm không hợp lệ")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? "" : v)),
});

export interface AdminVocabularyManagerProps {
  courseId?: string;
  moduleId?: string;
  trigger?: number;
}

export function AdminVocabularyManager({ courseId, moduleId, trigger }: AdminVocabularyManagerProps = {}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(courseId ?? "");
  const [selectedModuleId, setSelectedModuleId] = useState(moduleId ?? "");
  const [showForm, setShowForm] = useState(!!moduleId);
  const [editingItem, setEditingItem] = useState<VocabularyItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VocabularyItem | null>(null);
  const [formData, setFormData] = useState<VocabularyFormData>({
    ...DEFAULT_FORM,
    courseId: courseId ?? "",
    moduleId: moduleId ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof VocabularyFormData, string>>>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      setSelectedCourseId(courseId);
      setFormData((prev) => ({ ...prev, courseId }));
    }
  }, [courseId]);

  useEffect(() => {
    if (moduleId) {
      setSelectedModuleId(moduleId);
      setFormData((prev) => ({ ...prev, moduleId }));
      setShowForm(true);
    }
  }, [moduleId, trigger]);

  const { create, update, remove } = useVocabularyMutations();
  const { upload } = useCloudinaryUpload({
    resourceType: "auto",
    folder: "engducation/vocabularies/audio",
  });

  // Fetch list of courses for select dropdown
  const { data: coursesData } = useQuery(
    trpc.admin.courseList.queryOptions({ pageSize: 100 })
  );
  const courses = coursesData?.items ?? [];

  // Fetch course detail for selected course to get modules list
  const activeCourseId = formData.courseId || selectedCourseId;
  const { data: courseDetail } = useQuery(
    trpc.admin.courseGetDetail.queryOptions(
      { courseId: activeCourseId },
      { enabled: !!activeCourseId }
    )
  );
  const modules = courseDetail?.modules ?? [];

  // Fetch vocabularies list
  const { data, isLoading } = useQuery(
    trpc.adminVocabulary.list.queryOptions({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      courseId: selectedCourseId || undefined,
      moduleId: selectedModuleId || undefined,
    })
  );

  const validate = (): boolean => {
    const parsed = vocabularyFormSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof VocabularyFormData, string>> = {};
      parsed.error.issues.forEach((err: any) => {
        const path = err.path[0] as keyof VocabularyFormData;
        if (path) {
          fieldErrors[path] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 1MB
    if (file.size > 1024 * 1024) {
      toast.error("Dung lượng file phát âm phải nhỏ hơn 1MB");
      return;
    }

    // Check file extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "mp3" && ext !== "wav" && ext !== "m4a") {
      toast.error("Chỉ hỗ trợ định dạng âm thanh .mp3, .wav hoặc .m4a");
      return;
    }

    try {
      setUploadProgress(0);
      const res = await upload.mutateAsync({
        file,
        onProgress: (p) => {
          const percent = Math.round((p.loaded / p.total) * 100);
          setUploadProgress(percent);
        },
      });

      updateField("mediaUrl", res.secureUrl);
      toast.success("Tải file âm thanh phát âm lên thành công!");
    } catch (err: any) {
      toast.error(err.message || "Tải âm thanh lên thất bại");
    } finally {
      setUploadProgress(null);
    }
  };

  const playPreviewAudio = (url: string, id: string) => {
    if (!url) return;
    setPreviewPlayingId(id);
    const audio = new Audio(url);
    audio.play()
      .then(() => {
        audio.onended = () => setPreviewPlayingId(null);
      })
      .catch((err) => {
        toast.error("Không thể phát thử âm thanh: " + err.message);
        setPreviewPlayingId(null);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại thông tin nhập liệu");
      return;
    }

    const payload = {
      courseId: formData.courseId,
      moduleId: formData.moduleId || null,
      word: formData.word.trim().toLowerCase(),
      partOfSpeech: formData.partOfSpeech,
      phonetics: formData.phonetics.trim(),
      definition: formData.definition.trim(),
      translation: formData.translation.trim(),
      example: formData.example.trim(),
      exampleTranslation: formData.exampleTranslation.trim(),
      mediaUrl: formData.mediaUrl.trim() || undefined,
    };

    try {
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      resetForm();
    } catch {
      // Handled in mutations
    }
  };

  const resetForm = () => {
    setFormData({
      ...DEFAULT_FORM,
      courseId: courseId ?? selectedCourseId, // Giữ lại khóa học đang lọc cho tiện
      moduleId: selectedModuleId,
    });
    setErrors({});
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item: VocabularyItem) => {
    setEditingItem(item);
    setFormData({
      courseId: item.courseId,
      moduleId: item.moduleId ?? "",
      word: item.word,
      partOfSpeech: item.partOfSpeech as PartOfSpeech,
      phonetics: item.phonetics,
      definition: item.definition,
      translation: item.translation,
      example: item.example,
      exampleTranslation: item.exampleTranslation,
      mediaUrl: item.mediaUrl ?? "",
    });
    setErrors({});
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await remove.mutateAsync({ id: deleteTarget.id });
    setDeleteTarget(null);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    const timer = setTimeout(() => setDebouncedSearch(value), 400);
    return () => clearTimeout(timer);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedCourseId("");
    setSelectedModuleId("");
    setPage(1);
  };

  const hasFilters = !!search || !!selectedCourseId || !!selectedModuleId;
  const isPending = create.isPending || update.isPending;

  const updateField = <K extends keyof VocabularyFormData>(key: K, value: VocabularyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  return (
    <div className="space-y-4">
      {/* Filter & Action Bar */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm kiếm từ vựng..."
                className="pl-9 h-8 text-xs"
              />
            </div>

            {/* Course Filter */}
            {!courseId && (
              <select
                value={selectedCourseId}
                onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedModuleId(""); setPage(1); }}
                className="flex h-8 border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm outline-none focus-visible:ring-1"
              >
                <option value="">Tất cả Khóa học</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            )}

            {/* Module Filter */}
            {selectedCourseId && (
              <select
                value={selectedModuleId}
                onChange={(e) => { setSelectedModuleId(e.target.value); setPage(1); }}
                className="flex h-8 border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm outline-none focus-visible:ring-1"
              >
                <option value="">Tất cả Module</option>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            )}

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1.5">
                <X className="h-3 w-3" /> Xóa lọc
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => { resetForm(); setShowForm(true); }}
              className="ml-auto h-8 text-xs gap-1.5 font-bold"
            >
              <Plus className="h-3 w-3" />
              Thêm từ vựng
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vocabulary Form Panel */}
        {showForm && (
          <Card className="border border-border bg-card shadow-sm lg:col-span-1 h-fit">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">
                  {editingItem ? "Sửa từ vựng" : "Thêm từ vựng mới"}
                </h3>
                <Button variant="ghost" size="sm" onClick={resetForm} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                {/* Course Selection in Form */}
                {!courseId && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Thuộc Khóa học *</Label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => {
                        updateField("courseId", e.target.value);
                        updateField("moduleId", "");
                      }}
                      className="h-8 border border-input bg-background px-2 text-xs shadow-sm outline-none"
                    >
                      <option value="">-- Chọn khóa học --</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    {errors.courseId && <p className="text-[10px] text-destructive">{errors.courseId}</p>}
                  </div>
                )}

                {/* Module Selection in Form */}
                {formData.courseId && modules.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Thuộc Module (Không bắt buộc)</Label>
                    <select
                      value={formData.moduleId}
                      onChange={(e) => updateField("moduleId", e.target.value)}
                      className="h-8 border border-input bg-background px-2 text-xs shadow-sm outline-none"
                    >
                      <option value="">-- Không thuộc module nào --</option>
                      {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </div>
                )}

                {/* Word */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Từ gốc *</Label>
                  <Input
                    value={formData.word}
                    onChange={(e) => updateField("word", e.target.value)}
                    placeholder="ví dụ: ephemeral"
                    className="h-8 text-xs"
                  />
                  {errors.word && <p className="text-[10px] text-destructive">{errors.word}</p>}
                </div>

                {/* Phonetics */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Phiên âm (Phonetics) *</Label>
                  <Input
                    value={formData.phonetics}
                    onChange={(e) => updateField("phonetics", e.target.value)}
                    placeholder="ví dụ: /ˈæp.əl/ hoặc /ɪˈfem.ər.əl/"
                    className="h-8 text-xs"
                  />
                  {errors.phonetics && <p className="text-[10px] text-destructive">{errors.phonetics}</p>}
                </div>

                {/* Part of Speech */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Từ loại</Label>
                  <select
                    value={formData.partOfSpeech}
                    onChange={(e) => updateField("partOfSpeech", e.target.value as PartOfSpeech)}
                    className="h-8 border border-input bg-background px-2 text-xs shadow-sm outline-none"
                  >
                    {PARTS_OF_SPEECH.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Definition */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Định nghĩa *</Label>
                  <Input
                    value={formData.definition}
                    onChange={(e) => updateField("definition", e.target.value)}
                    placeholder="ví dụ: Lasting for a very short time"
                    className="h-8 text-xs"
                  />
                  {errors.definition && <p className="text-[10px] text-destructive">{errors.definition}</p>}
                </div>

                {/* Translation */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Dịch nghĩa tiếng Việt *</Label>
                  <Input
                    value={formData.translation}
                    onChange={(e) => updateField("translation", e.target.value)}
                    placeholder="ví dụ: nhất thời, phù du"
                    className="h-8 text-xs"
                  />
                  {errors.translation && <p className="text-[10px] text-destructive">{errors.translation}</p>}
                </div>

                {/* Example */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Câu ví dụ (EN) *</Label>
                  <Input
                    value={formData.example}
                    onChange={(e) => updateField("example", e.target.value)}
                    placeholder="ví dụ: Fame in the digital age is often ephemeral."
                    className="h-8 text-xs"
                  />
                  {errors.example && <p className="text-[10px] text-destructive">{errors.example}</p>}
                </div>

                {/* Example Translation */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Dịch câu ví dụ (VI) *</Label>
                  <Input
                    value={formData.exampleTranslation}
                    onChange={(e) => updateField("exampleTranslation", e.target.value)}
                    placeholder="ví dụ: Danh tiếng trong thời đại số thường chỉ là nhất thời."
                    className="h-8 text-xs"
                  />
                  {errors.exampleTranslation && <p className="text-[10px] text-destructive">{errors.exampleTranslation}</p>}
                </div>

                {/* Audio/Media Upload Flow */}
                <div className="flex flex-col gap-1.5 border border-dashed border-border/80 rounded-xl p-3 bg-muted/5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Music className="h-3 w-3 text-indigo-500" /> File phát âm âm thanh (.mp3, .wav)
                  </Label>

                  <div className="relative">
                    <Input
                      type="file"
                      accept=".mp3,.wav,.m4a"
                      onChange={handleAudioUpload}
                      disabled={uploadProgress !== null}
                      className="h-9 text-[10px] bg-background file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-500/10 file:text-indigo-600 hover:file:bg-indigo-500/20 cursor-pointer"
                    />
                    {uploadProgress !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span className="text-[9px] font-bold text-muted-foreground font-mono">{uploadProgress}%</span>
                      </div>
                    )}
                  </div>

                  {uploadProgress !== null && (
                    <Progress value={uploadProgress} className="h-1 mt-1" />
                  )}

                  {/* Manual URL link input as backup */}
                  <div className="mt-2 space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground">Hoặc dán URL âm thanh/hình ảnh</Label>
                    <div className="flex gap-1.5">
                      <Input
                        value={formData.mediaUrl}
                        onChange={(e) => updateField("mediaUrl", e.target.value)}
                        placeholder="https://..."
                        type="url"
                        className="h-8 text-xs flex-1"
                      />
                      {formData.mediaUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => playPreviewAudio(formData.mediaUrl, "form-preview")}
                          className={`h-8 w-8 rounded-xl shrink-0 ${previewPlayingId === "form-preview" ? "text-primary bg-primary/10 animate-pulse border-primary/20" : ""}`}
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {errors.mediaUrl && <p className="text-[10px] text-destructive">{errors.mediaUrl}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {editingItem && (
                    <Button type="button" variant="outline" onClick={resetForm} className="h-8 text-xs font-bold">
                      Hủy
                    </Button>
                  )}
                  <Button type="submit" disabled={isPending || uploadProgress !== null} className="h-8 text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground">
                    {isPending ? "ĐANG LƯU..." : editingItem ? "CẬP NHẬT" : "THÊM MỚI"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Vocabulary List */}
        <div className={showForm ? "lg:col-span-2" : "col-span-1 lg:col-span-3"}>
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : !data?.items.length ? (
                <div className="p-8 text-center text-xs text-muted-foreground italic">
                  {hasFilters ? "Không tìm thấy từ vựng phù hợp" : "Chưa có từ vựng nào"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {data.items.map((item) => (
                    <div key={item.id} className="p-3.5 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-foreground">{item.word}</span>
                            <span className="text-[11px] text-muted-foreground font-mono bg-muted/30 px-1.5 py-0.5 rounded">{item.phonetics}</span>
                            <Badge variant="outline" className="text-[9px] font-black uppercase text-muted-foreground">
                              {item.partOfSpeech}
                            </Badge>
                            <Badge variant="outline" className={`text-[9px] font-bold uppercase ${
                              item.status === "published"
                                ? "border-emerald-500/20 text-emerald-600"
                                : "border-amber-500/20 text-amber-600"
                            }`}>
                              {item.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-xs text-foreground font-semibold mt-1">
                            {item.translation}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Định nghĩa: {item.definition}
                          </div>

                          <div className="mt-2 bg-muted/5 rounded-lg p-2 border border-border/40 text-[10px] space-y-0.5 max-w-xl">
                            <div className="text-foreground italic font-medium">&ldquo;{item.example}&rdquo;</div>
                            <div className="text-muted-foreground">{item.exampleTranslation}</div>
                          </div>

                          <div className="text-[9px] text-indigo-500 font-bold mt-2 flex items-center gap-1.5 flex-wrap">
                            <span>Khóa học ID: {item.courseId}</span>
                            {item.moduleId && <span>· Module ID: {item.moduleId}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.mediaUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => playPreviewAudio(item.mediaUrl!, item.id)}
                              className={`h-7 w-7 p-0 rounded-xl text-muted-foreground hover:text-primary ${previewPlayingId === item.id ? "text-primary bg-primary/10 animate-pulse" : ""}`}
                              title="Nghe thử"
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="h-7 w-7 p-0 rounded-xl text-muted-foreground/20 cursor-not-allowed"
                              title="Không có âm thanh/hình ảnh"
                            >
                              <VolumeX className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-7 w-7 p-0 rounded-xl text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(item)}
                            className="h-7 w-7 p-0 rounded-xl text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Trang {page} / {data.pagination.totalPages} — {data.pagination.total} từ vựng
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="h-7 text-[10px] font-bold rounded-xl"
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.pagination.totalPages}
                      className="h-7 text-[10px] font-bold rounded-xl"
                    >
                      →
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-extrabold text-sm uppercase tracking-wide">Xóa từ vựng khỏi hệ thống</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xóa từ vựng{' '}
              <strong className="text-foreground font-bold">&ldquo;{deleteTarget?.word}&rdquo;</strong>?
              <br />
              <span className="text-destructive font-semibold">Cảnh báo:</span> Hành động này sẽ tự động xóa sạch lượt Bookmark từ vựng này của toàn bộ học viên. Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)} className="h-8 text-xs font-bold rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={remove.isPending} className="h-8 text-xs font-bold rounded-xl bg-destructive hover:bg-destructive/95 text-destructive-foreground">
              {remove.isPending ? "Đang xóa..." : "Xóa từ vựng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
