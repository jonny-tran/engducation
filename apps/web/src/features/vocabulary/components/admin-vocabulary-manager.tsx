"use client";
import React, { useState, useEffect } from "react";
import { useVocabularyMutations } from "../hooks/use-vocabulary-mutations";
import { useCloudinaryUpload } from "@/features/learning-content/hooks/use-cloudinary-upload";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import { Progress } from "@engducation/ui/components/progress";
import { Label } from "@engducation/ui/components/label";
import { Textarea } from "@engducation/ui/components/textarea";
import { Volume2, Loader2, Music, Plus, Trash2, BookOpen, Sparkles, Type, FileAudio } from "lucide-react";
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

const formSchema = z.object({
  word: z.string().min(1, "Từ gốc không được để trống").transform(v => v.trim().toLowerCase()),
  partOfSpeech: z.string().min(1),
  phonetics: z.string().min(1, "Phiên âm không được để trống").refine(v => v.startsWith("/") && v.endsWith("/"), "Phiên âm phải bắt đầu và kết thúc bằng /.../"),
  definition: z.string().min(1, "Định nghĩa không được để trống"),
  translation: z.string().min(1, "Dịch nghĩa không được để trống"),
  example: z.string().min(1, "Câu ví dụ không được để trống"),
  exampleTranslation: z.string().min(1, "Bản dịch câu ví dụ không được để trống"),
  mediaUrl: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
});

export function AdminVocabularyManager({ courseId, moduleId, vocabulary, onFinished }: any) {
  const [formData, setFormData] = useState<any>({ word: "", partOfSpeech: "noun", phonetics: "", definition: "", translation: "", mediaUrl: "" });
  const [examples, setExamples] = useState<any[]>([{ id: "def-1", sentenceEn: "", sentenceVi: "" }]);
  const [errors, setErrors] = useState<any>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const { create, update } = useVocabularyMutations();
  const { upload } = useCloudinaryUpload({ resourceType: "auto", folder: "engducation/vocabularies/audio" });

  useEffect(() => {
    if (vocabulary) {
      setFormData({
        word: vocabulary.word, partOfSpeech: vocabulary.partOfSpeech, phonetics: vocabulary.phonetics,
        definition: vocabulary.definition, translation: vocabulary.translation, mediaUrl: vocabulary.mediaUrl ?? ""
      });
      const enList = vocabulary.example ? vocabulary.example.split("\n") : [];
      const viList = vocabulary.exampleTranslation ? vocabulary.exampleTranslation.split("\n") : [];
      setExamples(enList.length > 0 ? enList.map((en: string, i: number) => ({ id: `edit-${i}`, sentenceEn: en, sentenceVi: viList[i] ?? "" })) : [{ id: "def-1", sentenceEn: "", sentenceVi: "" }]);
    } else {
      setFormData({ word: "", partOfSpeech: "noun", phonetics: "", definition: "", translation: "", mediaUrl: "" });
      setExamples([{ id: "def-1", sentenceEn: "", sentenceVi: "" }]);
    }
    setErrors({});
  }, [vocabulary, courseId, moduleId]);

  const updateField = (name: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: "" }));
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return toast.error("Dung lượng file âm thanh phải nhỏ hơn 1MB");

    try {
      setUploadProgress(0);
      const res = await upload.mutateAsync({
        file,
        onProgress: (p) => setUploadProgress(Math.round((p.loaded / p.total) * 100)),
      });
      updateField("mediaUrl", res.secureUrl);
      toast.success("Tải file phát âm lên thành công!");
    } catch (err: any) {
      toast.error(err.message || "Tải âm thanh lên thất bại");
    } finally {
      setUploadProgress(null);
    }
  };

  const playAudio = () => {
    if (!formData.mediaUrl) return;
    setPreviewPlaying(true);
    const audio = new Audio(formData.mediaUrl);
    audio.play().then(() => audio.onended = () => setPreviewPlaying(false)).catch(() => setPreviewPlaying(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const joinedEn = examples.map(r => r.sentenceEn.trim()).filter(Boolean).join("\n");
    const joinedVi = examples.map(r => r.sentenceVi.trim()).filter(Boolean).join("\n");

    const finalData = { ...formData, example: joinedEn, exampleTranslation: joinedVi };
    const parsed = formSchema.safeParse(finalData);

    if (!parsed.success) {
      const fieldErrors: any = {};
      parsed.error.issues.forEach((err: any) => { fieldErrors[err.path[0]] = err.message; });
      setErrors(fieldErrors);
      return toast.error("Vui lòng kiểm tra lại thông tin nhập liệu");
    }

    const payload = {
      courseId, moduleId: moduleId || null,
      word: formData.word.trim().toLowerCase(), partOfSpeech: formData.partOfSpeech,
      phonetics: formData.phonetics.trim(), definition: formData.definition.trim(),
      translation: formData.translation.trim(), example: joinedEn, exampleTranslation: joinedVi,
      mediaUrl: formData.mediaUrl.trim() || undefined
    };

    vocabulary ? await update.mutateAsync({ id: vocabulary.id, ...payload }) : await create.mutateAsync(payload);
    onFinished();
  };

  return (
    <Card className="border border-muted/60 dark:border-muted/30 bg-gradient-to-b from-card to-muted/10 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300 rounded-2xl">
      <CardHeader className="py-5 px-6 border-b border-muted/40 dark:border-muted/20 bg-muted/20 dark:bg-muted/10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-card-foreground">
              {vocabulary ? "Chỉnh sửa từ vựng" : "Thêm từ vựng mới"}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
              {vocabulary ? "Cấu hình lại các thuộc tính chi tiết của từ vựng" : "Tạo mới và thiết lập học liệu từ vựng cho bài học"}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Core Information & Media (Bento Bento Left) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Bento Box 1: Core Info */}
              <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-muted/40 dark:border-muted/20">
                  <Sparkles className="h-4 w-4 text-rose-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
                    Thông tin cốt lõi
                  </h3>
                </div>

                <div className="space-y-3.5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="vocab-word" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      Từ gốc <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="vocab-word"
                      value={formData.word}
                      onChange={(e) => updateField("word", e.target.value)}
                      placeholder="Ví dụ: ephemerality"
                      className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all duration-200"
                    />
                    {errors.word && (
                      <p className="text-[10px] text-destructive font-medium mt-0.5">{errors.word}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="vocab-pos" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      Từ loại <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      id="vocab-pos"
                      value={formData.partOfSpeech}
                      onChange={(e) => updateField("partOfSpeech", e.target.value)}
                      className="flex h-9 w-full rounded-xl border border-muted/60 bg-background px-3 py-1 text-xs shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-muted/10 dark:border-muted/30"
                    >
                      {PARTS_OF_SPEECH.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.partOfSpeech && (
                      <p className="text-[10px] text-destructive font-medium mt-0.5">{errors.partOfSpeech}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="vocab-phonetics" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      Phiên âm <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="vocab-phonetics"
                      value={formData.phonetics}
                      onChange={(e) => updateField("phonetics", e.target.value)}
                      placeholder="Ví dụ: /ɪˌfem.ər.ˈæl.ə.ti/"
                      className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all duration-200"
                    />
                    {errors.phonetics && (
                      <p className="text-[10px] text-destructive font-medium mt-0.5">{errors.phonetics}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bento Box 2: Audio & Pronunciation */}
              <AudioUploader
                progress={uploadProgress}
                onUpload={handleAudioUpload}
                url={formData.mediaUrl}
                onUrlChange={(val: string) => updateField("mediaUrl", val)}
                isPlaying={previewPlaying}
                onPlay={playAudio}
              />
            </div>

            {/* Column 2: Definition & Examples (Bento Bento Right) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Bento Box 3: Definition & Translation */}
              <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-muted/40 dark:border-muted/20">
                  <Type className="h-4 w-4 text-rose-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
                    Định nghĩa & Ngữ nghĩa
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="vocab-def" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      Định nghĩa tiếng Anh <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="vocab-def"
                      value={formData.definition}
                      onChange={(e) => updateField("definition", e.target.value)}
                      placeholder="Ví dụ: The concept of things being transitory, existing only briefly..."
                      className="min-h-[108px] text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all duration-200"
                    />
                    {errors.definition && (
                      <p className="text-[10px] text-destructive font-medium mt-0.5">{errors.definition}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="vocab-trans" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                      Dịch nghĩa tiếng Việt <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="vocab-trans"
                      value={formData.translation}
                      onChange={(e) => updateField("translation", e.target.value)}
                      placeholder="Ví dụ: Sự nhất thời, tính chất chóng vánh..."
                      className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all duration-200"
                    />
                    {errors.translation && (
                      <p className="text-[10px] text-destructive font-medium mt-0.5">{errors.translation}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bento Box 4: Practical Examples */}
              <ExamplesList
                examples={examples}
                setExamples={setExamples}
                errors={errors}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-muted/40 dark:border-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={onFinished}
              className="h-9 text-xs font-bold px-5 border border-muted/60 bg-background hover:bg-muted/10 text-muted-foreground hover:text-foreground rounded-xl active:scale-95 transition-all duration-200"
            >
              HỦY
            </Button>
            <Button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="h-9 text-xs font-bold bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl shadow-md px-5 active:scale-95 transition-all duration-200 hover:shadow-rose-500/20 hover:shadow-lg"
            >
              {create.isPending || update.isPending ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ĐANG LƯU...
                </div>
              ) : vocabulary ? (
                "CẬP NHẬT"
              ) : (
                "TẠO TỪ VỰNG"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ExamplesList({ examples, setExamples, errors }: any) {
  const updateRow = (id: string, f: string, v: string) =>
    setExamples((prev: any) =>
      prev.map((r: any) => (r.id === id ? { ...r, [f]: v } : r))
    );
  const removeRow = (id: string) => {
    if (examples.length === 1) return toast.warning("Phải giữ lại ít nhất một câu ví dụ.");
    setExamples((prev: any) => prev.filter((r: any) => r.id !== id));
  };

  return (
    <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-2.5 border-b border-muted/40 dark:border-muted/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rose-500" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
            Ví dụ thực tế <span className="text-rose-500">*</span>
          </h3>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-semibold border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/5 px-2.5 py-0.5 rounded-full"
        >
          {examples.length} câu
        </Badge>
      </div>

      <div className="space-y-4">
        {examples.map((row: any, idx: number) => (
          <div
            key={row.id}
            className="relative p-4 rounded-xl border border-muted/40 bg-muted/20 dark:bg-muted/5 hover:bg-muted/40 dark:hover:bg-muted/10 transition-all duration-200 group space-y-3"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
              <span>Ví dụ #{idx + 1}</span>
            </div>

            {examples.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeRow(row.id)}
                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 flex items-center justify-center p-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Câu tiếng Anh
                </Label>
                <Input
                  value={row.sentenceEn}
                  onChange={(e) => updateRow(row.id, "sentenceEn", e.target.value)}
                  placeholder="English sentence..."
                  className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Bản dịch tiếng Việt
                </Label>
                <Input
                  value={row.sentenceVi}
                  onChange={(e) => updateRow(row.id, "sentenceVi", e.target.value)}
                  placeholder="Bản dịch tiếng Việt..."
                  className="h-9 text-xs rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {(errors.example || errors.exampleTranslation) && (
        <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl space-y-1">
          {errors.example && (
            <p className="text-[10px] text-destructive font-semibold flex items-center gap-1.5">
              <span>•</span> {errors.example}
            </p>
          )}
          {errors.exampleTranslation && (
            <p className="text-[10px] text-destructive font-semibold flex items-center gap-1.5">
              <span>•</span> {errors.exampleTranslation}
            </p>
          )}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setExamples((p: any) => [
            ...p,
            { id: Math.random().toString(36).substr(2, 9), sentenceEn: "", sentenceVi: "" },
          ])
        }
        className="h-9 text-[10px] font-bold w-full border-dashed border-2 border-muted-foreground/20 hover:border-rose-500/50 hover:bg-rose-500/5 text-muted-foreground hover:text-rose-600 transition-all rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98]"
      >
        <Plus className="h-3.5 w-3.5" /> Thêm câu ví dụ
      </Button>
    </div>
  );
}

function AudioUploader({ progress, onUpload, url, onUrlChange, isPlaying, onPlay }: any) {
  return (
    <div className="bg-gradient-to-b from-background to-muted/20 border border-muted/60 dark:border-muted/30 shadow-xs rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 pb-2.5 border-b border-muted/40 dark:border-muted/20">
        <FileAudio className="h-4 w-4 text-rose-500" />
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-card-foreground">
          Âm thanh phát âm
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            Tải tệp lên (.mp3, .wav, .m4a)
          </Label>
          <div className="relative">
            <Input
              type="file"
              accept=".mp3,.wav,.m4a"
              onChange={onUpload}
              disabled={progress !== null}
              className="h-9 text-[10px] bg-background file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-rose-500/10 file:text-rose-600 cursor-pointer rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500"
            />
            {progress !== null && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-background/80 pl-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                <span className="text-[9px] font-bold font-mono text-rose-600">{progress}%</span>
              </div>
            )}
          </div>
          {progress !== null && (
            <Progress value={progress} className="h-1 bg-rose-100 dark:bg-rose-950/20" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            Hoặc dán liên kết âm thanh trực tiếp (mp3)
          </Label>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="Dán đường dẫn phát âm mẫu (mp3)..."
              type="url"
              className="h-9 text-xs flex-1 rounded-xl border-muted/60 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all duration-200"
            />
            {url && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onPlay}
                className={`h-9 w-9 rounded-xl border border-muted/60 active:scale-95 transition-all duration-200 flex items-center justify-center p-0 shrink-0 ${
                  isPlaying ? "text-rose-500 bg-rose-500/10 border-rose-500/30 animate-pulse" : "hover:bg-muted/10"
                }`}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
