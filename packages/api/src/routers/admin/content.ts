import { TRPCError } from "@trpc/server";
import { eq, and, asc, sql, like, or } from "drizzle-orm";
import { z } from "zod";
import crypto from "node:crypto";

import { router, adminProcedure } from "../../index";
import {
  courses,
  lessons,
  quizzes,
  questions,
  answers,
  userProgress,
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
  status: contentStatusSchema.default("draft"),
});

const updateCourseSchema = createCourseSchema.partial();

// ─── Lesson ──────────────────────────────────────────────────

const createLessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  videoPublicId: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  order: z.number().int().min(1).optional(),
  status: contentStatusSchema.default("draft"),
});

const updateLessonSchema = createLessonSchema
  .partial()
  .omit({ courseId: true });

// ─── Reorder ─────────────────────────────────────────────────

const reorderLessonsSchema = z.object({
  courseId: z.string().min(1),
  movements: z
    .array(
      z.object({
        id: z.string().min(1),
        order: z.number().int().min(1),
      }),
    )
    .min(1, "Danh sách sắp xếp không được để trống"),
});

// ─── Quiz ───────────────────────────────────────────────────

const upsertQuizSchema = z.object({
  quizId: z.string().optional(),
  lessonId: z.string().min(1),
  title: z.string().min(1, "Tiêu đề bài tập không được để trống"),
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
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { page = 1, pageSize = 20, level, status, search } = input ?? {};
      const offset = (page - 1) * pageSize;

      const whereParts = [];
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
          with: { lessons: { columns: { id: true } } },
        }),
        ctx.db
          .select({ total: sql<number>`count(*)` })
          .from(courses)
          .where(whereClause)
          .limit(1),
      ]);

      const total = Number(countResult[0]?.total ?? 0);

      return {
        items: rows.map((c) => ({ ...c, lessonCount: c.lessons.length })),
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
        status: input.status,
      });

      const created = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, id),
      });
      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tạo khóa học thất bại",
        });
      }
      return created;
    }),

  courseUpdate: adminProcedure
    .input(updateCourseSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;

      const existing = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Khóa học không tồn tại",
        });
      }

      await ctx.db
        .update(courses)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(courses.id, id));

      return ctx.db.query.courses.findFirst({ where: eq(courses.id, id) });
    }),

  courseDelete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const activeLessons = await ctx.db.query.lessons.findMany({
        where: eq(lessons.courseId, input.id),
      });
      if (activeLessons.length > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Không thể xóa khóa học đang có ${activeLessons.length} bài học. Hãy xóa toàn bộ bài học trước.`,
        });
      }

      await ctx.db.delete(courses).where(eq(courses.id, input.id));
      return { deleted: true };
    }),

  // ─── LESSONS ──────────────────────────────────────────────

  lessonCreate: adminProcedure
    .input(createLessonSchema)
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
          .select({ maxOrder: sql<number>`max(${lessons.order})` })
          .from(lessons)
          .where(eq(lessons.courseId, input.courseId))
          .limit(1);
        order = (maxRow[0]?.maxOrder ?? 0) + 1;
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(lessons).values({
        id,
        courseId: input.courseId,
        title: input.title,
        description: input.description ?? null,
        videoPublicId: input.videoPublicId ?? null,
        videoUrl: input.videoUrl ?? null,
        order,
        status: input.status,
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

  lessonReorder: adminProcedure
    .input(reorderLessonsSchema)
    .mutation(async ({ ctx, input }) => {
      const { courseId, movements } = input;

      const validLessons = await ctx.db.query.lessons.findMany({
        where: eq(lessons.courseId, courseId),
        columns: { id: true },
      });
      const validIds = new Set(validLessons.map((l) => l.id));

      for (const m of movements) {
        if (!validIds.has(m.id)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Bài học "${m.id}" không thuộc khóa học này`,
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
            message: `Thứ tự ${order} bị lặp trong payload sắp xếp`,
          });
        }
      }

      const minOrder = Math.min(...movements.map((m) => m.order));
      const reservedBase = -(minOrder + movements.length + 100);

      await ctx.db.transaction(async (tx) => {
        for (let i = 0; i < movements.length; i++) {
          await tx
            .update(lessons)
            .set({ order: reservedBase - i, updatedAt: new Date() })
            .where(
              and(
                eq(lessons.courseId, courseId),
                eq(lessons.id, movements[i]!.id),
              ),
            );
        }

        for (const m of movements) {
          await tx
            .update(lessons)
            .set({ order: m.order, updatedAt: new Date() })
            .where(
              and(
                eq(lessons.courseId, courseId),
                eq(lessons.id, m.id),
              ),
            );
        }
      });

      const reordered = await ctx.db.query.lessons.findMany({
        where: eq(lessons.courseId, courseId),
        orderBy: [asc(lessons.order)],
      });
      return reordered;
    }),

  // ─── QUIZZES ──────────────────────────────────────────────

  quizUpsertStructure: adminProcedure
    .input(upsertQuizSchema)
    .mutation(async ({ ctx, input }) => {
      const { quizId: existingQuizId, lessonId, title, questions: questionsInput } =
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

      const existingLesson = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
      });
      if (!existingLesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài học không tồn tại",
        });
      }

      let resolvedQuizId = existingQuizId;
      const now = new Date();

      await ctx.db.transaction(async (tx) => {
        if (existingQuizId) {
          await tx
            .update(quizzes)
            .set({ title, updatedAt: now })
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
          await tx.insert(quizzes).values({
            id: newId,
            lessonId,
            title,
          });
        }
      });

      if (!resolvedQuizId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tạo bài tập thất bại",
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
            questionId,
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
        where: eq(courses.id, courseId),
        with: {
          lessons: {
            orderBy: [asc(lessons.order)],
            with: {
              quiz: {
                with: {
                  questions: {
                    orderBy: [asc(questions.order)],
                    with: { answers: true },
                  },
                },
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

      return course;
    }),

  // ─── DASHBOARD STATS ──────────────────────────────────────

  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [courseCount, lessonCount, quizCount, userCount] =
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
          .from(userProgress)
          .limit(1),
      ]);

    return {
      totalCourses: Number(courseCount[0]?.count ?? 0),
      totalLessons: Number(lessonCount[0]?.count ?? 0),
      totalQuizzes: Number(quizCount[0]?.count ?? 0),
      totalProgressLogs: Number(userCount[0]?.count ?? 0),
    };
  }),
});

