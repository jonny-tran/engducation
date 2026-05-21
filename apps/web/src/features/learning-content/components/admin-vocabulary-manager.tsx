"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useVocabularyMutations } from "../hooks/use-vocabulary-mutations";
import { Button } from "@engducation/ui/components/button";
import { Input } from "@engducation/ui/components/input";
import { Card, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import { Skeleton } from "@engducation/ui/components/skeleton";
import { Label } from "@engducation/ui/components/label";
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
import { Search, Plus, X, Pencil, Trash2 } from "lucide-react";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
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

type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "preposition" | "conjunction" | "idiom" | "phrasal_verb";

interface VocabularyFormData {
  word: string;
  ipa: string;
  partOfSpeech: PartOfSpeech;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  audioUrl: string;
  level: Level;
  topic: string;
}

interface VocabularyItem {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  audioUrl: string | null;
  level: string;
  topic: string;
}

const PAGE_SIZE = 20;
const DEFAULT_FORM: VocabularyFormData = {
  word: "",
  ipa: "",
  partOfSpeech: "noun",
  meaningVi: "",
  exampleEn: "",
  exampleVi: "",
  audioUrl: "",
  level: "A1",
  topic: "",
};

export function AdminVocabularyManager() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<VocabularyItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VocabularyItem | null>(null);
  const [formData, setFormData] = useState<VocabularyFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof VocabularyFormData, string>>>({});

  const { create, update, remove } = useVocabularyMutations();

  const { data, isLoading } = useQuery(
    trpc.adminVocabulary.list.queryOptions({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      level: (selectedLevel || undefined) as Level | undefined,
      topic: selectedTopic || undefined,
    })
  );

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VocabularyFormData, string>> = {};
    if (!formData.word.trim()) newErrors.word = "Từ gốc không được để trống";
    if (!formData.ipa.trim()) newErrors.ipa = "Phiên âm không được để trống";
    if (!formData.meaningVi.trim()) newErrors.meaningVi = "Nghĩa tiếng Việt không được để trống";
    if (!formData.exampleEn.trim()) newErrors.exampleEn = "Câu ví dụ tiếng Anh không được để trống";
    if (!formData.exampleVi.trim()) newErrors.exampleVi = "Bản dịch câu ví dụ không được để trống";
    if (!formData.topic.trim()) newErrors.topic = "Chủ đề không được để trống";
    if (formData.audioUrl && !isValidUrl(formData.audioUrl)) {
      newErrors.audioUrl = "URL âm thanh không hợp lệ";
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
      word: formData.word.trim(),
      ipa: formData.ipa.trim(),
      partOfSpeech: formData.partOfSpeech,
      meaningVi: formData.meaningVi.trim(),
      exampleEn: formData.exampleEn.trim(),
      exampleVi: formData.exampleVi.trim(),
      audioUrl: formData.audioUrl.trim() || undefined,
      level: formData.level,
      topic: formData.topic.trim(),
    };

    if (editingItem) {
      await update.mutateAsync({ id: editingItem.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setErrors({});
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item: VocabularyItem) => {
    setEditingItem(item);
    setFormData({
      word: item.word,
      ipa: item.ipa,
      partOfSpeech: item.partOfSpeech as PartOfSpeech,
      meaningVi: item.meaningVi,
      exampleEn: item.exampleEn,
      exampleVi: item.exampleVi,
      audioUrl: item.audioUrl ?? "",
      level: item.level as Level,
      topic: item.topic,
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
    setSelectedLevel("");
    setSelectedTopic("");
    setPage(1);
  };

  const hasFilters = !!search || !!selectedLevel || !!selectedTopic;
  const topics = Array.from(new Set((data?.items ?? []).map((v) => v.topic))).sort();
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

            <select
              value={selectedLevel}
              onChange={(e) => { setSelectedLevel(e.target.value); setPage(1); }}
              className="flex h-8 border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm outline-none focus-visible:ring-1"
            >
              <option value="">Cấp độ</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>

            {topics.length > 0 && (
              <select
                value={selectedTopic}
                onChange={(e) => { setSelectedTopic(e.target.value); setPage(1); }}
                className="flex h-8 border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-sm outline-none focus-visible:ring-1"
              >
                <option value="">Chủ đề</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
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
          <Card className="border border-border bg-card shadow-sm lg:col-span-1">
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
                {/* Word */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Từ gốc *</Label>
                  <Input
                    value={formData.word}
                    onChange={(e) => updateField("word", e.target.value)}
                    placeholder="ví dụ: apple"
                    className="h-8 text-xs"
                  />
                  {errors.word && <p className="text-[10px] text-destructive">{errors.word}</p>}
                </div>

                {/* IPA */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Phiên âm *</Label>
                  <Input
                    value={formData.ipa}
                    onChange={(e) => updateField("ipa", e.target.value)}
                    placeholder="ví dụ: /ˈæp.əl/"
                    className="h-8 text-xs"
                  />
                  {errors.ipa && <p className="text-[10px] text-destructive">{errors.ipa}</p>}
                </div>

                {/* Level & Part of Speech */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Cấp độ</Label>
                    <select
                      value={formData.level}
                      onChange={(e) => updateField("level", e.target.value as Level)}
                      className="h-8 border border-input bg-background px-2 text-xs shadow-sm outline-none"
                    >
                      {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
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
                </div>

                {/* Topic */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Chủ đề *</Label>
                  <Input
                    value={formData.topic}
                    onChange={(e) => updateField("topic", e.target.value)}
                    placeholder="ví dụ: Food & Drink"
                    className="h-8 text-xs"
                  />
                  {errors.topic && <p className="text-[10px] text-destructive">{errors.topic}</p>}
                </div>

                {/* Meaning */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nghĩa tiếng Việt *</Label>
                  <Input
                    value={formData.meaningVi}
                    onChange={(e) => updateField("meaningVi", e.target.value)}
                    placeholder="ví dụ: Quả táo"
                    className="h-8 text-xs"
                  />
                  {errors.meaningVi && <p className="text-[10px] text-destructive">{errors.meaningVi}</p>}
                </div>

                {/* Example EN */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Câu ví dụ (EN) *</Label>
                  <Input
                    value={formData.exampleEn}
                    onChange={(e) => updateField("exampleEn", e.target.value)}
                    placeholder="ví dụ: I ate an apple today."
                    className="h-8 text-xs"
                  />
                  {errors.exampleEn && <p className="text-[10px] text-destructive">{errors.exampleEn}</p>}
                </div>

                {/* Example VI */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Bản dịch (VI) *</Label>
                  <Input
                    value={formData.exampleVi}
                    onChange={(e) => updateField("exampleVi", e.target.value)}
                    placeholder="ví dụ: Hôm nay tôi đã ăn một quả táo."
                    className="h-8 text-xs"
                  />
                  {errors.exampleVi && <p className="text-[10px] text-destructive">{errors.exampleVi}</p>}
                </div>

                {/* Audio URL */}
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">URL âm thanh</Label>
                  <Input
                    value={formData.audioUrl}
                    onChange={(e) => updateField("audioUrl", e.target.value)}
                    placeholder="https://..."
                    type="url"
                    className="h-8 text-xs"
                  />
                  {errors.audioUrl && <p className="text-[10px] text-destructive">{errors.audioUrl}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {editingItem && (
                    <Button type="button" variant="outline" onClick={resetForm} className="h-8 text-xs font-bold">
                      Hủy
                    </Button>
                  )}
                  <Button type="submit" disabled={isPending} className="h-8 text-xs font-bold">
                    {isPending ? "ĐANG LƯU..." : editingItem ? "CẬP NHẬT" : "THÊM MỚI"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Vocabulary List */}
        <div className={showForm ? "lg:col-span-2" : "col-span-1"}>
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
                    <div key={item.id} className="p-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">{item.word}</span>
                            <span className="text-xs text-muted-foreground font-mono">{item.ipa}</span>
                            <Badge variant="outline" className="text-[9px] font-bold uppercase">{item.level}</Badge>
                            <Badge variant="outline" className="text-[9px] text-muted-foreground">
                              {item.partOfSpeech}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{item.meaningVi}</div>
                          <div className="text-[10px] text-muted-foreground italic mt-0.5 font-mono line-clamp-1">
                            {item.exampleEn}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            <span className="font-medium">Chủ đề:</span> {item.topic}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(item)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
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
                  <span className="text-[10px] text-muted-foreground">
                    Trang {page} / {data.pagination.totalPages} — {data.pagination.total} từ vựng
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="h-7 text-[10px] font-bold"
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.pagination.totalPages}
                      className="h-7 text-[10px] font-bold"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa từ vựng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa từ vựng{' '}
              <strong>&ldquo;{deleteTarget?.word}&rdquo;</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={remove.isPending}>
              {remove.isPending ? "Đang xóa..." : "Xóa từ vựng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
