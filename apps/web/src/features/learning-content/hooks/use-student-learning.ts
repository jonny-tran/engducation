import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useStudentLearning(courseId?: string) {
  const queryClient = useQueryClient();

  const trackContentProgress = useMutation(
    trpc.user.trackContentProgress.mutationOptions({
      onSuccess: () => {
        // Invalidate both lists and detail
        queryClient.invalidateQueries({
          queryKey: trpc.user.courseList.queryKey(),
        });
        if (courseId) {
          queryClient.invalidateQueries({
            queryKey: trpc.user.courseGetDetail.queryKey({ courseId }),
          });
        }
      },
      onError: (err) => {
        toast.error(`Lỗi cập nhật tiến trình: ${err.message}`);
      },
    })
  );

  const getMediaUrl = useMutation(
    trpc.user.lessonGetMediaUrl.mutationOptions({
      onError: (err) => {
        toast.error(`Lỗi tải video bài học: ${err.message}`);
      },
    })
  );

  const submitQuiz = useMutation(
    trpc.user.submitQuiz.mutationOptions({
      onSuccess: (data) => {
        if (data.passed) {
          toast.success(`Chúc mừng! Bạn đã hoàn thành bài tập với điểm số ${data.score}/100!`);
        } else {
          toast.warning(`Điểm số của bạn là ${data.score}/100. Bạn cần đạt từ 70 điểm để hoàn thành.`);
        }
        queryClient.invalidateQueries({
          queryKey: trpc.user.courseList.queryKey(),
        });
        if (courseId) {
          queryClient.invalidateQueries({
            queryKey: trpc.user.courseGetDetail.queryKey({ courseId }),
          });
        }
      },
      onError: (err) => {
        toast.error(`Lỗi nộp bài tập: ${err.message}`);
      },
    })
  );

  const submitWriting = useMutation(
    trpc.user.submitWriting.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Nộp bài viết luận thành công! AI chấm điểm bài viết: ${data.score}/100`);
        queryClient.invalidateQueries({
          queryKey: trpc.user.courseList.queryKey(),
        });
        if (courseId) {
          queryClient.invalidateQueries({
            queryKey: trpc.user.courseGetDetail.queryKey({ courseId }),
          });
        }
      },
      onError: (err) => {
        toast.error(`Lỗi nộp bài viết luận: ${err.message}`);
      },
    })
  );

  return {
    trackContentProgress,
    getMediaUrl,
    submitQuiz,
    submitWriting,
  };
}
