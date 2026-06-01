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
import { UserCheck, ShieldAlert, Plus, Search, Ban, ShieldCheck, Key, RefreshCw, Mail, UserPlus, Users } from "lucide-react";
import { SidebarTrigger } from "@engducation/ui/components/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@engducation/ui/components/breadcrumb";
import { Separator } from "@engducation/ui/components/separator";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default function AdminUsersPage({ params }: PageProps) {
  const { adminId } = use(params);
  const queryClient = useQueryClient();

  const [searchVal, setSearchVal] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [banUserOpen, setBanUserOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");

  // Create User Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");

  // Queries
  const { data: users, isLoading: isUsersLoading } = useQuery(
    trpc.adminAdvanced.getUsers.queryOptions({
      search: searchVal ? searchVal : undefined,
    })
  );

  // Mutations
  const createUserMutation = useMutation(
    trpc.adminAdvanced.createUserByAdmin.mutationOptions({
      onSuccess: () => {
        toast.success("Tạo tài khoản thành công!");
        setCreateUserOpen(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("user");
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.getUsers.path });
      },
      onError: (err) => {
        toast.error(err.message || "Tạo tài khoản thất bại");
      },
    })
  );

  const banUserMutation = useMutation(
    trpc.adminAdvanced.banUser.mutationOptions({
      onSuccess: () => {
        toast.success("Đã khóa tài khoản người dùng thành công");
        setBanUserOpen(false);
        setSelectedUserId(null);
        setBanReason("");
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.getUsers.path });
      },
      onError: (err) => {
        toast.error(err.message || "Khóa tài khoản thất bại");
      },
    })
  );

  const unbanUserMutation = useMutation(
    trpc.adminAdvanced.unbanUser.mutationOptions({
      onSuccess: () => {
        toast.success("Đã mở khóa tài khoản người dùng thành công");
        queryClient.invalidateQueries({ queryKey: trpc.adminAdvanced.getUsers.path });
      },
      onError: (err) => {
        toast.error(err.message || "Mở khóa tài khoản thất bại");
      },
    })
  );

  // Helpers
  const handleGeneratePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let generated = "";
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserPassword(generated);
    toast.info("Đã tạo ngẫu nhiên một mật khẩu bảo mật cực cao");
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }
    createUserMutation.mutate({
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
    });
  };

  const handleOpenBanDialog = (userId: string) => {
    if (userId === adminId) {
      toast.error("Bạn không thể tự khóa tài khoản của chính mình!");
      return;
    }
    setSelectedUserId(userId);
    setBanUserOpen(true);
  };

  const handleBanUser = () => {
    if (!selectedUserId) return;
    banUserMutation.mutate({
      userId: selectedUserId,
      reason: banReason.trim() ? banReason : undefined,
    });
  };

  const handleUnbanUser = (userId: string) => {
    if (confirm("Bạn có chắc chắn muốn mở khóa tài khoản này?")) {
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
                <BreadcrumbPage>Quản lý người dùng</BreadcrumbPage>
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
        {/* Banner with nice Indigo/Violet Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-rose-600 p-6 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  Bảng điều khiển & Quản trị Thành viên
                </h1>
                <p className="text-violet-100 text-xs md:text-sm mt-0.5 font-light">
                  Xem danh sách thành viên đang hoạt động, tạm khóa hoặc nâng cấp/khởi tạo quản trị viên trực tiếp bằng Better-Auth.
                </p>
              </div>
            </div>

            {/* Create User Dialog */}
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
              <DialogTrigger
                render={
                  <Button className="bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold shadow-lg border-none flex items-center gap-2 shrink-0 transition-transform active:scale-95" />
                }
              >
                <Plus className="h-4 w-4" /> Tạo Tài Khoản Mới
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card rounded-2xl border">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-foreground">Khởi tạo Tài Khoản Mới</DialogTitle>
                  <DialogDescription>
                    Tạo trực tiếp tài khoản mới vào hệ thống. Mật khẩu sẽ được mã hóa an toàn qua Better-Auth.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Họ và tên *</Label>
                    <Input
                      id="user-name"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Địa chỉ Email *</Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="nguyenvana@gmail.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-password">Mật khẩu *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="user-password"
                        type="text"
                        placeholder="Nhập hoặc tạo tự động"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        required
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGeneratePassword}
                        className="rounded-lg px-3 flex items-center gap-1 active:scale-95 shrink-0"
                        title="Tự động sinh mật khẩu ngẫu nhiên"
                      >
                        <Key className="h-4 w-4" /> Sinh mã
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-role">Vai trò trên hệ thống *</Label>
                    <Select
                      value={newUserRole}
                      onValueChange={(val) => setNewUserRole(val as "user" | "admin")}
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="user">Học viên (User)</SelectItem>
                        <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setCreateUserOpen(false)} className="rounded-xl">
                      Hủy bỏ
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                      {createUserMutation.isPending ? "Đang tạo..." : "Xác nhận tạo"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Users Table */}
        <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Danh Sách Tài Khoản</CardTitle>
              <CardDescription>
                Hiển thị và kiểm soát quyền truy cập của toàn bộ người dùng và quản trị viên.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 max-w-sm w-full">
              <Search className="h-4 w-4 text-muted-foreground absolute ml-3" />
              <Input
                placeholder="Tìm tên, email..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="pl-9 rounded-xl w-full"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isUsersLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                <span className="text-sm text-muted-foreground">Đang tải danh sách thành viên...</span>
              </div>
            ) : !users || users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                Không tìm thấy tài khoản người dùng nào.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học Viên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò (Role)</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày Tạo</TableHead>
                      <TableHead className="text-right">Hành Động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center font-bold text-sm">
                              {u.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground text-sm">{u.name}</span>
                              <span className="text-[10px] text-muted-foreground">ID: {u.id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          {u.role === "admin" ? (
                            <Badge className="bg-rose-100 hover:bg-rose-100 text-rose-800 border-rose-200 border flex items-center gap-1 w-fit">
                              <ShieldCheck className="h-3 w-3" /> Admin
                            </Badge>
                          ) : (
                            <Badge className="bg-indigo-100 hover:bg-indigo-100 text-indigo-800 border-indigo-200 border flex items-center gap-1 w-fit">
                              <UserCheck className="h-3 w-3" /> User
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.banned ? (
                            <div className="flex flex-col">
                              <Badge className="bg-rose-100 hover:bg-rose-100 text-rose-800 border-rose-200 border w-fit">
                                Bị Khóa (Banned)
                              </Badge>
                              {u.banReason && (
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 max-w-[200px] truncate" title={u.banReason}>
                                  Lý do: {u.banReason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 border w-fit">
                              Đang hoạt động
                            </Badge>
                          )}
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
                              variant="outline"
                              className="border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 rounded-lg p-1.5 h-8 flex items-center gap-1 ml-auto active:scale-95"
                              onClick={() => handleUnbanUser(u.id)}
                              disabled={unbanUserMutation.isPending}
                            >
                              <UserCheck className="h-4 w-4" /> Mở khóa
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 rounded-lg p-1.5 h-8 flex items-center gap-1 ml-auto active:scale-95"
                              onClick={() => handleOpenBanDialog(u.id)}
                              disabled={banUserMutation.isPending}
                            >
                              <Ban className="h-4 w-4" /> Khóa
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
      </div>

      {/* Ban User Dialog */}
      <Dialog open={banUserOpen} onOpenChange={setBanUserOpen}>
        <DialogContent className="max-w-md bg-card rounded-2xl border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Khóa tài khoản</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do khóa tài khoản này. Người dùng sẽ bị hủy phiên đăng nhập ngay lập tức.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="ban-reason">Lý do khóa tài khoản *</Label>
            <Input
              id="ban-reason"
              placeholder="Ví dụ: Vi phạm chính sách cộng đồng, gian lận học tập..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanUserOpen(false)} className="rounded-xl">
              Hủy
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              onClick={handleBanUser}
              disabled={banUserMutation.isPending}
            >
              {banUserMutation.isPending ? "Đang xử lý..." : "Khóa tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
