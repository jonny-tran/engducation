"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useVocabularyMutations } from "../hooks/use-vocabulary-mutations";
import { useCloudinaryUpload } from "../hooks/use-cloudinary-upload";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import { Label } from "@engducation/ui/components/label";
import { Progress } from "@engducation/ui/components/progress";
import {
  Volume2,
  VolumeX,
  Loader2,
  Music,
  Globe,
  Languages,
  BookOpen,
  Sparkles,
  Award,
  Plus,
  Trash2,
  X,
} from "lucide-react";
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

interface ExampleRow {
  id: string;
  sentenceEn: string;
  sentenceVi: string;
}

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
  courseId: string;
  moduleId: string;
  vocabulary?: VocabularyItem | null;
  onFinished: () => void;
}

export function AdminVocabularyManager({
  courseId,
  moduleId,
  vocabulary,
  onFinished,
}: AdminVocabularyManagerProps) {
  const [formData, setFormData] = useState<VocabularyFormData>({
    ...DEFAULT_FORM,
    courseId,
    moduleId,
  });

  const [examples, setExamples] = useState<ExampleRow[]>([
    { id: "default-1", sentenceEn: "", sentenceVi: "" },
  ]);

  const [errors, setErrors] = useState<Partial<Record<keyof VocabularyFormData, string>>>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);

  const { create, update } = useVocabularyMutations();
  const { upload } = useCloudinaryUpload({
    resourceType: "auto",
    folder: "engducation/vocabularies/audio",
  });

  // Load existing vocabulary item on edit
  useEffect(() => {
    if (vocabulary) {
      setFormData({
        courseId: vocabulary.courseId,
        moduleId: vocabulary.moduleId ?? "",
        word: vocabulary.word,
        partOfSpeech: vocabulary.partOfSpeech as PartOfSpeech,
        phonetics: vocabulary.phonetics,
        definition: vocabulary.definition,
        translation: vocabulary.translation,
        example: vocabulary.example,
        exampleTranslation: vocabulary.exampleTranslation,
        mediaUrl: vocabulary.mediaUrl ?? "",
      });

      const enList = vocabulary.example ? vocabulary.example.split("\n") : [];
      const viList = vocabulary.exampleTranslation ? vocabulary.exampleTranslation.split("\n") : [];

      const loadedExamples: ExampleRow[] = enList.length > 0
        ? enList.map((en, index) => ({
            id: `edit-${index}`,
            sentenceEn: en,
            sentenceVi: viList[index] ?? "",
          }))
        : [{ id: "default-1", sentenceEn: "", sentenceVi: "" }];

      setExamples(loadedExamples);
    } else {
      setFormData({
        ...DEFAULT_FORM,
        courseId,
        moduleId,
      });
      setExamples([{ id: "default-1", sentenceEn: "", sentenceVi: "" }]);
    }
    setErrors({});
  }, [vocabulary, courseId, moduleId]);

  const updateField = <K extends keyof VocabularyFormData>(key: K, value: VocabularyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // Dynamic Array Field handlers for Examples
  const addExampleRow = () => {
    setExamples((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), sentenceEn: "", sentenceVi: "" },
    ]);
  };

  const updateExampleRow = (id: string, field: "sentenceEn" | "sentenceVi", value: string) => {
    setExamples((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeExampleRow = (id: string) => {
    if (examples.length === 1) {
      toast.warning("Phải giữ lại ít nhất một câu ví dụ.");
      return;
    }
    setExamples((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Dung lượng file phát âm phải nhỏ hơn 1MB");
      return;
    }

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

    // 1. Serialize Dynamic examples into backward-compatible newline separated strings
    const joinedEn = examples.map((row) => row.sentenceEn.trim()).filter(Boolean).join("\n");
    const joinedVi = examples.map((row) => row.sentenceVi.trim()).filter(Boolean).join("\n");

    const finalFormData = {
      ...formData,
      example: joinedEn,
      exampleTranslation: joinedVi,
    };

    // 2. Validate against schema
    const parsed = vocabularyFormSchema.safeParse(finalFormData);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof VocabularyFormData, string>> = {};
      parsed.error.issues.forEach((err: any) => {
        const path = err.path[0] as keyof VocabularyFormData;
        if (path) {
          fieldErrors[path] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Vui lòng kiểm tra lại thông tin nhập liệu");
      return;
    }
    setErrors({});

    const payload = {
      courseId: finalFormData.courseId,
      moduleId: finalFormData.moduleId || null,
      word: finalFormData.word.trim().toLowerCase(),
      partOfSpeech: finalFormData.partOfSpeech,
      phonetics: finalFormData.phonetics.trim(),
      definition: finalFormData.definition.trim(),
      translation: finalFormData.translation.trim(),
      example: finalFormData.example,
      exampleTranslation: finalFormData.exampleTranslation,
      mediaUrl: finalFormData.mediaUrl.trim() || undefined,
    };

    try {
      if (vocabulary) {
        await update.mutateAsync({ id: vocabulary.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      toast.success(vocabulary ? "Cập nhật từ vựng thành công!" : "Tạo từ vựng thành công!");
      onFinished();
    } catch {
      // Handled in mutations
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Card className="border border-border bg-card/60 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
      <CardHeader className="py-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-rose-500/10 text-rose-500">
            <BookOpen className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-card-foreground">
            {vocabulary ? "Chỉnh sửa từ vựng" : "Thêm từ vựng (Structured Vocabulary)"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Card 1: Core Fields */}
          <Card className="border border-border/50 bg-muted/5 rounded-2xl p-4 space-y-4 shadow-3xs">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pb-1.5 border-b border-border/40 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-rose-500" />
              Thông tin cốt lõi
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="font-bold uppercase text-muted-foreground text-[10px]">Từ gốc *</Label>
                <Input
                  value={formData.word}
                  onChange={(e) => updateField("word", e.target.value)}
                  placeholder="Ví dụ: ephemerality"
                  className="h-8.5 text-xs rounded-xl"
                />
                {errors.word && <p className="text-[10px] text-destructive font-medium">{errors.word}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="font-bold uppercase text-muted-foreground text-[10px]">Phiên âm (Phonetics) *</Label>
                <Input
                  value={formData.phonetics}
                  onChange={(e) => updateField("phonetics", e.target.value)}
                  placeholder="Ví dụ: /ɪˌfem.ər.ˈæl.ə.ti/"
                  className="h-8.5 text-xs rounded-xl"
                />
                {errors.phonetics && <p className="text-[10px] text-destructive font-medium">{errors.phonetics}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="font-bold uppercase text-muted-foreground text-[10px]">Từ loại *</Label>
                <select
                  value={formData.partOfSpeech}
                  onChange={(e) => updateField("partOfSpeech", e.target.value as PartOfSpeech)}
                  className="flex h-8.5 w-full border border-border/80 bg-background rounded-xl px-2.5 py-0.5 text-xs text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50"
                >
                  {PARTS_OF_SPEECH.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Card 2: Meaning fields */}
          <Card className="border border-border/50 bg-muted/5 rounded-2xl p-4 space-y-4 shadow-3xs">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pb-1.5 border-b border-border/40 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-rose-500" />
              Định nghĩa &amp; Dịch nghĩa
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="font-bold uppercase text-muted-foreground text-[10px]">Định nghĩa tiếng Anh *</Label>
              <Textarea
                value={formData.definition}
                onChange={(e) => updateField("definition", e.target.value)}
                placeholder="Ví dụ: The concept of lasting for a very short time..."
                className="min-h-[60px] text-xs rounded-xl focus:border-rose-500/50"
              />
              {errors.definition && <p className="text-[10px] text-destructive font-medium">{errors.definition}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="font-bold uppercase text-muted-foreground text-[10px]">Dịch nghĩa tiếng Việt *</Label>
              <Input
                value={formData.translation}
                onChange={(e) => updateField("translation", e.target.value)}
                placeholder="Ví dụ: Sự nhất thời, tính chất phù du"
                className="h-8.5 text-xs rounded-xl"
              />
              {errors.translation && <p className="text-[10px] text-destructive font-medium">{errors.translation}</p>}
            </div>
          </Card>

          {/* Card 3: Dynamic Examples Card */}
          <Card className="border border-border/50 bg-muted/5 rounded-2xl p-4 space-y-4 shadow-3xs">
            <div className="flex items-center justify-between pb-1 border-b border-border/40">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                Danh sách ví dụ thực tế *
              </div>
              <Badge variant="outline" className="text-[9px] font-mono border-rose-500/20 text-rose-600 bg-rose-500/5 px-2 rounded-full leading-none py-0.5">
                {examples.length} câu ví dụ
              </Badge>
            </div>

            <div className="space-y-4">
              {examples.map((row, idx) => (
                <div
                  key={row.id}
                  className="relative p-4 rounded-xl border border-border/40 bg-background/50 hover:bg-background/85 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Ví dụ #{idx + 1}</span>
                    {examples.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExampleRow(row.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[9px] font-bold text-muted-foreground">Câu ví dụ tiếng Anh</Label>
                      <Input
                        value={row.sentenceEn}
                        onChange={(e) => updateExampleRow(row.id, "sentenceEn", e.target.value)}
                        placeholder="English sentence..."
                        className="h-8 text-xs rounded-xl"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[9px] font-bold text-muted-foreground">Dịch nghĩa câu ví dụ</Label>
                      <Input
                        value={row.sentenceVi}
                        onChange={(e) => updateExampleRow(row.id, "sentenceVi", e.target.value)}
                        placeholder="Vietnamese translation..."
                        className="h-8 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addExampleRow}
              className="h-8 text-[10px] font-bold w-full border-dashed rounded-xl"
            >
              <Plus className="h-3 w-3 mr-1" /> Thêm câu ví dụ mới
            </Button>
          </Card>

          {/* Card 4: Audio Pronunciation */}
          <Card className="border border-border/50 bg-muted/5 rounded-2xl p-4 space-y-4 shadow-3xs">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pb-1.5 border-b border-border/40 flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-rose-500" />
              Phát âm âm thanh
            </div>

            <div className="relative">
              <Input
                type="file"
                accept=".mp3,.wav,.m4a"
                onChange={handleAudioUpload}
                disabled={uploadProgress !== null}
                className="h-9 text-[10px] bg-background file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-500/10 file:text-indigo-600 hover:file:bg-indigo-500/20 cursor-pointer rounded-xl"
              />
              {uploadProgress !== null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-[9px] font-bold text-muted-foreground font-mono">{uploadProgress}%</span>
                </div>
              )}
            </div>

            {uploadProgress !== null && <Progress value={uploadProgress} className="h-1 rounded-full" />}

            <div className="space-y-2">
              <Label className="text-[9px] font-bold text-muted-foreground">Hoặc liên kết trực tiếp URL tệp âm thanh</Label>
              <div className="flex gap-1.5">
                <Input
                  value={formData.mediaUrl}
                  onChange={(e) => updateField("mediaUrl", e.target.value)}
                  placeholder="Dán đường dẫn phát âm mẫu (mp3)..."
                  type="url"
                  className="h-8.5 text-xs flex-1 rounded-xl"
                />
                {formData.mediaUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => playPreviewAudio(formData.mediaUrl, "form-preview")}
                    className={`h-8.5 w-8.5 rounded-xl shrink-0 ${
                      previewPlayingId === "form-preview" ? "text-primary bg-primary/10 animate-pulse border-primary/20" : ""
                    }`}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {errors.mediaUrl && <p className="text-[10px] text-destructive font-medium">{errors.mediaUrl}</p>}
            </div>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onFinished} className="h-9 text-xs font-bold rounded-xl">
              HỦY
            </Button>
            <Button
              type="submit"
              disabled={isPending || uploadProgress !== null}
              className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/10 px-4"
            >
              {isPending ? "ĐANG LƯU..." : vocabulary ? "CẬP NHẬT TỪ VỰNG" : "TẠO TỪ VỰNG"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
