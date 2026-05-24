"use client";
import React, { useState, useEffect } from "react";
import { useVocabularyMutations } from "../hooks/use-vocabulary-mutations";
import { useCloudinaryUpload } from "@/features/learning-content";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import { Progress } from "@engducation/ui/components/progress";
import { Volume2, Loader2, Music, Plus, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { FormFieldDynamic } from "@/components/ui/form-field-dynamic";

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

const vocabularyFormFields = [
  { name: "word", label: "Từ gốc", type: "text", placeholder: "Ví dụ: ephemerality", required: true },
  { name: "phonetics", label: "Phiên âm (Phonetics)", type: "text", placeholder: "Ví dụ: /ɪˌfem.ər.ˈæl.ə.ti/", required: true },
  { name: "partOfSpeech", label: "Từ loại", type: "select", options: PARTS_OF_SPEECH, required: true },
  { name: "definition", label: "Định nghĩa tiếng Anh", type: "textarea", placeholder: "Ví dụ: The concept...", required: true },
  { name: "translation", label: "Dịch nghĩa tiếng Việt", type: "text", placeholder: "Ví dụ: Sự nhất thời...", required: true },
  { name: "examples", label: "Danh sách ví dụ thực tế", type: "custom", required: true },
  { name: "mediaUrl", label: "Phát âm âm thanh", type: "custom" }
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
    <Card className="border border-border bg-card/60 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
      <CardHeader className="py-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-rose-500" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-card-foreground">
            {vocabulary ? "Chỉnh sửa từ vựng" : "Thêm từ vựng mới"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {vocabularyFormFields.map((field) => (
            <FormFieldDynamic
              key={field.name}
              field={field as any}
              value={formData[field.name]}
              onChange={(val) => updateField(field.name, val)}
              error={errors[field.name]}
              customRender={
                field.name === "examples" ? (
                  <ExamplesList examples={examples} setExamples={setExamples} />
                ) : field.name === "mediaUrl" ? (
                  <AudioUploader
                    progress={uploadProgress}
                    onUpload={handleAudioUpload}
                    url={formData.mediaUrl}
                    onUrlChange={(val: string) => updateField("mediaUrl", val)}
                    isPlaying={previewPlaying}
                    onPlay={playAudio}
                  />
                ) : undefined
              }
            />
          ))}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onFinished} className="h-9 text-xs font-bold rounded-xl">HỦY</Button>
            <Button type="submit" disabled={create.isPending || update.isPending} className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md px-4">
              {create.isPending || update.isPending ? "ĐANG LƯU..." : vocabulary ? "CẬP NHẬT" : "TẠO TỪ VỰNG"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ExamplesList({ examples, setExamples }: any) {
  const updateRow = (id: string, f: string, v: string) => setExamples((prev: any) => prev.map((r: any) => r.id === id ? { ...r, [f]: v } : r));
  const removeRow = (id: string) => {
    if (examples.length === 1) return toast.warning("Phải giữ lại ít nhất một câu ví dụ.");
    setExamples((prev: any) => prev.filter((r: any) => r.id !== id));
  };
  return (
    <Card className="border border-border/50 bg-muted/5 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-border/40 font-bold text-muted-foreground uppercase text-[10px]">
        <span>Ví dụ thực tế *</span>
        <Badge variant="outline" className="text-[9px] border-rose-500/20 text-rose-600 bg-rose-500/5">{examples.length} câu</Badge>
      </div>
      <div className="space-y-4">
        {examples.map((row: any, idx: number) => (
          <div key={row.id} className="relative p-4 rounded-xl border border-border/40 bg-background/50 space-y-3">
            <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground">
              <span>Ví dụ #{idx + 1}</span>
              {examples.length > 1 && <Button type="button" variant="ghost" size="xs" onClick={() => removeRow(row.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input value={row.sentenceEn} onChange={e => updateRow(row.id, "sentenceEn", e.target.value)} placeholder="English sentence..." className="h-8 text-xs rounded-xl" />
              <Input value={row.sentenceVi} onChange={e => updateRow(row.id, "sentenceVi", e.target.value)} placeholder="Bản dịch tiếng Việt..." className="h-8 text-xs rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={() => setExamples((p: any) => [...p, { id: Math.random().toString(36).substr(2, 9), sentenceEn: "", sentenceVi: "" }])} className="h-8 text-[10px] font-bold w-full border-dashed rounded-xl"><Plus className="h-3 w-3 mr-1" /> Thêm câu ví dụ</Button>
    </Card>
  );
}

function AudioUploader({ progress, onUpload, url, onUrlChange, isPlaying, onPlay }: any) {
  return (
    <Card className="border border-border/50 bg-muted/5 rounded-2xl p-4 space-y-4">
      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pb-1.5 border-b border-border/40 flex items-center gap-1.5"><Music className="h-3.5 w-3.5 text-rose-500" /> Âm thanh phát âm</div>
      <div className="relative">
        <Input type="file" accept=".mp3,.wav,.m4a" onChange={onUpload} disabled={progress !== null} className="h-9 text-[10px] bg-background file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-indigo-500/10 file:text-indigo-600 cursor-pointer rounded-xl" />
        {progress !== null && <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /><span className="text-[9px] font-bold font-mono">{progress}%</span></div>}
      </div>
      {progress !== null && <Progress value={progress} className="h-1" />}
      <div className="space-y-2">
        <span className="text-[9px] font-bold text-muted-foreground block">Hoặc liên kết trực tiếp URL tệp âm thanh</span>
        <div className="flex gap-1.5">
          <Input value={url} onChange={e => onUrlChange(e.target.value)} placeholder="Dán đường dẫn phát âm mẫu (mp3)..." type="url" className="h-8.5 text-xs flex-1 rounded-xl" />
          {url && <Button type="button" variant="outline" size="icon" onClick={onPlay} className={`h-8.5 w-8.5 rounded-xl ${isPlaying ? "text-primary bg-primary/10 animate-pulse" : ""}`}><Volume2 className="h-3.5 w-3.5" /></Button>}
        </div>
      </div>
    </Card>
  );
}
