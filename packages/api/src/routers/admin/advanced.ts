import { TRPCError } from "@trpc/server";
import { eq, and, desc, asc, sql, like, or } from "drizzle-orm";
import { z } from "zod";
import crypto from "node:crypto";

import { router, adminProcedure } from "../../index";
import {
  user,
  session as sessionTable,
  courses,
  modules,
  writingAssignments,
  writingSubmissions,
  userProgress,
  aiPrompts,
  aiLogs,
  orders,
  userCourses,
  writingReviewTickets,
  adminAuditLogs,
  vouchers,
} from "@engducation/db/schema";
import { auth } from "@engducation/auth";

// ==========================================
// AUDIT LOG HELPER
// ==========================================
async function logAdminAction(
  db: any,
  adminId: string,
  ipAddress: string | null,
  userAgent: string | null,
  action: string,
  targetTable: string,
  targetId: string,
  oldPayload: any = null,
  newPayload: any = null
) {
  const id = crypto.randomUUID();
  await db.insert(adminAuditLogs).values({
    id,
    adminId,
    ipAddress,
    userAgent,
    action,
    targetTable,
    targetId,
    oldPayload: oldPayload ? JSON.stringify(oldPayload) : null,
    newPayload: newPayload ? JSON.stringify(newPayload) : null,
    createdAt: new Date(),
  });
}

// ==========================================
// SCHEMAS
// ==========================================
const aiConfigUpsertSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  systemPrompt: z.string().min(1, "System prompt không được để trống"),
  userPromptTemplate: z.string().min(1, "User prompt template không được để trống"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).default(2000),
});

const resolveReviewTicketSchema = z.object({
  ticketId: z.string().min(1),
  teacherEssay: z.string().min(1, "Văn bản sửa đổi không được để trống"),
  teacherScore: z.number().int().min(0).max(100),
  teacherFeedback: z.string().min(1, "Nhận xét không được để trống"),
});

// ==========================================
// ROUTER
// ==========================================
export const adminAdvancedRouter = router({
  // ─── ORDERS & SUBSCRIPTIONS ─────────────────────────────────────────────

  getOrders: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        status: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { page = 1, pageSize = 20, status } = input ?? {};
      const offset = (page - 1) * pageSize;

      const whereParts = [];
      if (status) whereParts.push(eq(orders.status, status));
      const whereClause = whereParts.length > 0 ? and(...whereParts) : undefined;

      const [rows, countResult] = await Promise.all([
        ctx.db.query.orders.findMany({
          where: whereClause,
          orderBy: [desc(orders.createdAt)],
          offset,
          limit: pageSize,
          with: {
            user: true,
            course: true,
            approvedBy: true,
          },
        }),
        ctx.db
          .select({ total: sql<number>`count(*)` })
          .from(orders)
          .where(whereClause)
          .limit(1),
      ]);

      const total = Number(countResult[0]?.total ?? 0);

      return {
        items: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  voucherList: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.vouchers.findMany({
      orderBy: [desc(vouchers.createdAt)],
    });
  }),

  voucherUpsert: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        code: z.string().min(1, "Mã giảm giá không được để trống"),
        discountPercent: z.number().int().min(1).max(100),
        maxUses: z.number().int().min(1).default(100),
        status: z.enum(["active", "inactive"]).default("active"),
        expiresAt: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;
      const { id, expiresAt, ...data } = input;
      const userAgent = ctx.headers.get("user-agent");
      const parsedExpiry = expiresAt ? new Date(expiresAt) : null;

      if (id) {
        const existing = await ctx.db.query.vouchers.findFirst({
          where: eq(vouchers.id, id),
        });
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Voucher không tồn tại",
          });
        }
        await ctx.db
          .update(vouchers)
          .set({
            ...data,
            expiresAt: parsedExpiry,
            updatedAt: new Date(),
          })
          .where(eq(vouchers.id, id));

        await logAdminAction(
          ctx.db,
          adminId,
          ctx.ipAddress,
          userAgent,
          "UPDATE_VOUCHER",
          "vouchers",
          id,
          existing,
          { ...data, expiresAt: parsedExpiry }
        );
        return { success: true, id };
      } else {
        const codeExists = await ctx.db.query.vouchers.findFirst({
          where: eq(vouchers.code, data.code),
        });
        if (codeExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Mã giảm giá này đã tồn tại",
          });
        }

        const newId = crypto.randomUUID();
        await ctx.db.insert(vouchers).values({
          id: newId,
          ...data,
          expiresAt: parsedExpiry,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await logAdminAction(
          ctx.db,
          adminId,
          ctx.ipAddress,
          userAgent,
          "CREATE_VOUCHER",
          "vouchers",
          newId,
          null,
          { ...data, expiresAt: parsedExpiry }
        );
        return { success: true, id: newId };
      }
    }),

  voucherDelete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;
      const { id } = input;
      const userAgent = ctx.headers.get("user-agent");

      const existing = await ctx.db.query.vouchers.findFirst({
        where: eq(vouchers.id, id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Voucher không tồn tại",
        });
      }

      await ctx.db.delete(vouchers).where(eq(vouchers.id, id));

      await logAdminAction(
        ctx.db,
        adminId,
        ctx.ipAddress,
        userAgent,
        "DELETE_VOUCHER",
        "vouchers",
        id,
        existing,
        null
      );
      return { success: true };
    }),

  createUserByAdmin: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Tên không được để trống"),
        email: z.string().email("Email không hợp lệ"),
        password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
        role: z.enum(["user", "admin"]).default("user"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;
      const userAgent = ctx.headers.get("user-agent");

      const existing = await ctx.db.query.user.findFirst({
        where: eq(user.email, input.email),
      });
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email này đã được đăng ký bởi tài khoản khác",
        });
      }

      // Use Better-Auth signUpEmail to create account safely
      const createdUser = await auth.api.signUpEmail({
        body: {
          email: input.email,
          password: input.password,
          name: input.name,
        },
      });

      if (!createdUser || !createdUser.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tạo tài khoản qua Better-Auth API thất bại",
        });
      }

      const targetUserId = createdUser.user.id;

      // Update role if admin chose role "admin"
      if (input.role === "admin") {
        await ctx.db
          .update(user)
          .set({ role: "admin", updatedAt: new Date() })
          .where(eq(user.id, targetUserId));
      }

      await logAdminAction(
        ctx.db,
        adminId,
        ctx.ipAddress,
        userAgent,
        "CREATE_USER_BY_ADMIN",
        "user",
        targetUserId,
        null,
        { name: input.name, email: input.email, role: input.role }
      );

      return { success: true, userId: targetUserId };
    }),

  approveOrderManually: adminProcedure
    .input(z.object({ orderId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;
      const { orderId } = input;

      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { course: true },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Đơn hàng không tồn tại",
        });
      }

      if (order.status !== "pending") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Đơn hàng đã được xử lý từ trước",
        });
      }

      // Calculate expiration date
      let expiresAt: Date | null = null;
      if (order.course.durationDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + order.course.durationDays);
      }

      await ctx.db.transaction(async (tx) => {
        // 1. Update order status
        await tx
          .update(orders)
          .set({
            status: "success",
            approvedById: adminId,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));

        // 2. Grant ownership to target user
        const ownershipId = crypto.randomUUID();
        await tx.insert(userCourses).values({
          id: ownershipId,
          userId: order.userId,
          courseId: order.courseId,
          activatedAt: new Date(),
          expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Ghi log hoạt động
      const userAgent = ctx.headers.get("user-agent");
      await logAdminAction(
        ctx.db,
        adminId,
        ctx.ipAddress,
        userAgent,
        "APPROVE_ORDER",
        "orders",
        orderId,
        { status: "pending" },
        { status: "success", approvedById: adminId }
      );

      return { success: true };
    }),

  rejectOrderManually: adminProcedure
    .input(z.object({ orderId: z.string().min(1), reason: z.string().min(1, "Lý do từ chối không được để trống") }))
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;
      const { orderId, reason } = input;

      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Đơn hàng không tồn tại",
        });
      }

      if (order.status !== "pending") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Đơn hàng đã được xử lý từ trước",
        });
      }

      await ctx.db
        .update(orders)
        .set({
          status: "failed",
          notes: reason,
          approvedById: adminId,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      const userAgent = ctx.headers.get("user-agent");
      await logAdminAction(
        ctx.db,
        adminId,
        ctx.ipAddress,
        userAgent,
        "REJECT_ORDER",
        "orders",
        orderId,
        { status: "pending" },
        { status: "failed", reason }
      );

      return { success: true };
    }),

  // ─── AI INFRASTRUCTURE & MONITORING ──────────────────────────────────────

  aiConfigList: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.aiPrompts.findMany({
      orderBy: [asc(aiPrompts.title)],
    });
  }),

  aiConfigUpsert: adminProcedure
    .input(aiConfigUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;
      const { id, ...data } = input;
      const userAgent = ctx.headers.get("user-agent");

      if (id) {
        const existing = await ctx.db.query.aiPrompts.findFirst({
          where: eq(aiPrompts.id, id),
        });
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prompt không tồn tại",
          });
        }

        await ctx.db
          .update(aiPrompts)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(aiPrompts.id, id));

        await logAdminAction(
          ctx.db,
          adminId,
          ctx.ipAddress,
          userAgent,
          "UPDATE_PROMPT",
          "ai_prompts",
          id,
          existing,
          data
        );
        return { success: true, id };
      } else {
        const newId = crypto.randomUUID();
        await ctx.db.insert(aiPrompts).values({
          id: newId,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await logAdminAction(
          ctx.db,
          adminId,
          ctx.ipAddress,
          userAgent,
          "CREATE_PROMPT",
          "ai_prompts",
          newId,
          null,
          data
        );
        return { success: true, id: newId };
      }
    }),

  aiConfigDelete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;
      const { id } = input;

      const existing = await ctx.db.query.aiPrompts.findFirst({
        where: eq(aiPrompts.id, id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt không tồn tại",
        });
      }

      await ctx.db.delete(aiPrompts).where(eq(aiPrompts.id, id));

      const userAgent = ctx.headers.get("user-agent");
      await logAdminAction(
        ctx.db,
        adminId,
        ctx.ipAddress,
        userAgent,
        "DELETE_PROMPT",
        "ai_prompts",
        id,
        existing,
        null
      );

      return { success: true };
    }),

  aiUsageStats: adminProcedure.query(async ({ ctx }) => {
    // 1. Thống kê chi phí theo Khóa học (Cost per Course)
    const costPerCourse = await ctx.db
      .select({
        courseId: courses.id,
        courseTitle: courses.title,
        totalTokens: sql<number>`sum(${aiLogs.tokensUsed})`,
        totalCost: sql<number>`sum(${aiLogs.cost})`,
        callsCount: sql<number>`count(${aiLogs.id})`,
      })
      .from(aiLogs)
      .innerJoin(writingAssignments, eq(aiLogs.writingId, writingAssignments.id))
      .innerJoin(modules, eq(modules.id, writingAssignments.moduleId))
      .innerJoin(courses, eq(courses.id, modules.courseId))
      .groupBy(courses.id, courses.title)
      .orderBy(desc(sql`sum(${aiLogs.cost})`));

    // 2. Thống kê chi phí theo Bài tập (Cost per Exercise)
    const costPerExercise = await ctx.db
      .select({
        exerciseId: writingAssignments.id,
        exerciseTitle: writingAssignments.title,
        totalTokens: sql<number>`sum(${aiLogs.tokensUsed})`,
        totalCost: sql<number>`sum(${aiLogs.cost})`,
        callsCount: sql<number>`count(${aiLogs.id})`,
      })
      .from(aiLogs)
      .innerJoin(writingAssignments, eq(aiLogs.writingId, writingAssignments.id))
      .groupBy(writingAssignments.id, writingAssignments.title)
      .orderBy(desc(sql`sum(${aiLogs.cost})`))
      .limit(10);

    // 3. Theo dõi tỷ lệ lỗi kết nối (Error Rates over time)
    const errorLogs = await ctx.db
      .select({
        status: aiLogs.status,
        count: sql<number>`count(*)`,
      })
      .from(aiLogs)
      .groupBy(aiLogs.status);

    const totalLogs = errorLogs.reduce((acc: number, cur: any) => acc + Number(cur.count), 0);
    const failedLogs = errorLogs.find((e: any) => e.status === "failed")?.count ?? 0;
    const errorRate = totalLogs > 0 ? (Number(failedLogs) / totalLogs) * 100 : 0;

    return {
      costPerCourse,
      costPerExercise,
      errorRate: Number(errorRate.toFixed(2)),
      totalCalls: totalLogs,
      failedCalls: Number(failedLogs),
    };
  }),

  // ─── HUMAN-IN-THE-LOOP REVIEWS ───────────────────────────────────────────

  getReviewTickets: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "resolved"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const statusFilter = input?.status;
      const whereClause = statusFilter ? eq(writingReviewTickets.status, statusFilter) : undefined;

      return ctx.db.query.writingReviewTickets.findMany({
        where: whereClause,
        orderBy: [desc(writingReviewTickets.createdAt)],
        with: {
          user: true,
          writingAssignment: true,
          submission: true,
          resolvedBy: true,
        },
      });
    }),

  resolveReviewTicket: adminProcedure
    .input(resolveReviewTicketSchema)
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;
      const { ticketId, teacherEssay, teacherScore, teacherFeedback } = input;

      const ticket = await ctx.db.query.writingReviewTickets.findFirst({
        where: eq(writingReviewTickets.id, ticketId),
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Yêu cầu khiếu nại không tồn tại",
        });
      }

      if (ticket.status !== "pending") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Yêu cầu khiếu nại đã được giải quyết",
        });
      }

      await ctx.db.transaction(async (tx) => {
        // 1. Update review ticket status
        await tx
          .update(writingReviewTickets)
          .set({
            status: "resolved",
            teacherEssay,
            teacherScore,
            teacherFeedback,
            resolvedById: adminId,
            updatedAt: new Date(),
          })
          .where(eq(writingReviewTickets.id, ticketId));

        // 2. Overwrite user's writing submission result
        await tx
          .update(writingSubmissions)
          .set({
            essay: teacherEssay,
            score: teacherScore,
            feedback: {
              type: "teacher_graded",
              teacherFeedback,
              originalScore: ticket.aiFeedback ? (ticket.aiFeedback as any).score || null : null,
              gradedBy: adminId,
            },
          })
          .where(eq(writingSubmissions.id, ticket.submissionId));

        // 3. Mark progress as completed in userProgress
        const existingProgress = await tx.query.userProgress.findFirst({
          where: and(
            eq(userProgress.userId, ticket.userId),
            eq(userProgress.writingId, ticket.writingId)
          ),
        });

        if (existingProgress) {
          await tx
            .update(userProgress)
            .set({
              status: "completed",
              updatedAt: new Date(),
            })
            .where(eq(userProgress.id, existingProgress.id));
        } else {
          await tx.insert(userProgress).values({
            id: crypto.randomUUID(),
            userId: ticket.userId,
            writingId: ticket.writingId,
            status: "completed",
            updatedAt: new Date(),
          });
        }
      });

      // Audit log
      const userAgent = ctx.headers.get("user-agent");
      await logAdminAction(
        ctx.db,
        adminId,
        ctx.ipAddress,
        userAgent,
        "RESOLVE_REVIEW_TICKET",
        "writing_review_tickets",
        ticketId,
        { status: "pending" },
        { status: "resolved", teacherScore, teacherFeedback }
      );

      return { success: true };
    }),

  // ─── USER MODERATION & SECURITY ──────────────────────────────────────────

  getUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const searchVal = input?.search;
      const whereClause = searchVal
        ? or(
            like(user.name, `%${searchVal}%`),
            like(user.email, `%${searchVal}%`)
          )
        : undefined;

      return ctx.db.query.user.findMany({
        where: whereClause,
        orderBy: [desc(user.createdAt)],
      });
    }),

  banUser: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;
      const { userId, reason = "Vi phạm điều khoản sử dụng hệ thống" } = input;

      if (userId === adminId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bạn không thể tự khóa tài khoản của chính mình",
        });
      }

      const targetUser = await ctx.db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Người dùng không tồn tại",
        });
      }

      await ctx.db.transaction(async (tx) => {
        // 1. Update user ban fields
        await tx
          .update(user)
          .set({
            banned: true,
            banReason: reason,
            updatedAt: new Date(),
          })
          .where(eq(user.id, userId));

        // 2. Revoke all active sessions instantly by deleting session rows
        await tx
          .delete(sessionTable)
          .where(eq(sessionTable.userId, userId));
      });

      // Audit log
      const userAgent = ctx.headers.get("user-agent");
      await logAdminAction(
        ctx.db,
        adminId,
        ctx.ipAddress,
        userAgent,
        "BAN_USER",
        "user",
        userId,
        { banned: false },
        { banned: true, banReason: reason }
      );

      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;
      const { userId } = input;

      const targetUser = await ctx.db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Người dùng không tồn tại",
        });
      }

      await ctx.db
        .update(user)
        .set({
          banned: false,
          banReason: null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

      // Audit log
      const userAgent = ctx.headers.get("user-agent");
      await logAdminAction(
        ctx.db,
        adminId,
        ctx.ipAddress,
        userAgent,
        "UNBAN_USER",
        "user",
        userId,
        { banned: true },
        { banned: false }
      );

      return { success: true };
    }),

  getAuditLogs: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.adminAuditLogs.findMany({
      orderBy: [desc(adminAuditLogs.createdAt)],
      with: {
        admin: true,
      },
    });
  }),
});
