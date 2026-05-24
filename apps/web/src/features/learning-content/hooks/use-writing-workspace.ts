import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiWritingApi } from "../services/ai-api";
import { toast } from "sonner";

interface UseWritingWorkspaceProps {
  writingId: string;
  courseId: string;
  onComplete?: () => void;
}

export function useWritingWorkspace({ writingId, courseId: _courseId, onComplete }: UseWritingWorkspaceProps) {
  const queryClient = useQueryClient();
  const [essay, setEssay] = useState("");
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null);

  // Fetch writing assignment details via Axios
  const { data: assignment, isLoading: isAssignmentLoading } = useQuery({
    queryKey: ["writing-assignment", writingId],
    queryFn: () => aiWritingApi.getDetail(writingId),
    enabled: !!writingId,
  });

  // Fetch student submission history via Axios
  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ["writing-history", writingId],
    queryFn: () => aiWritingApi.getHistory(writingId),
    enabled: !!writingId,
  });

  useEffect(() => {
    setEssay("");
    setActiveSubmission(null);
  }, [writingId]);

  // Calculate live word count
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;
  const wordLimit = assignment?.wordLimit ?? 250;
  const isOverLimit = wordLimit > 0 && wordCount > wordLimit * 1.5;

  // Mutation to submit the essay using Axios
  const submitWritingMutation = useMutation({
    mutationFn: aiWritingApi.submitWriting,
    onSuccess: (data) => {
      toast.success(`Nộp bài viết luận thành công! AI chấm điểm bài viết: ${data.score}/100`);
      setActiveSubmission(data);
      refetchHistory();
      
      // Invalidate related learning queries to sync sidebar/syllabus progress
      queryClient.invalidateQueries({ queryKey: ["student-learning-progress"] });
      
      if (onComplete) {
        onComplete();
      }
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || "Lỗi nộp bài viết luận";
      toast.error(errMsg);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essay.trim()) return;

    submitWritingMutation.mutate({
      writingId,
      essay: essay.trim(),
    });
  };

  return {
    essay,
    setEssay,
    activeSubmission,
    setActiveSubmission,
    assignment,
    isAssignmentLoading,
    historyData,
    wordCount,
    wordLimit,
    isOverLimit,
    handleSubmit,
    isSubmitting: submitWritingMutation.isPending,
  };
}
