"use client";

import React, { use, useState } from "react";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@engducation/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@engducation/ui/components/table";
import { Button } from "@engducation/ui/components/button";
import { Badge } from "@engducation/ui/components/badge";
import { Input } from "@engducation/ui/components/input";
import { Label } from "@engducation/ui/components/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@engducation/ui/components/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@engducation/ui/components/select";
import { toast } from "sonner";
import { Plus, Search, Trash2, Edit, Calendar, Percent, Ticket, Tag, RefreshCw, BarChart2 } from "lucide-react";
import { SidebarTrigger } from "@engducation/ui/components/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@engducation/ui/components/breadcrumb";
import { Separator } from "@engducation/ui/components/separator";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default function AdminVouchersPage({ params }: PageProps) {
  const { adminId } = use(params);
  const queryClient = useQueryClient();

  const [searchVal, setSearchVal] = useState("");
  const [upsertDialogOpen, setUpsertDialogOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);

  // Upsert Form State
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [maxUses, setMaxUses] = useState<number>(100);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [expiresAt, setExpiresAt] = useState<string>("");

  // Queries
  const { data: vouchers, isLoading: isVouchersLoading } = useQuery(
    trpc.adminAdvanced.voucherList.queryOptions()
  );

  // Mutations
  const upsertMutation = useMutation(
    trpc.adminAdvanced.voucherUpsert.mutationOptions({
      onSuccess: () => {
        toast.success(editingVoucherId ? "Cập nhật voucher thành công" : "Tạo voucher mới thành công");
        setUpsertDialogOpen(false);
        resetForm();
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.voucherList.path });
      },
      onError: (err) => {
        toast.error(err.message || "Thao tác thất bại");
      },
    })
  );

  const deleteMutation = useMutation(
    trpc.adminAdvanced.voucherDelete.mutationOptions({
      onSuccess: () => {
        toast.success("Xóa voucher thành công");
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.voucherList.path });
      },
      onError: (err) => {
        toast.error(err.message || "Xóa voucher thất bại");
      },
    })
  );

  // Helpers
  const resetForm = () => {
    setEditingVoucherId(null);
    setCode("");
    setDiscountPercent(10);
    setMaxUses(100);
    setStatus("active");
    setExpiresAt("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setUpsertDialogOpen(true);
  };

  const handleOpenEdit = (v: any) => {
    setEditingVoucherId(v.id);
    setCode(v.code);
    setDiscountPercent(v.discountPercent);
    setMaxUses(v.maxUses);
    setStatus(v.status as "active" | "inactive");
    
    if (v.expiresAt) {
      const date = new Date(v.expiresAt);
      // Format to yyyy-MM-ddThh:mm for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      setExpiresAt(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setExpiresAt("");
    }
    setUpsertDialogOpen(true);
  };

  const handleUpsert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }
    if (discountPercent < 1 || discountPercent > 100) {
      toast.error("Phần trăm giảm giá phải từ 1% đến 100%");
      return;
    }

    upsertMutation.mutate({
      id: editingVoucherId || undefined,
      code: code.toUpperCase().trim(),
      discountPercent,
      maxUses,
      status,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
  };

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa mã giảm giá ${code}?`)) {
      deleteMutation.mutate({ id });
    }
  };

  // Filter vouchers based on search code
  const filteredVouchers = vouchers?.filter((v) =>
    v.code.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {/* Top Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/60 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Mã giảm giá (Vouchers)</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Banner with Premium Orange/Rose Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 p-6 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <Ticket className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  Thiết lập Mã Giảm Giá & Chiến dịch Khuyến mãi
                </h1>
                <p className="text-orange-100 text-xs md:text-sm mt-0.5 font-light">
                  Tạo các mã voucher giảm giá theo phần trăm, khống chế số lượt sử dụng tối đa và đặt thời hạn kết thúc linh hoạt.
                </p>
              </div>
            </div>

            <Button
              onClick={handleOpenCreate}
              className="bg-white text-orange-700 hover:bg-orange-50 rounded-xl font-bold shadow-lg border-none flex items-center gap-2 shrink-0 transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" /> Tạo Voucher Mới
            </Button>
          </div>
        </div>

        {/* Voucher List Card */}
        <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Danh Sách Voucher Hiện Có</CardTitle>
              <CardDescription>
                Quản lý các chiến dịch giảm giá, xem số lượt đã sử dụng theo thời gian thực.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 max-w-xs w-full">
              <Search className="h-4 w-4 text-muted-foreground absolute ml-3" />
              <Input
                placeholder="Tìm mã giảm giá..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="pl-9 rounded-xl w-full"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isVouchersLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
                <span className="text-sm text-muted-foreground">Đang tải danh sách mã giảm giá...</span>
              </div>
            ) : !filteredVouchers || filteredVouchers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                Chưa có mã giảm giá nào được tạo hoặc không tìm thấy kết quả phù hợp.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã Giảm Giá</TableHead>
                      <TableHead>Mức Giảm giá</TableHead>
                      <TableHead>Lượt đã dùng / Tối đa</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hạn sử dụng</TableHead>
                      <TableHead className="text-right">Hành Động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVouchers.map((v) => {
                      const usagePercent = Math.min(100, Math.round((v.usesCount / v.maxUses) * 100));
                      const isExpired = v.expiresAt ? new Date(v.expiresAt) < new Date() : false;

                      return (
                        <TableRow key={v.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-950/30 text-orange-600 flex items-center justify-center">
                                <Ticket className="h-5 w-5" />
                              </div>
                              <span className="font-mono font-bold text-foreground text-sm tracking-wider bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded border border-orange-200/50">
                                {v.code}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-lg text-foreground">{v.discountPercent}</span>
                              <Percent className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground ml-1">giảm giá</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                <span>{v.usesCount} lượt dùng</span>
                                <span>tối đa {v.maxUses}</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    usagePercent >= 90
                                      ? "bg-rose-500"
                                      : usagePercent >= 50
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isExpired ? (
                              <Badge className="bg-rose-100 hover:bg-rose-100 text-rose-800 border-rose-200 border">
                                Đã Hết Hạn
                              </Badge>
                            ) : v.status === "active" ? (
                              <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 border">
                                Đang hoạt động
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-800 border-slate-200 border">
                                Ngừng hoạt động
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {v.expiresAt ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(v.expiresAt).toLocaleString("vi-VN")}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Vô thời hạn</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 rounded-lg p-1.5 h-8 flex items-center justify-center gap-1 active:scale-95"
                                onClick={() => handleOpenEdit(v)}
                              >
                                <Edit className="h-4 w-4" /> Sửa
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 rounded-lg p-1.5 h-8 flex items-center justify-center gap-1 active:scale-95"
                                onClick={() => handleDelete(v.id, v.code)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" /> Xóa
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Voucher Dialog */}
      <Dialog open={upsertDialogOpen} onOpenChange={setUpsertDialogOpen}>
        <DialogContent className="max-w-md bg-card rounded-2xl border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {editingVoucherId ? "Cấu hình Mã Giảm Giá" : "Tạo Mã Giảm Giá Mới"}
            </DialogTitle>
            <DialogDescription>
              Thiết lập mã giảm giá theo chiến dịch khuyến mãi của hệ thống đào tạo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpsert} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="voucher-code">Mã giảm giá *</Label>
              <Input
                id="voucher-code"
                placeholder="Ví dụ: ENG50, HELLO2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                disabled={!!editingVoucherId}
                className="font-mono text-sm tracking-wider uppercase font-bold"
              />
              {!editingVoucherId && (
                <p className="text-[10px] text-muted-foreground">Mã giảm giá sẽ tự động viết hoa và là duy nhất.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-percent">Phần trăm giảm giá (%) *</Label>
              <div className="relative flex items-center">
                <Percent className="h-4 w-4 absolute ml-3 text-muted-foreground" />
                <Input
                  id="discount-percent"
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  required
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-uses">Số lượt sử dụng tối đa *</Label>
              <Input
                id="max-uses"
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voucher-status">Trạng thái hoạt động *</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as "active" | "inactive")}
              >
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="active">Cho phép áp dụng (Active)</SelectItem>
                  <SelectItem value="inactive">Tạm ngưng áp dụng (Inactive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires-at">Ngày hết hạn (Có thể bỏ trống)</Label>
              <Input
                id="expires-at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Nếu bỏ trống, voucher sẽ được áp dụng vô thời hạn.</p>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setUpsertDialogOpen(false)} className="rounded-xl">
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
                {upsertMutation.isPending ? "Đang lưu..." : "Xác nhận lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
