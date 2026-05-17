import { TRPCError } from "@trpc/server";
import { eq, and, inArray, asc, sql, type SQL } from "drizzle-orm";
import { z } from "zod";

import { router, protectedProcedure } from "../../index";
import {
  courses,
  lessons,
  quizzes,
  questions,
  answers,
  userProgress,
  quizAttempts,
} from "@engducation/db/schema";

// ==========================================
// SHARED INPUT SCHEMAS
// ==========================================

const courseLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

// ==========================================
// ROUTER
// ==========================================

export const userContentRouter = router({
  // ─── COURSES ─────────────────────────────────────────────

  courseList: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(100).default(12),
          level: courseLevelSchema.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { page = 1, pageSize = 12, level } = input ?? {};
      const offset = (page - 1) * pageSize;

      const filters: SQL[] = [eq(courses.status, "published")];
      if (level) filters.push(eq(courses.level, level));

      const whereClause =
        filters.length > 1 ? and(...filters) : filters[0];

      const [rows, countResult] = await Promise.all([
        ctx.db.query.courses.findMany({
          where: whereClause,
          orderBy: [asc(courses.createdAt)],
          offset,
          limit: pageSize,
          with: {
            lessons: {
              columns: { id: true },
              orderBy: [asc(lessons.order)],
            },
          },
        }),
        ctx.db
          .select({ total: sql<number>`count(*)` })
          .from(courses)
          .where(whereClause)
          .limit(1),
      ]);

      const lessonIds = rows.flatMap((c) => c.lessons.map((l) => l.id));
      const completedRows =
        lessonIds.length > 0
          ? await ctx.db
              .select({ lessonId: userProgress.lessonId })
              .from(userProgress)
              .where(
                and(
                  eq(userProgress.userId, userId),
                  eq(userProgress.status, "completed"),
                  inArray(userProgress.lessonId, lessonIds),
                ),
              )
          : [];

      const completedSet = new Set(completedRows.map((r) => r.lessonId));

      const enriched = rows.map((course) => {
        const totalLessons = course.lessons.length;
        const completedLessons = course.lessons.filter((l) =>
          completedSet.has(l.id),
        ).length;
        return { ...course, totalLessons, completedLessons };
      });

      const total = Number(countResult[0]?.total ?? 0);

      return {
        items: enriched,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  courseGetDetail: protectedProcedure
    .input(z.object({ courseId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { courseId } = input;

      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        with: {
          lessons: { orderBy: [asc(lessons.order)] },
        },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Khóa học không tồn tại",
        });
      }

      if (course.status !== "published") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Khóa học này chưa được xuất bản",
        });
      }

      const lessonIds = course.lessons.map((l) => l.id);
      const progressRows =
        lessonIds.length > 0
          ? await ctx.db.query.userProgress.findMany({
              where: (tbl, { eq: dbEq, and: dbAnd }) =>
                dbAnd(dbEq(tbl.userId, userId), inArray(tbl.lessonId, lessonIds)),
            })
          : [];

      const progressMap = new Map(
        progressRows.map(
          (p) => [p.lessonId, p.status as "learning" | "completed"],
        ),
      );

      const lessonsWithProgress = course.lessons.map((lesson) => ({
        ...lesson,
        progressStatus: progressMap.get(lesson.id) ?? null,
      }));

      return { ...course, lessons: lessonsWithProgress };
    }),

  // ─── LESSONS ─────────────────────────────────────────────

  lessonGetDetail: protectedProcedure
    .input(z.object({ lessonId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const lesson = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, input.lessonId),
        with: {
          course: true,
          quiz: {
            with: {
              questions: {
                orderBy: [asc(questions.order)],
                with: { answers: true },
              },
            },
          },
        },
      });

      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài học không tồn tại",
        });
      }

      if (
        lesson.course.status !== "published" ||
        lesson.status !== "published"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bài học này chưa được xuất bản",
        });
      }

      // ── ANTI-CHEAT: strip correct answers before sending to client ──
      const safeQuiz = lesson.quiz
        ? {
            ...lesson.quiz,
            questions: lesson.quiz.questions.map((q) => ({
              id: q.id,
              content: q.content,
              order: q.order,
              answers: q.answers.map((a) => ({ id: a.id, content: a.content })),
            })),
          }
        : null;

      return { ...lesson, quiz: safeQuiz };
    }),

  lessonGetMediaUrl: protectedProcedure
    .input(z.object({ lessonId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      void ctx.session.user.id; // TODO: Premium gate

      const lesson = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, input.lessonId),
      });

      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài học không tồn tại",
        });
      }

      if (!lesson.videoPublicId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài học này chưa có video",
        });
      }

      const rawUrl = lesson.videoUrl ?? "";
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      let signedUrl = rawUrl;
      if (cloudName && apiSecret && lesson.videoPublicId) {
        const timestamp = Math.floor(Date.now() / 1000) + 3600;
        const paramsToSign = `cloud_name=${cloudName}&eager=true&expiration=${timestamp}&public_id=${lesson.videoPublicId}&timestamp=${timestamp}`;
        const { createHmac } = await import("node:crypto");
        const signature = createHmac("sha256", apiSecret)
          .update(paramsToSign)
          .digest("hex");
        signedUrl =
          `https://res.cloudinary.com/${cloudName}/video/upload/v${timestamp}/${lesson.videoPublicId}` +
          `?expiration=${timestamp}&signature=${signature}&timestamp=${timestamp}`;
      }

      return { url: signedUrl, expiresAt: new Date(Date.now() + 3_600_000) };
    }),

  // ─── PROGRESS ─────────────────────────────────────────────

  trackLessonProgress: protectedProcedure
    .input(
      z.object({
        lessonId: z.string().min(1),
        status: z.enum(["IN_PROGRESS", "COMPLETED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { lessonId, status } = input;

      // Normalize frontend status enum → DB enum
      const dbStatus = status === "IN_PROGRESS" ? "learning" : "completed";

      const lesson = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
      });
      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài học không tồn tại",
        });
      }

      await ctx.db
        .insert(userProgress)
        .values({ userId, lessonId, status: dbStatus })
        .onConflictDoUpdate({
          target: [userProgress.userId, userProgress.lessonId],
          set: { status: dbStatus, updatedAt: new Date() },
        });

      return ctx.db.query.userProgress.findFirst({
        where: and(
          eq(userProgress.userId, userId),
          eq(userProgress.lessonId, lessonId),
        ),
      });
    }),

  // ─── QUIZ ─────────────────────────────────────────────────

  getQuiz: protectedProcedure
    .input(z.object({ lessonId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const quiz = await ctx.db.query.quizzes.findFirst({
        where: eq(quizzes.lessonId, input.lessonId),
        with: {
          questions: {
            orderBy: [asc(questions.order)],
            with: { answers: true },
          },
        },
      });

      if (!quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài tập không tồn tại cho bài học này",
        });
      }

      // Load the lesson to check publication status
      const lesson = await ctx.db.query.lessons.findFirst({
        where: eq(lessons.id, input.lessonId),
        with: { course: true },
      });

      if (
        !lesson ||
        lesson.course.status !== "published" ||
        lesson.status !== "published"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bài tập này chưa được xuất bản",
        });
      }

      // ── ANTI-CHEAT: never send isCorrect or explanation to the client ──
      return {
        id: quiz.id,
        title: quiz.title,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          content: q.content,
          order: q.order,
          answers: q.answers.map((a) => ({ id: a.id, content: a.content })),
        })),
      };
    }),

  submitQuiz: protectedProcedure
    .input(
      z.object({
        lessonId: z.string().min(1),
        answers: z
          .array(
            z.object({
              questionId: z.string().min(1),
              selectedOption: z.enum(["A", "B", "C", "D"]),
            }),
          )
          .min(1, "Danh sách câu trả lời không được để trống"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { lessonId, answers: submittedAnswers } = input;

      // ── Step 1: Resolve lesson → quiz ──────────────────────
      const quiz = await ctx.db.query.quizzes.findFirst({
        where: eq(quizzes.lessonId, lessonId),
        with: {
          lesson: { with: { course: true } },
          questions: {
            with: {
              answers: {
                orderBy: [asc(answers.id)],
              },
            },
          },
        },
      });

      if (!quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bài tập không tồn tại",
        });
      }

      if (
        quiz.lesson.course.status !== "published" ||
        quiz.lesson.status !== "published"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bài tập này chưa được xuất bản",
        });
      }

      // ── Step 2: Build canonical maps (server-only) ──────────
      type CanonicalAnswer = {
        id: string;
        content: string;
        isCorrect: boolean;
      };
      const questionMap = new Map<
        string,
        { id: string; content: string; explanation: string | null; answers: CanonicalAnswer[] }
      >();

      for (const q of quiz.questions) {
        questionMap.set(q.id, {
          id: q.id,
          content: q.content,
          explanation: q.explanation,
          answers: q.answers.map((a) => ({
            id: a.id,
            content: a.content,
            isCorrect: a.isCorrect,
          })),
        });
      }

      // ── Step 3: Map client option labels ("A","B","C","D") → answer UUIDs ──
      // We accept answers ordered by creation; map by position when client sends "A","B","C","D"
      const OPTION_ORDER = ["A", "B", "C", "D"] as const;

      function mapOptionToAnswerId(
        questionAnswers: CanonicalAnswer[],
        option: "A" | "B" | "C" | "D",
      ): string | null {
        const answerList = questionAnswers;
        const optionIndex = OPTION_ORDER.indexOf(option);
        return answerList[optionIndex]?.id ?? null;
      }

      const selectedAnswerMap = new Map<string, string>();
      for (const a of submittedAnswers) {
        const canonical = questionMap.get(a.questionId);
        if (!canonical) continue;
        const answerId = mapOptionToAnswerId(canonical.answers, a.selectedOption);
        if (answerId) selectedAnswerMap.set(a.questionId, answerId);
      }

      // ── Step 4: Score strictly on the server ────────────────
      let correctCount = 0;
      const answerResults: {
        questionId: string;
        selectedOption: "A" | "B" | "C" | "D";
        selectedAnswerId: string;
        isCorrect: boolean;
        correctOption: "A" | "B" | "C" | "D";
        explanation: string | null;
      }[] = [];

      for (const [qId, question] of questionMap) {
        const selectedAnswerId = selectedAnswerMap.get(qId) ?? null;
        const correctAnswer = question.answers.find((a) => a.isCorrect);
        const correctOption =
          correctAnswer
            ? (OPTION_ORDER[question.answers.findIndex((a) => a.isCorrect)] ?? null)
            : null;

        if (!selectedAnswerId) {
          answerResults.push({
            questionId: qId,
            selectedOption: "A",
            selectedAnswerId: "",
            isCorrect: false,
            correctOption: correctOption ?? "A",
            explanation: question.explanation,
          });
          continue;
        }

        const selectedAnswer = question.answers.find(
          (a) => a.id === selectedAnswerId,
        );
        const isCorrect = selectedAnswer?.isCorrect === true;
        if (isCorrect) correctCount++;

        const selectedOptionIndex = question.answers.findIndex(
          (a) => a.id === selectedAnswerId,
        );
        const selectedOption =
          selectedOptionIndex >= 0
            ? (OPTION_ORDER[selectedOptionIndex] ?? "A")
            : "A";

        answerResults.push({
          questionId: qId,
          selectedOption,
          selectedAnswerId,
          isCorrect,
          correctOption: correctOption ?? "A",
          explanation: question.explanation,
        });
      }

      const totalQuestions = quiz.questions.length;
      const score =
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;

      // ── Step 5: Freeze snapshot (JSONB) ────────────────────
      const snapshot = answerResults.map((r) => {
        const canonicalQ = questionMap.get(r.questionId)!;
        const selectedA = canonicalQ.answers.find(
          (a) => a.id === r.selectedAnswerId,
        );
        return {
          questionId: r.questionId,
          questionContent: canonicalQ.content,
          selectedOption: r.selectedOption,
          selectedAnswerContent: selectedA?.content ?? "",
          isCorrect: r.isCorrect,
          explanation: r.explanation,
        };
      });

      // ── Step 6: Persist attempt ────────────────────────────
      const attemptId = crypto.randomUUID();
      await ctx.db.insert(quizAttempts).values({
        id: attemptId,
        userId,
        quizId: quiz.id,
        score,
        selectedAnswers: snapshot as unknown,
      });

      // ── Step 7: Auto-complete lesson when score >= 70% ─────
      if (score >= 70) {
        await ctx.db
          .insert(userProgress)
          .values({ userId, lessonId: quiz.lesson.id, status: "completed" })
          .onConflictDoUpdate({
            target: [userProgress.userId, userProgress.lessonId],
            set: { status: "completed", updatedAt: new Date() },
          });
      }

      return {
        attemptId,
        score,
        totalQuestions,
        correctCount,
        passed: score >= 70,
        results: answerResults,
      };
    }),

  quizAttemptsHistory: protectedProcedure
    .input(z.object({ quizId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.db.query.quizAttempts.findMany({
        where: and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.quizId, input.quizId),
        ),
        orderBy: [asc(quizAttempts.createdAt)],
      });
    }),
});
