"use client";

import { Badge } from "@engducation/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@engducation/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@engducation/ui/components/dialog";
import { Button } from "@engducation/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@engducation/ui/components/table";
import { Eye, ShieldAlert } from "lucide-react";
import { useAuditLogs } from "../hooks/use-audit-logs";
import { useQuery } from "@tanstack/react-query";

interface AuditLogsViewProps {
  /** Controls which tab is active — when "audit" this component fetches real data */
  activeTab: string;
}

export function AuditLogsView({ activeTab }: AuditLogsViewProps) {
  const { data: auditLogs, isLoading } = useQuery(useAuditLogs(activeTab === "audit"));

  return (
    <Card className="rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          Lịch sử Audit Logs vĩnh viễn (Append-Only)
        </CardTitle>
        <CardDescription>
          Ghi nhật ký toàn bộ các hành động nhạy cảm [CREATE, UPDATE, DELETE] của
          toàn bộ Admin hệ thống.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">
              Đang tải nhật ký kiểm toán...
            </span>
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
                        <span className="font-semibold text-foreground text-sm">
                          {log.admin?.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {log.admin?.email}
                        </span>
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
                    <TableCell className="text-xs font-mono">
                      {log.ipAddress || "localhost"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg h-8 flex items-center gap-1 ml-auto"
                            />
                          }
                        >
                          <Eye className="h-3.5 w-3.5" /> Xem Payload
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl bg-card rounded-2xl border">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                              <ShieldAlert className="h-5 w-5 text-rose-600" /> Chi tiết
                              thay đổi dữ liệu (Payload context)
                            </DialogTitle>
                            <DialogDescription>
                              Đối chiếu Old Payload (Trạng thái cũ) và New Payload (Trạng
                              thái mới).
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4 min-h-[300px]">
                            <div className="space-y-2">
                              <span className="font-bold text-xs uppercase text-amber-600 block">
                                Dữ liệu cũ (Old Payload)
                              </span>
                              <pre className="bg-muted p-4 rounded-xl text-xs font-mono overflow-auto max-h-[350px] whitespace-pre-wrap border">
                                {log.oldPayload
                                  ? JSON.stringify(JSON.parse(log.oldPayload), null, 2)
                                  : "NULL"}
                              </pre>
                            </div>
                            <div className="space-y-2">
                              <span className="font-bold text-xs uppercase text-emerald-600 block">
                                Dữ liệu mới (New Payload)
                              </span>
                              <pre className="bg-muted p-4 rounded-xl text-xs font-mono overflow-auto max-h-[350px] whitespace-pre-wrap border">
                                {log.newPayload
                                  ? JSON.stringify(JSON.parse(log.newPayload), null, 2)
                                  : "NULL"}
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
  );
}
