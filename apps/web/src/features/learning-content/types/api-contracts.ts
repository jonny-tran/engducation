// src/features/learning-content/types/api-contracts.ts

export interface CheckGrammarRequest {
  writingId: string;
  essay: string;
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
  startChar: number;
  endChar: number;
}

export interface VocabularyUpgrade {
  original: string;
  upgrade: string;
  level: "B2" | "C1" | "C2";
  explanation: string;
}

export interface CheckGrammarResponse {
  submissionId: string;
  score: number;
  feedback: {
    overallFeedback: string;
    corrections: GrammarCorrection[];
    vocabUpgrades: VocabularyUpgrade[];
    wordCount: number;
  };
}

export interface SubmissionHistoryItem {
  id: string;
  userId: string;
  writingId: string;
  essay: string;
  score: number;
  feedback: {
    overallFeedback: string;
    corrections: GrammarCorrection[];
    vocabUpgrades: VocabularyUpgrade[];
    wordCount: number;
  } | null;
  createdAt: string;
}

export interface WritingAssignmentDetail {
  id: string;
  moduleId: string;
  title: string;
  prompt: string;
  wordLimit: number | null;
  rubric: string;
  suggestedAnswer: string | null;
  status: "draft" | "published" | "archived";
}
