import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useLessonMutations(courseId?: string) {
  const queryClient = useQueryClient();

  const invalidateLessonQueries = () => {
    if (courseId) {
      queryClient.invalidateQueries({
        queryKey: trpc.admin.courseGetDetail.queryKey({ courseId }),
      });
    }
    queryClient.invalidateQueries({
      queryKey: trpc.admin.courseList.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.admin.dashboardStats.queryKey(),
    });
  };

  const createLesson = useMutation(
    trpc.admin.lessonCreate.mutationOptions({
      onSuccess: () => {
        toast.success("Tạo bài học thành công");
        invalidateLessonQueries();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const updateLesson = useMutation(
    trpc.admin.lessonUpdate.mutationOptions({
      onSuccess: () => {
        toast.success("Cập nhật bài học thành công");
        invalidateLessonQueries();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const deleteLesson = useMutation(
    trpc.admin.lessonDelete.mutationOptions({
      onSuccess: () => {
        toast.success("Xóa bài học thành công");
        invalidateLessonQueries();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const reorderLessons = useMutation(
    trpc.admin.lessonReorder.mutationOptions({
      onSuccess: () => {
        toast.success("Sắp xếp bài học thành công");
        if (courseId) {
          queryClient.invalidateQueries({
            queryKey: trpc.admin.courseGetDetail.queryKey({ courseId }),
          });
        }
      },
      onError: (err) => {
        const code = (err as { data?: { code?: string } }).data?.code;
        if (code === "BAD_REQUEST") {
          toast.error(err.message);
        } else {
          toast.error(`Lỗi sắp xếp bài học: ${err.message}`);
        }
      },
    })
  );

  return {
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
  };
}
