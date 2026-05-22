import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useWritingMutations(courseId?: string) {
  const queryClient = useQueryClient();

  const invalidateWritingQueries = () => {
    if (courseId) {
      queryClient.invalidateQueries({
        queryKey: trpc.admin.courseGetDetail.queryKey({ courseId }),
      });
    }
    queryClient.invalidateQueries({
      queryKey: trpc.admin.dashboardStats.queryKey(),
    });
  };

  const createWriting = useMutation(
    trpc.admin.writingCreate.mutationOptions({
      onSuccess: () => {
        toast.success("Tạo bài tập viết luận thành công");
        invalidateWritingQueries();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const updateWriting = useMutation(
    trpc.admin.writingUpdate.mutationOptions({
      onSuccess: () => {
        toast.success("Cập nhật bài viết luận thành công");
        invalidateWritingQueries();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const deleteWriting = useMutation(
    trpc.admin.writingDelete.mutationOptions({
      onSuccess: () => {
        toast.success("Xóa bài tập viết luận thành công");
        invalidateWritingQueries();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  return {
    createWriting,
    updateWriting,
    deleteWriting,
  };
}
