"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";
import { Button } from "@engducation/ui/components/button";
import { Volume2, VolumeX, Bookmark } from "lucide-react";
import { toast } from "sonner";

export interface VocabularyCardProps {
  vocabulary: {
    id: string;
    word: string;
    phonetics: string;
    partOfSpeech: string;
    definition: string;
    translation: string;
    example: string;
    exampleTranslation: string;
    mediaUrl: string | null;
    isSaved?: boolean;
    isMastered?: boolean;
  };
  onToggleBookmark: (id: string) => Promise<void> | void;
}

export function VocabularyCard({ vocabulary, onToggleBookmark }: VocabularyCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = () => {
    if (!vocabulary.mediaUrl) return;
    setIsPlaying(true);
    const audio = new Audio(vocabulary.mediaUrl);
    audio.play()
      .then(() => {
        audio.onended = () => setIsPlaying(false);
      })
      .catch((err) => {
        toast.error("Không thể phát âm thanh: " + err.message);
        setIsPlaying(false);
      });
  };

  const getPartOfSpeechBadgeStyle = (part: string) => {
    switch (part) {
      case "noun": return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "verb": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "adjective": return "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "adverb": return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
      default: return "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <Card className="border border-border/80 bg-card rounded-2xl hover:shadow-lg hover:border-indigo-500/20 dark:hover:border-indigo-500/10 transition-all duration-300 overflow-hidden group shadow-sm flex flex-col justify-between h-full">
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">
              {vocabulary.word}
            </span>
            <span className="text-xs text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 rounded">
              /{vocabulary.phonetics}/
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Audio Button */}
            {vocabulary.mediaUrl ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayAudio}
                className={`h-8 w-8 rounded-xl ${isPlaying ? "bg-primary/10 text-primary animate-pulse" : "text-muted-foreground hover:text-foreground hover:bg-muted/80"}`}
                title="Phát âm"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                disabled
                className="h-8 w-8 rounded-xl text-muted-foreground/30 bg-muted/5 cursor-not-allowed"
                title="Không có âm thanh mẫu"
              >
                <VolumeX className="h-4 w-4" />
              </Button>
            )}

            {/* Bookmark Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleBookmark(vocabulary.id)}
              className={`h-8 w-8 rounded-xl transition-all duration-200 ${vocabulary.isSaved ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/5"}`}
              title={vocabulary.isSaved ? "Hủy lưu từ" : "Lưu vào sổ tay"}
            >
              <Bookmark className={`h-4 w-4 ${vocabulary.isSaved ? "fill-amber-500" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          <Badge className={`font-mono font-black border text-[9px] px-2 py-0.5 rounded-full uppercase ${getPartOfSpeechBadgeStyle(vocabulary.partOfSpeech)}`}>
            {vocabulary.partOfSpeech}
          </Badge>
          {vocabulary.isMastered && (
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-[9px] font-bold rounded-full px-2 py-0.5">
              ✓ Đã thuộc
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 flex flex-col justify-between flex-1 gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground leading-relaxed">
            {vocabulary.translation}
          </p>
          {vocabulary.definition && (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {vocabulary.definition}
            </p>
          )}
        </div>

        {/* Examples Section */}
        <div className="pt-2 border-t border-border/40 bg-muted/5 rounded-xl p-2.5 space-y-1 text-[11px]">
          <p className="text-foreground font-medium italic leading-relaxed">
            &ldquo;{vocabulary.example}&rdquo;
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {vocabulary.exampleTranslation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
