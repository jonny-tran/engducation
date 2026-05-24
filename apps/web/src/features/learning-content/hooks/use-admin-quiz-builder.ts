import { useState, useEffect } from "react";
import { useQuizMutations } from "./use-quiz-mutations";

export interface FormAnswer {
  id: string;
  content: string;
  isCorrect: boolean;
}

export interface FormQuestion {
  id: string;
  content: string;
  explanation: string;
  answers: FormAnswer[];
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function createEmptyAnswer(): FormAnswer {
  return { id: generateId(), content: "", isCorrect: false };
}

export function createEmptyQuestion(): FormQuestion {
  return {
    id: generateId(),
    content: "",
    explanation: "",
    answers: [createEmptyAnswer(), createEmptyAnswer()],
  };
}

function validateQuestions(questions: FormQuestion[]): string | null {
  if (questions.length === 0) {
    return "Phải có ít nhất 1 câu hỏi";
  }
  for (const q of questions) {
    if (!q.content.trim()) {
      return "Nội dung câu hỏi không được để trống";
    }
    if (q.answers.length < 2) {
      return `Câu hỏi "${q.content.slice(0, 30)}..." cần ít nhất 2 đáp án`;
    }
    if (!q.answers.some((a) => a.isCorrect)) {
      return `Câu hỏi "${q.content.slice(0, 30)}..." chưa chọn đáp án đúng nào`;
    }
    for (const a of q.answers) {
      if (!a.content.trim()) {
        return "Nội dung đáp án không được để trống";
      }
    }
  }
  return null;
}

interface UseAdminQuizBuilderProps {
  courseId: string;
  moduleId: string;
  quiz?: any;
  onFinished: () => void;
}

export function useAdminQuizBuilder({ courseId, moduleId, quiz, onFinished }: UseAdminQuizBuilderProps) {
  const { upsertQuizStructure, deleteQuiz } = useQuizMutations(courseId);
  const [quizTitle, setQuizTitle] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (quiz) {
      setQuizTitle(quiz.title);
      setStatus(quiz.status as any);
      setQuestions(
        quiz.questions.map((q: any) => ({
          id: q.id,
          content: q.content,
          explanation: q.explanation ?? "",
          answers: q.answers.map((a: any) => ({
            id: a.id,
            content: a.content,
            isCorrect: a.isCorrect,
          })),
        }))
      );
    } else {
      setQuizTitle("");
      setStatus("draft");
      setQuestions([createEmptyQuestion()]);
    }
    setValidationError(null);
  }, [quiz, moduleId]);

  const updateQuestion = (index: number, updated: FormQuestion) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      setValidationError("Tiêu đề bài tập không được để trống");
      return;
    }
    const err = validateQuestions(questions);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);

    const payload = {
      quizId: quiz?.id,
      moduleId,
      title: quizTitle.trim(),
      status,
      questions: questions.map((q, i) => ({
        id: q.id,
        content: q.content.trim(),
        explanation: q.explanation.trim() || undefined,
        order: i + 1,
        answers: q.answers.map((a) => ({
          id: a.id,
          content: a.content.trim(),
          isCorrect: a.isCorrect,
        })),
      })),
    };

    try {
      await upsertQuizStructure.mutateAsync(payload);
      onFinished();
    } catch {
      // Handled by react-query error callbacks
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) return;
    await deleteQuiz.mutateAsync({ id: quiz.id });
    setShowDeleteConfirm(false);
    onFinished();
  };

  return {
    quizTitle,
    setQuizTitle,
    status,
    setStatus,
    questions,
    validationError,
    showDeleteConfirm,
    setShowDeleteConfirm,
    updateQuestion,
    addQuestion,
    removeQuestion,
    handleSubmit,
    handleDeleteQuiz,
    isSubmitting: upsertQuizStructure.isPending,
    isDeleting: deleteQuiz.isPending,
  };
}
