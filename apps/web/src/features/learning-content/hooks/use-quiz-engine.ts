import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useStudentLearning } from "./use-student-learning";

interface SelectedAnswerState {
  questionId: string;
  selectedOption: "A" | "B" | "C" | "D";
}

interface UseQuizEngineProps {
  courseId: string;
  quizId: string;
}

export function useQuizEngine({ courseId, quizId }: UseQuizEngineProps) {
  const { submitQuiz } = useStudentLearning(courseId);

  // Fetch the quiz by quizId
  const {
    data: quizData,
    isLoading: isQuizLoading,
    error: quizError,
  } = useQuery(trpc.user.getQuiz.queryOptions({ quizId }));

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswerState[]>([]);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // Reset states when quiz changes
  useEffect(() => {
    setSelectedAnswers([]);
    setQuizResult(null);
  }, [quizId]);

  const handleOptionChange = (questionId: string, option: "A" | "B" | "C" | "D") => {
    setSelectedAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, { questionId, selectedOption: option }];
    });
  };

  const getSelectedOptionForQuestion = (questionId: string): "A" | "B" | "C" | "D" | undefined => {
    return selectedAnswers.find((a) => a.questionId === questionId)?.selectedOption;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quizData) return;

    if (selectedAnswers.length < quizData.questions.length) {
      if (!confirm("Bạn chưa trả lời hết các câu hỏi. Bạn vẫn muốn nộp bài chứ?")) {
        return;
      }
    }

    try {
      const data = await submitQuiz.mutateAsync({
        quizId,
        answers: selectedAnswers,
      });
      setQuizResult(data);
    } catch (err) {
      // Errors handled inside the custom hook
    }
  };

  const handleRetake = () => {
    setSelectedAnswers([]);
    setQuizResult(null);
  };

  return {
    quizData,
    isQuizLoading,
    quizError,
    selectedAnswers,
    quizResult,
    handleOptionChange,
    getSelectedOptionForQuestion,
    handleSubmit,
    handleRetake,
    isSubmitting: submitQuiz.isPending,
  };
}
