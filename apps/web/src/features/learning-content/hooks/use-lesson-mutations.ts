import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useLessonMutations(courseId?: string) {
  const queryClient = useQueryClient();

  const createLesson = useMutation(
    trpc.admin.lessonCreate.mutationOptions({
      onSuccess: () => {
        toast.success("Tạo bài học thành công");
        if (courseId) {
          queryClient.invalidateQueries({
            queryKey: trpc.admin.courseGetDetail.queryKey({ courseId }),
          });
        }
        queryClient.invalidateQueries({
          queryKey: trpc.admin.courseList.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(`Lỗi tạo bài học: ${err.message}`);
      },
    })
  );

  const updateLesson = useMutation(
    trpc.admin.lessonUpdate.mutationOptions({
      onSuccess: () => {
        toast.success("Cập nhật bài học thành công");
        if (courseId) {
          queryClient.invalidateQueries({
            queryKey: trpc.admin.courseGetDetail.queryKey({ courseId }),
          });
        }
        queryClient.invalidateQueries({
          queryKey: trpc.admin.courseList.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(`Lỗi cập nhật bài học: ${err.message}`);
      },
    })
  );

  const deleteLesson = useMutation(
    trpc.admin.lessonDelete.mutationOptions({
      onSuccess: () => {
        toast.success("Xóa bài học thành công");
        if (courseId) {
          queryClient.invalidateQueries({
            queryKey: trpc.admin.courseGetDetail.queryKey({ courseId }),
          });
        }
        queryClient.invalidateQueries({
          queryKey: trpc.admin.courseList.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(`Lỗi xóa bài học: ${err.message}`);
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
        toast.error(`Lỗi sắp xếp bài học: ${err.message}`);
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
