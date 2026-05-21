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
        queryClient.invalidateQueries({
          queryKey: trpc.admin.dashboardStats.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(err.message);
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
        toast.error(err.message);
      },
    })
  );

  /**
   * deleteCourse handles PRECONDITION_FAILED (412) specifically.
   * When a course has lessons attached, the backend blocks the deletion
   * and returns a message that includes the lesson count.
   */
  const deleteCourse = useMutation(
    trpc.admin.courseDelete.mutationOptions({
      onSuccess: () => {
        toast.success("Xóa khóa học thành công");
        queryClient.invalidateQueries({
          queryKey: trpc.admin.courseList.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.admin.dashboardStats.queryKey(),
        });
      },
      onError: (err) => {
        const code = (err as { data?: { code?: string } }).data?.code;
        if (code === "PRECONDITION_FAILED") {
          toast.error(err.message);
        } else {
          toast.error(err.message);
        }
      },
    })
  );

  return {
    createCourse,
    updateCourse,
    deleteCourse,
  };
}
