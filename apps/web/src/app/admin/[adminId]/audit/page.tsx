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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@engducation/ui/components/tabs";
import { toast } from "sonner";
import { ShieldCheck, Ban, CheckCircle, HelpCircle, History, ShieldAlert, Eye, Search } from "lucide-react";
import { SidebarTrigger } from "@engducation/ui/components/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@engducation/ui/components/breadcrumb";
import { Separator } from "@engducation/ui/components/separator";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default function AdminAuditPage({ params }: PageProps) {
  const { adminId } = use(params);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("audit");
  const [userSearch, setUserSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");

  // Queries
  const { data: auditLogs, isLoading: auditLoading } = useQuery(
    trpc.adminAdvanced.getAuditLogs.queryOptions(),
    { enabled: activeTab === "audit" }
  );

  const { data: usersList, isLoading: usersLoading } = useQuery(
    trpc.adminAdvanced.getUsers.queryOptions({
      search: userSearch || undefined,
    }),
    { enabled: activeTab === "users" }
  );

  // Mutations
  const banUserMutation = useMutation(
    trpc.adminAdvanced.banUser.mutationOptions({
      onSuccess: () => {
        toast.success("Đã khóa nhanh tài khoản & lập tức hủy bỏ các phiên làm việc thành công!");
        setBanDialogOpen(false);
        setSelectedUserId(null);
        setBanReason("");
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.getUsers.path });
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.getAuditLogs.path });
      },
      onError: (err) => {
        toast.error(err.message || "Khóa tài khoản thất bại");
      },
    })
  );

  const unbanUserMutation = useMutation(
    trpc.adminAdvanced.unbanUser.mutationOptions({
      onSuccess: () => {
        toast.success("Đã mở khóa tài khoản thành công!");
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.getUsers.path });
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.getAuditLogs.path });
      },
      onError: (err) => {
        toast.error(err.message || "Mở khóa tài khoản thất bại");
      },
    })
  );

  const handleOpenBanDialog = (userId: string) => {
    setSelectedUserId(userId);
    setBanReason("Spam liên tục lượt gọi AI / Nhập dữ liệu vi phạm chính sách của EdTech");
    setBanDialogOpen(true);
  };

  const handleConfirmBan = () => {
    if (!selectedUserId || !banReason.trim()) {
      toast.error("Vui lòng điền lý do khóa tài khoản");
      return;
    }
    banUserMutation.mutate({ userId: selectedUserId, reason: banReason });
  };

  const handleUnban = (userId: string) => {
    if (confirm("Bạn có chắc chắn muốn mở khóa cho tài khoản này không?")) {
      unbanUserMutation.mutate({ userId });
    }
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
                <BreadcrumbPage>Nhật Ký Kiểm Toán & Bảo Mật</BreadcrumbPage>
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  Nhật Ký Kiểm Toán & Điều Hòa Người Dùng
                </h1>
                <p className="text-rose-100/70 text-xs md:text-sm mt-0.5 font-light">
                  Phòng ngừa thất thoát tài chính, truy vết hành động nhạy cảm của các Admin khác và quản trị lệnh Banned User khẩn cấp.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-muted/60 dark:bg-muted/30 p-1 rounded-xl">
            <TabsTrigger value="audit" className="rounded-lg font-semibold">Nhật ký hoạt động</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg font-semibold">Quản lý Khóa User</TabsTrigger>
          </TabsList>

          {/* Audit Logs tab */}
          <TabsContent value="audit" className="mt-6 space-y-4">
            <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Lịch sử Audit Logs vĩnh viễn (Append-Only)</CardTitle>
                <CardDescription>
                  Ghi nhật ký toàn bộ các hành động nhạy cảm [CREATE, UPDATE, DELETE] của toàn bộ Admin hệ thống.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <div className="animate-spin h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full" />
                    <span className="text-sm text-muted-foreground">Đang tải nhật ký kiểm toán...</span>
                  </div>
                ) : !auditLogs || auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Chưa có nhật ký hoạt động nào được ghi nhận.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Admin thực hiện</TableHead>
                          <TableHead>Hành Động</TableHead>
                          <TableHead>Bảng Tác Động</TableHead>
                          <TableHead>Mã Đối Tượng</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Dấu Thời Gian</TableHead>
                          <TableHead className="text-right font-bold">Chi Tiết Payload</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground text-sm">{log.admin?.name}</span>
                                <span className="text-[10px] text-muted-foreground">{log.admin?.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-rose-100 text-rose-800 border-rose-200 border hover:bg-rose-100">
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{log.targetTable}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {log.targetId.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="text-xs font-mono">{log.ipAddress || "localhost"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger
                                  render={
                                    <Button size="sm" variant="outline" className="rounded-lg h-8 flex items-center gap-1 ml-auto" />
                                  }
                                >
                                  <Eye className="h-3.5 w-3.5" /> Xem Payload
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl bg-card rounded-2xl border">
                                  <DialogHeader>
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                      <ShieldAlert className="h-5 w-5 text-rose-600" /> Chi tiết thay đổi dữ liệu (Payload context)
                                    </DialogTitle>
                                    <DialogDescription>
                                      Đối chiếu Old Payload (Trạng thái cũ) và New Payload (Trạng thái mới).
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid grid-cols-2 gap-4 py-4 min-h-[300px]">
                                    <div className="space-y-2">
                                      <span className="font-bold text-xs uppercase text-amber-600 block">Dữ liệu cũ (Old Payload)</span>
                                      <pre className="bg-muted p-4 rounded-xl text-xs font-mono overflow-auto max-h-[350px] whitespace-pre-wrap border">
                                        {log.oldPayload ? JSON.stringify(JSON.parse(log.oldPayload), null, 2) : "NULL"}
                                      </pre>
                                    </div>
                                    <div className="space-y-2">
                                      <span className="font-bold text-xs uppercase text-emerald-600 block">Dữ liệu mới (New Payload)</span>
                                      <pre className="bg-muted p-4 rounded-xl text-xs font-mono overflow-auto max-h-[350px] whitespace-pre-wrap border">
                                        {log.newPayload ? JSON.stringify(JSON.parse(log.newPayload), null, 2) : "NULL"}
                                      </pre>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Moderation / Ban control tab */}
          <TabsContent value="users" className="mt-6 space-y-4">
            <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">Trung tâm Điều hòa Học viên</CardTitle>
                  <CardDescription>
                    Khóa tài khoản khẩn cấp (Ban User) đối với các hành vi spam API AI hoặc vi phạm thù ghét. Thu hồi toàn bộ session Better-Auth tức thời.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 max-w-[300px] w-full">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="rounded-xl h-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {usersLoading ? (
                  <div className="animate-spin h-6 w-6 border-2 border-rose-500 border-t-transparent rounded-full mx-auto" />
                ) : !usersList || usersList.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-xs">Không tìm thấy người dùng nào.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Người Dùng</TableHead>
                          <TableHead>Vai Trò (Role)</TableHead>
                          <TableHead>Trạng Thái</TableHead>
                          <TableHead>Lý Do Khóa (nếu có)</TableHead>
                          <TableHead>Ngày Đăng Ký</TableHead>
                          <TableHead className="text-right">Hành Động khẩn cấp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersList.map((u) => (
                          <TableRow key={u.id} className="hover:bg-muted/10">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground text-sm">{u.name}</span>
                                <span className="text-[10px] text-muted-foreground">{u.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={u.role === "admin" ? "text-rose-600 border-rose-300" : ""}>
                                {u.role.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {u.banned ? (
                                <Badge className="bg-rose-100 text-rose-800 border-rose-200 border hover:bg-rose-100 animate-pulse">
                                  BANNED (ĐÃ KHÓA)
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border hover:bg-emerald-100">
                                  ACTIVE
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground italic max-w-[200px] truncate">
                              {u.banReason ? `"${u.banReason}"` : "-"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-right">
                              {u.id === adminId ? (
                                <span className="text-xs text-muted-foreground italic">Tài khoản của bạn</span>
                              ) : u.banned ? (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 active:scale-95 ml-auto h-8"
                                  onClick={() => handleUnban(u.id)}
                                  disabled={unbanUserMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4" /> Mở Khóa (Unban)
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1 active:scale-95 ml-auto h-8"
                                  onClick={() => handleOpenBanDialog(u.id)}
                                  disabled={banUserMutation.isPending}
                                >
                                  <Ban className="h-4 w-4" /> Khóa (Ban User)
                                </Button>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="max-w-md bg-card rounded-2xl border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" /> Xác Nhận Khóa Tài Khoản
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ lập tức hủy bỏ toàn bộ phiên làm việc (Session/Token) của người dùng đó trên tất cả các thiết bị. Người dùng sẽ bị đẩy ra khỏi hệ thống ngay lập tức.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="ban-reason">Lý do khóa tài khoản *</Label>
            <Textarea
              id="ban-reason"
              placeholder="VD: Cố tình sử dụng công cụ spam API OpenAI..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)} className="rounded-xl">
              Hủy
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              onClick={handleConfirmBan}
              disabled={banUserMutation.isPending}
            >
              {banUserMutation.isPending ? "Đang xử lý..." : "Khóa ngay lập tức"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
