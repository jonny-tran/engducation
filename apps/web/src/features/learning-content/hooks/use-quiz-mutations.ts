import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useQuizMutations(courseId?: string) {
  const queryClient = useQueryClient();

  const upsertQuizStructure = useMutation(
    trpc.admin.quizUpsertStructure.mutationOptions({
      onSuccess: () => {
        toast.success("Cập nhật cấu trúc bài tập thành công");
        if (courseId) {
          queryClient.invalidateQueries({
            queryKey: trpc.admin.courseGetDetail.queryKey({ courseId }),
          });
        }
      },
      onError: (err) => {
        toast.error(`Lỗi cập nhật bài tập: ${err.message}`);
      },
    })
  );

  const createQuizQuestion = useMutation(
    trpc.admin.createQuizQuestion.mutationOptions({
      onSuccess: () => {
        toast.success("Thêm câu hỏi thành công");
        if (courseId) {
          queryClient.invalidateQueries({
            queryKey: trpc.admin.courseGetDetail.queryKey({ courseId }),
          });
        }
      },
      onError: (err) => {
        toast.error(`Lỗi thêm câu hỏi: ${err.message}`);
      },
    })
  );

  const deleteQuiz = useMutation(
    trpc.admin.quizDelete.mutationOptions({
      onSuccess: () => {
        toast.success("Xóa bài tập thành công");
        if (courseId) {
          queryClient.invalidateQueries({
            queryKey: trpc.admin.courseGetDetail.queryKey({ courseId }),
          });
        }
      },
      onError: (err) => {
        toast.error(`Lỗi xóa bài tập: ${err.message}`);
      },
    })
  );

  return {
    upsertQuizStructure,
    createQuizQuestion,
    deleteQuiz,
  };
}
