import { TRPCError } from "@trpc/server";
import { eq, and, asc, sql, like, or, inArray, isNull, isNotNull } from "drizzle-orm";
import { z } from "zod";
import crypto from "node:crypto";

import { router, adminProcedure } from "../../index";
import {
  courses,
  modules,
  lessons,
  quizzes,
  writingAssignments,
  questions,
  answers,
  userProgress,
  vocabularies,
} from "@engducation/db/schema";


// ==========================================
// SHARED SCHEMAS
// ==========================================

const courseLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
const contentStatusSchema = z.enum(["draft", "published", "archived"]);

// ─── Course ───────────────────────────────────────────────────

const createCourseSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  level: courseLevelSchema,
  price: z.number().int().min(0, "Giá không được nhỏ hơn 0").default(0),
  certificateTemplateUrl: z.string().url().optional().nullable().or(z.literal("")),
});


// ─── Module ───────────────────────────────────────────────────

const createModuleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  order: z.number().int().min(1).optional(),
});

const updateModuleSchema = createModuleSchema
  .partial()
  .omit({ courseId: true });

// ─── Lesson ──────────────────────────────────────────────────

const createLessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  videoPublicId: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  order: z.number().int().min(1).optional(),
  status: contentStatusSchema.default("draft"),
});

const updateLessonSchema = createLessonSchema
  .partial()
  .omit({ moduleId: true });

// ─── Writing Assignment ────────────────────────────────────────

const createWritingSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  prompt: z.string().min(1, "Đề bài không được để trống"),
  rubric: z.string().min(1, "Thang điểm và tiêu chí không được để trống"),
  wordLimit: z.number().int().min(1).optional(),
  suggestedAnswer: z.string().optional(),
  order: z.number().int().min(1).optional(),
  status: contentStatusSchema.default("draft"),
});

const updateWritingSchema = createWritingSchema
  .partial()
  .omit({ moduleId: true });

// ─── Reorder ─────────────────────────────────────────────────

const reorderContentSchema = z.object({
  moduleId: z.string().min(1),
  movements: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum(["lesson", "quiz", "writing"]),
        order: z.number().int().min(1),
      }),
    )
    .min(1, "Danh sách sắp xếp không được để trống"),
});

// ─── Quiz ───────────────────────────────────────────────────

const upsertQuizSchema = z.object({
  quizId: z.string().optional(),
  moduleId: z.string().min(1),
  title: z.string().min(1, "Tiêu đề bài tập không được để trống"),
  order: z.number().int().min(1).optional(),
  status: contentStatusSchema.default("draft"),
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        content: z.string().min(1, "Nội dung câu hỏi không được để trống"),
        explanation: z.string().optional(),
        order: z.number().int().min(1),
        answers: z
          .array(
            z.object({
              id: z.string().min(1),
              content: z.string().min(1, "Nội dung đáp án không được để trống"),
              isCorrect: z.boolean(),
            }),
          )
          .min(2, "Mỗi câu hỏi cần ít nhất 2 đáp án"),
      }),
    )
    .min(1, "Bài tập cần ít nhất 1 câu hỏi"),
});

const addQuestionSchema = z.object({
  quizId: z.string().min(1),
  content: z.string().min(1, "Nội dung câu hỏi không được để trống"),
  explanation: z.string().optional(),
  order: z.number().int().min(1),
  answers: z
    .array(
      z.object({
        id: z.string().min(1),
        content: z.string().min(1, "Nội dung đáp án không được để trống"),
        isCorrect: z.boolean(),
      }),
    )
    .min(2, "Mỗi câu hỏi cần ít nhất 2 đáp án"),
});


// ==========================================
// ROUTER
// ==========================================

export const adminContentRouter = router({
  // ─── COURSES ──────────────────────────────────────────────

  courseList: adminProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(100).default(20),
          level: courseLevelSchema.optional(),
          status: contentStatusSchema.optional(),
          search: z.string().optional(),
          showDeleted: z.boolean().optional().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { page = 1, pageSize = 20, level, status, search, showDeleted = false } = input ?? {};
      const offset = (page - 1) * pageSize;

      const whereParts = [];
      if (showDeleted) {
        whereParts.push(isNotNull(courses.deletedAt));
      } else {
        whereParts.push(isNull(courses.deletedAt));
      }
      if (level) whereParts.push(eq(courses.level, level));
      if (status) whereParts.push(eq(courses.status, status));
      if (search) {
        whereParts.push(
          or(
            like(courses.title, `%${search}%`),
            like(courses.description, `%${search}%`),
          )!,
        );
      }
      const whereClause = whereParts.length > 0 ? and(...whereParts) : undefined;

      const [rows, countResult] = await Promise.all([
        ctx.db.query.courses.findMany({
          where: whereClause,
          orderBy: [asc(courses.createdAt)],
          offset,
          limit: pageSize,
          with: {
            modules: {
              with: {
                lessons: { columns: { id: true } },
                quizzes: { columns: { id: true } },
                writingAssignments: { columns: { id: true } },
              },
            },
          },
        }),
        ctx.db
          .select({ total: sql<number>`count(*)` })
          .from(courses)
          .where(whereClause)
          .limit(1),
      ]);

      const total = Number(countResult[0]?.total ?? 0);

      return {
        items: rows.map((c) => {
          const lessonCount = (c.modules ?? []).reduce(
            (acc, m) => acc + (m.lessons ?? []).length,
            0,
          );
          return {
            ...c,
            lessonCount,
          };
        }),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  courseCreate: adminProcedure
    .input(createCourseSchema)
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      await ctx.db.insert(courses).values({
        id,
        title: input.title,
        description: input.description ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        level: input.level,
        status: "draft",
        price: input.price,
        certificateTemplateUrl: input.certificateTemplateUrl ?? null,
      });
      return { id };
    }),

  courseUpdate: adminProcedure
    .input(
      createCourseSchema
        .partial()
        .extend({ id: z.string().min(1) })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const existing = await ctx.db.query.courses.findFirst({
        where: and(eq(courses.id, id), isNull(courses.deletedAt)),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Khóa học không tồn tại hoặc đã bị xóa mềm",
        });
      }

      await ctx.db
        .update(courses)
        .set({
          ...rest,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, id));

      return { id };
    }),

  coursePublish: adminProcedure
    .input(z.object({ courseId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { courseId } = input;
      const existing = await ctx.db.query.courses.findFirst({
        where: and(eq(courses.id, courseId), isNull(courses.deletedAt)),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Khóa học không tồn tại hoặc đã bị xóa mềm",
        });
      }

      await ctx.db.transaction(async (tx) => {
        // 1. Update Course status to published
        await tx
          .update(courses)
          .set({ status: "published", updatedAt: new Date() })
          .where(eq(courses.id, courseId));

        // 2. Update all Modules of this Course to published
        await tx
          .update(modules)
          .set({ status: "published", updatedAt: new Date() })
          .where(eq(modules.courseId, courseId));

        // 3. Update all Vocabularies of this Course to published
        await tx
          .update(vocabularies)
          .set({ status: "published", updatedAt: new Date() })
          .where(eq(vocabularies.courseId, courseId));

        // 4. Get all Module IDs to update Lessons, Quizzes, and Writing Assignments
        const mods = await tx
          .select({ id: modules.id })
          .from(modules)
          .where(eq(modules.courseId, courseId));
        const modIds = mods.map((m) => m.id);

        if (modIds.length > 0) {
          // Update all Lessons
          await tx
            .update(lessons)
            .set({ status: "published", updatedAt: new Date() })
            .where(inArray(lessons.moduleId, modIds));

          // Update all Quizzes
          await tx
            .update(quizzes)
            .set({ status: "published", updatedAt: new Date() })
            .where(inArray(quizzes.moduleId, modIds));

          // Update all Writing Assignments
          await tx
            .update(writingAssignments)
            .set({ status: "published", updatedAt: new Date() })
            .where(inArray(writingAssignments.moduleId, modIds));
        }
      });

      return { published: true };
    }),

  courseDelete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.courses.findFirst({
        where: and(eq(courses.id, input.id), isNull(courses.deletedAt)),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Khóa học không tồn tại hoặc đã bị xóa",
        });
      }

      await ctx.db
        .update(courses)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(courses.id, input.id));

      return { deleted: true };
    }),

  courseRestore: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.courses.findFirst({
        where: and(eq(courses.id, input.id), isNotNull(courses.deletedAt)),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Khóa học không tồn tại trong Thùng rác",
        });
      }

      await ctx.db
        .update(courses)
        .set({
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, input.id));

      return { restored: true };
    }),

  // ─── MODULES ──────────────────────────────────────────────

  moduleCreate: adminProcedure
    .input(createModuleSchema)
    .mutation(async ({ ctx, input }) => {
      const existingCourse = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.courseId),
      });
      if (!existingCourse) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Khóa học không tồn tại",
        });
      }

      let order: number;
      if (input.order !== undefined) {
        order = input.order;
      } else {
        const maxRow = await ctx.db
          .select({ maxOrder: sql<number>`max(${modules.order})` })
          .from(modules)
          .where(eq(modules.courseId, input.courseId))
          .limit(1);
        order = (maxRow[0]?.maxOrder ?? 0) + 1;
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(modules).values({
        id,
        courseId: input.courseId,
        title: input.title,
        description: input.description ?? null,
        order,
      });

      const created = await ctx.db.query.modules.findFirst({
        where: eq(modules.id, id),
      });
      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tạo module học thất bại",
        });
      }
      return created;
    }),

  moduleUpdate: adminProcedure
    .input(updateModuleSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;

      const existing = await ctx.db.query.modules.findFirst({
        where: eq(modules.id, id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Module học không tồn tại",
        });
      }

      await ctx.db
        .update(modules)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(modules.id, id));

      return ctx.db.query.modules.findFirst({ where: eq(modules.id, id) });
    }),

  moduleDelete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.modules.findFirst({
        where: eq(modules.id, input.id),
        with: {
          lessons: { columns: { id: true } },
          quizzes: { columns: { id: true } },
          writingAssignments: { columns: { id: true } },
        },
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Module học không tồn tại",
        });
      }

      const totalItems =
        (existing.lessons?.length ?? 0) +
        (existing.quizzes?.length ?? 0) +
        (existing.writingAssignments?.length ?? 0);

      if (totalItems > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Không thể xóa module đang có ${totalItems} nội dung (bài học, quiz, viết luận). Hãy xóa toàn bộ nội dung trước.`,
        });
      }

      await ctx.db.delete(modules).where(eq(modules.id, input.id));
      return { deleted: true };
    }),

  // ─── LESSONS ──────────────────────────────────────────────

  lessonCreate: adminProcedure
    .input(createLessonSchema)
    .mutation(async ({ ctx, input }) => {
      const existingModule = await ctx.db.query.modules.findFirst({
        where: eq(modules.id, input.moduleId),
      });
      if (!existingModule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Module không tồn tại",
        });
      }

      let order: number;
      if (input.order !== undefined) {
        order = input.order;
      } else {
        order = (await getMaxOrderInModule(ctx.db, input.moduleId)) + 1;
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(lessons).values({
        id,
        moduleId: input.moduleId,
        title: input.title,
        description: input.description ?? null,
        videoPublicId: input.videoPublicId ?? null,
        videoUrl: input.videoUrl ?? null,
        order,
        status: "draft",
      });

      const created = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, id),
      });
      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tạo bài học thất bại",
        });
      }
      return created;
    }),

  lessonUpdate: adminProcedure
    .input(updateLessonSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;

      const existing = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài học không tồn tại",
        });
      }

      await ctx.db
        .update(lessons)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(lessons.id, id));

      return ctx.db.query.lessons.findFirst({ where: eq(lessons.id, id) });
    }),

  lessonDelete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, input.id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài học không tồn tại",
        });
      }

      await ctx.db.delete(lessons).where(eq(lessons.id, input.id));
      return { deleted: true };
    }),

  // ─── WRITING ASSIGNMENTS ──────────────────────────────────

  writingCreate: adminProcedure
    .input(createWritingSchema)
    .mutation(async ({ ctx, input }) => {
      const existingModule = await ctx.db.query.modules.findFirst({
        where: eq(modules.id, input.moduleId),
      });
      if (!existingModule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Module không tồn tại",
        });
      }

      let order: number;
      if (input.order !== undefined) {
        order = input.order;
      } else {
        order = (await getMaxOrderInModule(ctx.db, input.moduleId)) + 1;
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(writingAssignments).values({
        id,
        moduleId: input.moduleId,
        title: input.title,
        prompt: input.prompt,
        rubric: input.rubric,
        wordLimit: input.wordLimit ?? null,
        suggestedAnswer: input.suggestedAnswer ?? null,
        order,
        status: "draft",
      });

      const created = await ctx.db.query.writingAssignments.findFirst({
        where: eq(writingAssignments.id, id),
      });
      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tạo bài tập viết luận thất bại",
        });
      }
      return created;
    }),

  writingUpdate: adminProcedure
    .input(updateWritingSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;

      const existing = await ctx.db.query.writingAssignments.findFirst({
        where: eq(writingAssignments.id, id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài tập viết luận không tồn tại",
        });
      }

      await ctx.db
        .update(writingAssignments)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(writingAssignments.id, id));

      return ctx.db.query.writingAssignments.findFirst({
        where: eq(writingAssignments.id, id),
      });
    }),

  writingDelete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.writingAssignments.findFirst({
        where: eq(writingAssignments.id, input.id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài tập viết luận không tồn tại",
        });
      }

      await ctx.db.delete(writingAssignments).where(eq(writingAssignments.id, input.id));
      return { deleted: true };
    }),

  // ─── QUIZZES & GENERAL REORDER ────────────────────────────

  contentReorder: adminProcedure
    .input(reorderContentSchema)
    .mutation(async ({ ctx, input }) => {
      const { moduleId, movements } = input;

      const [moduleLessons, moduleQuizzes, moduleWritings] = await Promise.all([
        ctx.db.query.lessons.findMany({
          where: eq(lessons.moduleId, moduleId),
          columns: { id: true },
        }),
        ctx.db.query.quizzes.findMany({
          where: eq(quizzes.moduleId, moduleId),
          columns: { id: true },
        }),
        ctx.db.query.writingAssignments.findMany({
          where: eq(writingAssignments.moduleId, moduleId),
          columns: { id: true },
        }),
      ]);

      const validLessonIds = new Set(moduleLessons.map((l) => l.id));
      const validQuizIds = new Set(moduleQuizzes.map((q) => q.id));
      const validWritingIds = new Set(moduleWritings.map((w) => w.id));

      for (const m of movements) {
        if (m.type === "lesson" && !validLessonIds.has(m.id)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Bài học "${m.id}" không thuộc module này`,
          });
        }
        if (m.type === "quiz" && !validQuizIds.has(m.id)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Bài trắc nghiệm "${m.id}" không thuộc module này`,
          });
        }
        if (m.type === "writing" && !validWritingIds.has(m.id)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Bài viết luận "${m.id}" không thuộc module này`,
          });
        }
      }

      const orderCounts = new Map<number, number>();
      for (const m of movements) {
        orderCounts.set(m.order, (orderCounts.get(m.order) ?? 0) + 1);
      }
      for (const [order, count] of orderCounts) {
        if (count > 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Thứ tự ${order} bị trùng lặp trong danh sách sắp xếp`,
          });
        }
      }

      const minOrder = Math.min(...movements.map((m) => m.order));
      const reservedBase = -(minOrder + movements.length + 100);

      await ctx.db.transaction(async (tx) => {
        // Step A: Move to temp negative values to avoid Unique Constraints
        for (let i = 0; i < movements.length; i++) {
          const m = movements[i]!;
          const tempOrder = reservedBase - i;
          if (m.type === "lesson") {
            await tx
              .update(lessons)
              .set({ order: tempOrder, updatedAt: new Date() })
              .where(and(eq(lessons.moduleId, moduleId), eq(lessons.id, m.id)));
          } else if (m.type === "quiz") {
            await tx
              .update(quizzes)
              .set({ order: tempOrder, updatedAt: new Date() })
              .where(and(eq(quizzes.moduleId, moduleId), eq(quizzes.id, m.id)));
          } else if (m.type === "writing") {
            await tx
              .update(writingAssignments)
              .set({ order: tempOrder, updatedAt: new Date() })
              .where(and(eq(writingAssignments.moduleId, moduleId), eq(writingAssignments.id, m.id)));
          }
        }

        // Step B: Update to final desired order
        for (const m of movements) {
          if (m.type === "lesson") {
            await tx
              .update(lessons)
              .set({ order: m.order, updatedAt: new Date() })
              .where(and(eq(lessons.moduleId, moduleId), eq(lessons.id, m.id)));
          } else if (m.type === "quiz") {
            await tx
              .update(quizzes)
              .set({ order: m.order, updatedAt: new Date() })
              .where(and(eq(quizzes.moduleId, moduleId), eq(quizzes.id, m.id)));
          } else if (m.type === "writing") {
            await tx
              .update(writingAssignments)
              .set({ order: m.order, updatedAt: new Date() })
              .where(and(eq(writingAssignments.moduleId, moduleId), eq(writingAssignments.id, m.id)));
          }
        }
      });

      return { success: true };
    }),

  quizUpsertStructure: adminProcedure
    .input(upsertQuizSchema)
    .mutation(async ({ ctx, input }) => {
      const { quizId: existingQuizId, moduleId, title, order: inputOrder, status, questions: questionsInput } =
        input;

      for (const q of questionsInput) {
        const correctCount = q.answers.filter((a) => a.isCorrect).length;
        if (correctCount === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Câu hỏi "${q.content.slice(0, 40)}…" chưa có đáp án đúng nào`,
          });
        }
      }

      const existingModule = await ctx.db.query.modules.findFirst({
        where: eq(modules.id, moduleId),
      });
      if (!existingModule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Module học không tồn tại",
        });
      }

      let resolvedQuizId = existingQuizId;
      const now = new Date();

      await ctx.db.transaction(async (tx) => {
        if (existingQuizId) {
          await tx
            .update(quizzes)
            .set({ title, status: status ?? "draft", updatedAt: now })
            .where(eq(quizzes.id, existingQuizId));

          const existingQs = await tx
            .select({ id: questions.id })
            .from(questions)
            .where(eq(questions.quizId, existingQuizId));
          for (const q of existingQs) {
            await tx.delete(questions).where(eq(questions.id, q.id));
          }
        } else {
          const newId = crypto.randomUUID();
          resolvedQuizId = newId;

          let order: number;
          if (inputOrder !== undefined) {
            order = inputOrder;
          } else {
            order = (await getMaxOrderInModule(tx, moduleId)) + 1;
          }

          await tx.insert(quizzes).values({
            id: newId,
            moduleId,
            title,
            order,
            status: "draft",
          });
        }
      });

      if (!resolvedQuizId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tạo hoặc cập nhật bài tập thất bại",
        });
      }

      for (const q of questionsInput) {
        await ctx.db.insert(questions).values({
          id: q.id,
          quizId: resolvedQuizId,
          content: q.content,
          explanation: q.explanation ?? null,
          order: q.order,
        });
        for (const a of q.answers) {
          await ctx.db.insert(answers).values({
            id: a.id,
            questionId: q.id,
            content: a.content,
            isCorrect: a.isCorrect,
          });
        }
      }

      const full = await ctx.db.query.quizzes.findFirst({
        where: eq(quizzes.id, resolvedQuizId),
        with: {
          questions: {
            orderBy: [asc(questions.order)],
            with: { answers: true },
          },
        },
      });
      return full;
    }),

  createQuizQuestion: adminProcedure
    .input(addQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      const { quizId, content, explanation, order, answers: answersInput } =
        input;

      const correctCount = answersInput.filter((a) => a.isCorrect).length;
      if (correctCount === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Câu hỏi phải có ít nhất một đáp án đúng",
        });
      }

      const quiz = await ctx.db.query.quizzes.findFirst({
        where: eq(quizzes.id, quizId),
      });
      if (!quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài tập không tồn tại",
        });
      }

      const questionId = crypto.randomUUID();

      await ctx.db.transaction(async (tx) => {
        await tx.insert(questions).values({
          id: questionId,
          quizId,
          content,
          explanation: explanation ?? null,
          order,
        });
        for (const a of answersInput) {
          await tx.insert(answers).values({
            id: a.id,
            questionId: questionId,
            content: a.content,
            isCorrect: a.isCorrect,
          });
        }
      });

      const created = await ctx.db.query.questions.findFirst({
        where: eq(questions.id, questionId),
        with: { answers: true },
      });
      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tạo câu hỏi thất bại",
        });
      }
      return created;
    }),

  quizDelete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.quizzes.findFirst({
        where: eq(quizzes.id, input.id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài tập không tồn tại",
        });
      }

      await ctx.db.delete(quizzes).where(eq(quizzes.id, input.id));
      return { deleted: true };
    }),

  courseGetDetail: adminProcedure
    .input(z.object({ courseId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { courseId } = input;
      const course = await ctx.db.query.courses.findFirst({
        where: and(eq(courses.id, courseId), isNull(courses.deletedAt)),
        with: {
          modules: {
            orderBy: [asc(modules.order)],
            with: {
              lessons: {
                orderBy: [asc(lessons.order)],
              },
              quizzes: {
                orderBy: [asc(quizzes.order)],
                with: {
                  questions: {
                    orderBy: [asc(questions.order)],
                    with: { answers: true },
                  },
                },
              },
              writingAssignments: {
                orderBy: [asc(writingAssignments.order)],
              },
            },
          },
        },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Khóa học không tồn tại",
        });
      }

      // Map modules to combine and sort lessons, quizzes, and writingAssignments linearly by order
      const modulesWithContents = (course.modules ?? []).map((mod) => {
        const combined = [
          ...(mod.lessons ?? []).map((l) => ({ ...l, type: "lesson" as const })),
          ...(mod.quizzes ?? []).map((q) => ({ ...q, type: "quiz" as const })),
          ...(mod.writingAssignments ?? []).map((w) => ({ ...w, type: "writing" as const })),
        ].sort((a, b) => a.order - b.order);

        return {
          ...mod,
          contents: combined,
        };
      });

      return {
        ...course,
        modules: modulesWithContents,
      };
    }),

  // ─── DASHBOARD STATS ──────────────────────────────────────

  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [courseCount, lessonCount, quizCount, writingCount, userCount] =
      await Promise.all([
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(courses)
          .limit(1),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(lessons)
          .limit(1),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(quizzes)
          .limit(1),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(writingAssignments)
          .limit(1),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(userProgress)
          .limit(1),
      ]);

    return {
      totalCourses: Number(courseCount[0]?.count ?? 0),
      totalLessons: Number(lessonCount[0]?.count ?? 0),
      totalQuizzes: Number(quizCount[0]?.count ?? 0),
      totalWritingAssignments: Number(writingCount[0]?.count ?? 0),
      totalProgressLogs: Number(userCount[0]?.count ?? 0),
    };
  }),
});

async function getMaxOrderInModule(db: any, moduleId: string): Promise<number> {
  const [maxLesson, maxQuiz, maxWriting] = await Promise.all([
    db.select({ max: sql<number>`max(${lessons.order})` }).from(lessons).where(eq(lessons.moduleId, moduleId)),
    db.select({ max: sql<number>`max(${quizzes.order})` }).from(quizzes).where(eq(quizzes.moduleId, moduleId)),
    db.select({ max: sql<number>`max(${writingAssignments.order})` }).from(writingAssignments).where(eq(writingAssignments.moduleId, moduleId)),
  ]);
  return Math.max(
    Number(maxLesson[0]?.max ?? 0),
    Number(maxQuiz[0]?.max ?? 0),
    Number(maxWriting[0]?.max ?? 0)
  );
}

