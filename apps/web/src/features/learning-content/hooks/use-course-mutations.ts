import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCourseMutations() {
  const queryClient = useQueryClient();

  const createCourse = useMutation(
    trpc.admin.courseCreate.mutationOptions({
      onSuccess: () => {
        toast.success("Tạo khóa học thành công");
        queryClient.invalidateQueries({
          queryKey: trpc.admin.courseList.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(`Lỗi tạo khóa học: ${err.message}`);
      },
    })
  );

  const updateCourse = useMutation(
    trpc.admin.courseUpdate.mutationOptions({
      onSuccess: () => {
        toast.success("Cập nhật khóa học thành công");
        queryClient.invalidateQueries({
          queryKey: trpc.admin.courseList.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(`Lỗi cập nhật khóa học: ${err.message}`);
      },
    })
  );

  const deleteCourse = useMutation(
    trpc.admin.courseDelete.mutationOptions({
      onSuccess: () => {
        toast.success("Xóa khóa học thành công");
        queryClient.invalidateQueries({
          queryKey: trpc.admin.courseList.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(`Lỗi xóa khóa học: ${err.message}`);
      },
    })
  );

  return {
    createCourse,
    updateCourse,
    deleteCourse,
  };
}
