"use client";

interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  startChar: number;
  endChar: number;
}

interface GrammarDiffViewerProps {
  text: string;
  corrections: Correction[];
}

export function GrammarDiffViewer({ text, corrections }: GrammarDiffViewerProps) {
  if (!corrections || corrections.length === 0) {
    return <p className="text-xs leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  // Sort corrections by startChar to process from left to right
  const sorted = [...corrections].sort((a, b) => a.startChar - b.startChar);

  const elements = [];
  let lastIdx = 0;

  sorted.forEach((corr, idx) => {
    // Text before the typo
    if (corr.startChar > lastIdx) {
      elements.push(
        <span key={`text-${idx}`} className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">
          {text.slice(lastIdx, corr.startChar)}
        </span>
      );
    }
    // Strikethrough for typo, hoverable green for correction
    elements.push(
      <span
        key={`corr-${idx}`}
        className="inline-flex flex-wrap items-center gap-1 mx-1 px-1 rounded bg-muted border border-border"
      >
        <span className="line-through text-red-500 font-mono text-[10px] bg-red-500/10 px-1 rounded shrink-0">
          {corr.original}
        </span>
        <span className="text-[10px] font-bold text-emerald-500 shrink-0">→</span>
        <span
          className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-1 rounded cursor-help border-b border-dashed border-emerald-500 shrink-0"
          title={corr.explanation}
        >
          {corr.corrected}
        </span>
      </span>
    );
    lastIdx = corr.endChar;
  });

  if (lastIdx < text.length) {
    elements.push(
      <span key="text-end" className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">
        {text.slice(lastIdx)}
      </span>
    );
  }

  return (
    <div className="p-4 bg-card border rounded-lg leading-loose shadow-inner overflow-hidden max-h-[300px] overflow-y-auto">
      {elements}
    </div>
  );
}
