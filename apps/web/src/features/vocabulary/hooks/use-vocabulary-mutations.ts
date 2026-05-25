import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useVocabularyMutations() {
  const queryClient = useQueryClient();

  const invalidateVocabulary = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.adminVocabulary.list.queryKey(),
    });
  };

  const create = useMutation(
    trpc.adminVocabulary.create.mutationOptions({
      onSuccess: () => {
        toast.success("Tạo từ vựng thành công");
        invalidateVocabulary();
      },
      onError: (err) => {
        const code = (err as { data?: { code?: string } }).data?.code;
        if (code === "CONFLICT") {
          toast.error("Từ vựng này với từ loại tương ứng đã tồn tại trong hệ thống.");
        } else {
          toast.error(err.message);
        }
      },
    })
  );

  const update = useMutation(
    trpc.adminVocabulary.update.mutationOptions({
      onSuccess: () => {
        toast.success("Cập nhật từ vựng thành công");
        invalidateVocabulary();
      },
      onError: (err) => {
        const code = (err as { data?: { code?: string } }).data?.code;
        if (code === "CONFLICT") {
          toast.error("Từ vựng này với từ loại tương ứng đã tồn tại trong hệ thống.");
        } else {
          toast.error(err.message);
        }
      },
    })
  );

  const remove = useMutation(
    trpc.adminVocabulary.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Xóa từ vựng thành công");
        invalidateVocabulary();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const importFromExcel = useMutation(
    trpc.adminVocabulary.importFromExcel.mutationOptions({
      onSuccess: (res) => {
        toast.success(res.message);
        invalidateVocabulary();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  return { create, update, remove, importFromExcel };
}

