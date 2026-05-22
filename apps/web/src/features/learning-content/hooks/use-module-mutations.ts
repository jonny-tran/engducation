import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useModuleMutations(courseId?: string) {
  const queryClient = useQueryClient();

  const invalidateModuleQueries = () => {
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

  const createModule = useMutation(
    trpc.admin.moduleCreate.mutationOptions({
      onSuccess: () => {
        toast.success("Tạo module học thành công");
        invalidateModuleQueries();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const updateModule = useMutation(
    trpc.admin.moduleUpdate.mutationOptions({
      onSuccess: () => {
        toast.success("Cập nhật module học thành công");
        invalidateModuleQueries();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const deleteModule = useMutation(
    trpc.admin.moduleDelete.mutationOptions({
      onSuccess: () => {
        toast.success("Xóa module học thành công");
        invalidateModuleQueries();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  return {
    createModule,
    updateModule,
    deleteModule,
  };
}
