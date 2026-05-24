import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql, inArray, type SQL } from "drizzle-orm";
import { z } from "zod";

import { router, protectedProcedure } from "../../index";
import { vocabularies, userSavedVocabularies, userEnrollments } from "@engducation/db/schema";

// ==========================================
// ZOD SCHEMAS
// ==========================================

const listVocabularySchema = z.object({
  courseId: z.string().min(1, "Khóa học không được để trống"),
  moduleId: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const notebookSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// ==========================================
// ROUTER
// ==========================================

export const userVocabularyRouter = router({
  // ─── LIST (Flashcards of a Course/Module) ──────────────────

  list: protectedProcedure
    .input(listVocabularySchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { courseId, moduleId, page = 1, pageSize = 20, search } = input;
      const offset = (page - 1) * pageSize;

      // 1. Kiểm tra đăng ký khóa học
      const enrollment = await ctx.db.query.userEnrollments.findFirst({
        where: and(
          eq(userEnrollments.userId, userId),
          eq(userEnrollments.courseId, courseId)
        ),
      });

      if (!enrollment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bạn phải đăng ký khóa học này để truy cập từ vựng.",
        });
      }

      // 2. Build filters
      const filters: SQL[] = [
        eq(vocabularies.courseId, courseId),
        eq(vocabularies.status, "published"),
      ];
      if (moduleId) {
        filters.push(eq(vocabularies.moduleId, moduleId));
      }
      if (search) {
        filters.push(
          sql`${vocabularies.word} ILIKE ${`%${search.toLowerCase()}%`}`
        );
      }

      const whereClause = filters.length > 1 ? and(...filters) : filters[0];

      // 3. Query vocabularies & count
      const [items, countResult, savedVocabs] = await Promise.all([
        ctx.db.query.vocabularies.findMany({
          where: whereClause,
          orderBy: [desc(vocabularies.createdAt)],
          offset,
          limit: pageSize,
        }),
        ctx.db
          .select({ total: sql<number>`count(*)` })
          .from(vocabularies)
          .where(whereClause)
          .limit(1),
        ctx.db
          .select({ vocabularyId: userSavedVocabularies.vocabularyId, isMastered: userSavedVocabularies.isMastered })
          .from(userSavedVocabularies)
          .where(eq(userSavedVocabularies.userId, userId)),
      ]);

      const total = Number(countResult[0]?.total ?? 0);

      // 4. Map isSaved và isMastered
      const savedVocabMap = new Map(savedVocabs.map((sv) => [sv.vocabularyId, sv.isMastered]));

      const enriched = items.map((item) => {
        const isSaved = savedVocabMap.has(item.id);
        const isMastered = savedVocabMap.get(item.id) ?? false;
        return {
          ...item,
          isSaved,
          isMastered,
        };
      });

      return {
        items: enriched,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      };
    }),

  // ─── TOGGLE SAVE TO NOTEBOOK ──────────────────────────────

  toggleSave: protectedProcedure
    .input(z.object({ vocabularyId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { vocabularyId } = input;

      const vocab = await ctx.db.query.vocabularies.findFirst({
        where: eq(vocabularies.id, vocabularyId),
      });

      if (!vocab) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Từ vựng không tồn tại",
        });
      }

      const existing = await ctx.db.query.userSavedVocabularies.findFirst({
        where: and(
          eq(userSavedVocabularies.userId, userId),
          eq(userSavedVocabularies.vocabularyId, vocabularyId)
        ),
      });

      if (existing) {
        await ctx.db
          .delete(userSavedVocabularies)
          .where(
            and(
              eq(userSavedVocabularies.userId, userId),
              eq(userSavedVocabularies.vocabularyId, vocabularyId)
            )
          );
        return { saved: false };
      }

      await ctx.db.insert(userSavedVocabularies).values({
        userId,
        vocabularyId,
        isMastered: false,
      });

      return { saved: true };
    }),

  // ─── GET PERSONAL NOTEBOOK ────────────────────────────────

  getPersonalNotebook: protectedProcedure
    .input(notebookSchema.optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { page = 1, pageSize = 20, search } = input ?? {};
      const offset = (page - 1) * pageSize;

      // 1. Query all saved vocabularies for this user to filter and paginate
      const extras: SQL[] = [eq(userSavedVocabularies.userId, userId)];
      
      let joinWhere = and(...extras);
      if (search) {
        joinWhere = and(
          eq(userSavedVocabularies.userId, userId),
          sql`${vocabularies.word} ILIKE ${`%${search.toLowerCase()}%`}`
        );
      }

      // Query matched records
      const allSaved = await ctx.db
        .select({
          vocabularyId: userSavedVocabularies.vocabularyId,
          isMastered: userSavedVocabularies.isMastered,
          createdAt: userSavedVocabularies.createdAt,
        })
        .from(userSavedVocabularies)
        .innerJoin(vocabularies, eq(userSavedVocabularies.vocabularyId, vocabularies.id))
        .where(joinWhere)
        .orderBy(desc(userSavedVocabularies.createdAt));

      const total = allSaved.length;
      const paginatedSaved = allSaved.slice(offset, offset + pageSize);
      const vocabIds = paginatedSaved.map((s) => s.vocabularyId);

      // 2. Query full details from vocabularies
      const details = vocabIds.length > 0
        ? await ctx.db
            .select()
            .from(vocabularies)
            .where(inArray(vocabularies.id, vocabIds))
        : [];

      const detailsMap = new Map(details.map((d) => [d.id, d]));

      const items = paginatedSaved
        .map((s) => {
          const detail = detailsMap.get(s.vocabularyId);
          if (!detail) return null;
          return {
            ...detail,
            isSaved: true,
            isMastered: s.isMastered,
          };
        })
        .filter((i): i is NonNullable<typeof i> => i !== null);

      return {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      };
    }),

  // ─── UPDATE NOTEBOOK STATUS (Quizlet-like Study) ──────────

  updateNotebookStatus: protectedProcedure
    .input(
      z.object({
        vocabularyId: z.string().min(1),
        isMastered: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { vocabularyId, isMastered } = input;

      const existing = await ctx.db.query.userSavedVocabularies.findFirst({
        where: and(
          eq(userSavedVocabularies.userId, userId),
          eq(userSavedVocabularies.vocabularyId, vocabularyId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Từ vựng chưa được lưu trong sổ tay cá nhân của bạn.",
        });
      }

      await ctx.db
        .update(userSavedVocabularies)
        .set({ isMastered })
        .where(
          and(
            eq(userSavedVocabularies.userId, userId),
            eq(userSavedVocabularies.vocabularyId, vocabularyId)
          )
        );

      return { success: true };
    }),
});
