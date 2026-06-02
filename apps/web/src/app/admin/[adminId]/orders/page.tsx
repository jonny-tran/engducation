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
import { Textarea } from "@engducation/ui/components/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@engducation/ui/components/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@engducation/ui/components/select";
import { toast } from "sonner";
import { Check, X, ShieldAlert, Plus, CreditCard, Banknote, History, Search } from "lucide-react";
import { SidebarTrigger } from "@engducation/ui/components/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@engducation/ui/components/breadcrumb";
import { Separator } from "@engducation/ui/components/separator";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default function AdminOrdersPage({ params }: PageProps) {
  const { adminId } = use(params);
  const queryClient = useQueryClient();

  const [searchStatus, setSearchStatus] = useState<string | null>("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Queries
  const { data: ordersData, isLoading: ordersLoading } = useQuery(
    trpc.adminAdvanced.getOrders.queryOptions({
      status: searchStatus && searchStatus !== "all" ? searchStatus : undefined,
    })
  );

  const approveOrderMutation = useMutation(
    trpc.adminAdvanced.approveOrderManually.mutationOptions({
      onSuccess: () => {
        toast.success("Đã phê duyệt đơn hàng & kích hoạt quyền truy cập khóa học thành công");
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.getOrders.queryOptions().queryKey });
      },
      onError: (err) => {
        toast.error(err.message || "Phê duyệt đơn hàng thất bại");
      },
    })
  );

  const rejectOrderMutation = useMutation(
    trpc.adminAdvanced.rejectOrderManually.mutationOptions({
      onSuccess: () => {
        toast.success("Đã từ chối đơn hàng thành công");
        setRejectDialogOpen(false);
        setSelectedOrderId(null);
        setRejectReason("");
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.getOrders.queryOptions().queryKey });
      },
      onError: (err) => {
        toast.error(err.message || "Từ chối đơn hàng thất bại");
      },
    })
  );

  const handleApprove = (orderId: string) => {
    approveOrderMutation.mutate({ orderId });
  };

  const handleOpenRejectDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (!selectedOrderId || !rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    rejectOrderMutation.mutate({ orderId: selectedOrderId, reason: rejectReason });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

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
                <BreadcrumbPage>Đơn hàng & Giao dịch</BreadcrumbPage>
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
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 p-6 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <Banknote className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  Quản lý Giao dịch & Kích hoạt Khóa học Thủ công
                </h1>
                <p className="text-emerald-100 text-xs md:text-sm mt-0.5 font-light">
                  Phê duyệt biên lai thanh toán ngân hàng (Manual Bank Transfer) và cấp quyền học tập tức thời cho học viên.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Danh Sách Lịch Sử Đơn Hàng</CardTitle>
              <CardDescription>
                Nhật ký vĩnh viễn ghi nhận toàn bộ đơn hàng (bất biến, không hỗ trợ xóa).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả đơn hàng</SelectItem>
                  <SelectItem value="pending">Chờ phê duyệt</SelectItem>
                  <SelectItem value="success">Thành công</SelectItem>
                  <SelectItem value="failed">Thất bại / Bị Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {ordersLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                <span className="text-sm text-muted-foreground">Đang tải danh sách đơn hàng...</span>
              </div>
            ) : !ordersData?.items || ordersData.items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                Không tìm thấy đơn hàng nào khớp với bộ lọc.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã Đơn</TableHead>
                      <TableHead>Học Viên</TableHead>
                      <TableHead>Khóa Học</TableHead>
                      <TableHead>Số Tiền</TableHead>
                      <TableHead>Hình Thức</TableHead>
                      <TableHead>Trạng Thái</TableHead>
                      <TableHead>Người Phê Duyệt</TableHead>
                      <TableHead>Ngày Tạo</TableHead>
                      <TableHead className="text-right">Hành Động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersData.items.map((o) => (
                      <TableRow key={o.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {o.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground text-sm">{o.user?.name}</span>
                            <span className="text-[10px] text-muted-foreground">{o.user?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm text-foreground max-w-[200px] truncate">
                          {o.course?.title}
                        </TableCell>
                        <TableCell className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(o.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-100 dark:bg-slate-900 border-slate-200">
                            {o.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {o.status === "success" && (
                            <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 border">
                              Thành Công
                            </Badge>
                          )}
                          {o.status === "pending" && (
                            <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 border-amber-200 border animate-pulse">
                              Chờ Phê Duyệt
                            </Badge>
                          )}
                          {o.status === "failed" && (
                            <Badge className="bg-rose-100 hover:bg-rose-100 text-rose-800 border-rose-200 border">
                              Đã Từ Chối
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {o.approvedBy ? (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              {o.approvedBy.name}
                            </span>
                          ) : (
                            <span className="italic">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right">
                          {o.status === "pending" ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg p-1.5 h-8 flex items-center justify-center gap-1 active:scale-95"
                                onClick={() => handleApprove(o.id)}
                                disabled={approveOrderMutation.isPending}
                              >
                                <Check className="h-4 w-4" /> Duyệt
                              </Button>
                              <Button
                                size="sm"
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg p-1.5 h-8 flex items-center justify-center gap-1 active:scale-95"
                                onClick={() => handleOpenRejectDialog(o.id)}
                                disabled={rejectOrderMutation.isPending}
                              >
                                <X className="h-4 w-4" /> Từ Chối
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Đã chốt sổ</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md bg-card rounded-2xl border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Từ Chối Đơn Hàng</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối đơn hàng để học viên nắm được thông tin đối soát.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="reject-reason">Lý Do Từ Chối *</Label>
            <Textarea
              id="reject-reason"
              placeholder="Chưa nhận được số tiền, sai thông tin khóa học..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="rounded-xl">
              Hủy
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              onClick={handleReject}
              disabled={rejectOrderMutation.isPending}
            >
              {rejectOrderMutation.isPending ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
