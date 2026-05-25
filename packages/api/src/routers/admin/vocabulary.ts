import { TRPCError } from "@trpc/server";
import { eq, and, ne, desc, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import crypto from "node:crypto";

import { router, adminProcedure } from "../../index";
import { vocabularies } from "@engducation/db/schema";

// ==========================================
// ZOD SCHEMAS
// ==========================================

const partOfSpeechSchema = z.enum([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "idiom",
  "phrasal_verb",
]);

const createVocabularySchema = z.object({
  courseId: z.string().min(1, "Khóa học không được để trống"),
  moduleId: z.string().optional().nullable(),
  word: z.string().min(1, "Từ gốc không được để trống"),
  partOfSpeech: partOfSpeechSchema,
  phonetics: z.string().min(1, "Phiên âm không được để trống"),
  definition: z.string().min(1, "Định nghĩa không được để trống"),
  translation: z.string().min(1, "Dịch nghĩa không được để trống"),
  example: z.string().min(1, "Ví dụ không được để trống"),
  exampleTranslation: z.string().min(1, "Dịch ví dụ không được để trống"),
  mediaUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
});

const updateVocabularySchema = z.object({
  id: z.string().min(1),
  courseId: z.string().optional(),
  moduleId: z.string().optional().nullable(),
  word: z.string().min(1).optional(),
  partOfSpeech: partOfSpeechSchema.optional(),
  phonetics: z.string().min(1).optional(),
  definition: z.string().min(1).optional(),
  translation: z.string().min(1).optional(),
  example: z.string().min(1).optional(),
  exampleTranslation: z.string().min(1).optional(),
  mediaUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .optional(),
});

const importVocabularySchema = z.object({
  courseId: z.string().min(1, "Khóa học không được để trống"),
  moduleId: z.string().optional().nullable(),
  items: z.array(
    z.object({
      word: z.string().min(1, "Từ gốc không được để trống"),
      partOfSpeech: partOfSpeechSchema,
      phonetics: z.string().min(1, "Phiên âm không được để trống"),
      definition: z.string().min(1, "Định nghĩa không được để trống"),
      translation: z.string().min(1, "Dịch nghĩa không được để trống"),
      example: z.string().min(1, "Ví dụ không được để trống"),
      exampleTranslation: z.string().min(1, "Dịch ví dụ không được để trống"),
      mediaUrl: z
        .string()
        .url()
        .optional()
        .nullable()
        .or(z.literal(""))
        .transform((v) => (v === "" ? null : v)),
    })
  ).min(1, "Danh sách từ vựng import không được để trống"),
});

// ==========================================
// ROUTER
// ==========================================

export const adminVocabularyRouter = router({
  // ─── CREATE ───────────────────────────────────────────────

  create: adminProcedure
    .input(createVocabularySchema)
    .mutation(async ({ ctx, input }) => {
      // Chuẩn hóa: trim + lowercase từ gốc
      const sanitizedWord = input.word.trim().toLowerCase();
      const pos = input.partOfSpeech;

      // Kiểm tra trùng lặp [courseId, word, partOfSpeech] trước khi INSERT
      const existing = await ctx.db.query.vocabularies.findFirst({
        where: and(
          eq(vocabularies.courseId, input.courseId),
          eq(vocabularies.word, sanitizedWord),
          eq(vocabularies.partOfSpeech, pos)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Từ vựng này với từ loại tương ứng đã tồn tại trong khóa học này.",
        });
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(vocabularies).values({
        id,
        courseId: input.courseId,
        moduleId: input.moduleId ?? null,
        word: sanitizedWord,
        partOfSpeech: pos,
        phonetics: input.phonetics.trim(),
        definition: input.definition.trim(),
        translation: input.translation.trim(),
        example: input.example.trim(),
        exampleTranslation: input.exampleTranslation.trim(),
        mediaUrl: input.mediaUrl,
        status: "draft",
      });

      const created = await ctx.db.query.vocabularies.findFirst({
        where: eq(vocabularies.id, id),
      });

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tạo từ vựng thất bại",
        });
      }

      return created;
    }),

  // ─── UPDATE ──────────────────────────────────────────────

  update: adminProcedure
    .input(updateVocabularySchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.vocabularies.findFirst({
        where: eq(vocabularies.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Từ vựng không tồn tại",
        });
      }

      const courseId = input.courseId ?? existing.courseId;

      // Nếu thay đổi word hoặc partOfSpeech → kiểm tra xung đột (loại trừ chính nó)
      if (input.word !== undefined || input.partOfSpeech !== undefined || input.courseId !== undefined) {
        const newWord = (input.word ?? existing.word).trim().toLowerCase();
        const newPos = input.partOfSpeech ?? existing.partOfSpeech;

        const conflict = await ctx.db.query.vocabularies.findFirst({
          where: and(
            eq(vocabularies.courseId, courseId),
            eq(vocabularies.word, newWord),
            eq(vocabularies.partOfSpeech, newPos),
            ne(vocabularies.id, input.id)
          ),
        });

        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Từ vựng này với từ loại tương ứng đã tồn tại trong khóa học.",
          });
        }
      }

      // Cập nhật
      await ctx.db
        .update(vocabularies)
        .set({
          ...(input.courseId !== undefined && { courseId: input.courseId }),
          ...(input.moduleId !== undefined && { moduleId: input.moduleId }),
          ...(input.word !== undefined && { word: input.word.trim().toLowerCase() }),
          ...(input.partOfSpeech !== undefined && { partOfSpeech: input.partOfSpeech }),
          ...(input.phonetics !== undefined && { phonetics: input.phonetics.trim() }),
          ...(input.definition !== undefined && { definition: input.definition.trim() }),
          ...(input.translation !== undefined && { translation: input.translation.trim() }),
          ...(input.example !== undefined && { example: input.example.trim() }),
          ...(input.exampleTranslation !== undefined && { exampleTranslation: input.exampleTranslation.trim() }),
          ...(input.mediaUrl !== undefined && { mediaUrl: input.mediaUrl }),
          updatedAt: new Date(),
        })
        .where(eq(vocabularies.id, input.id));

      return ctx.db.query.vocabularies.findFirst({
        where: eq(vocabularies.id, input.id),
      });
    }),

  // ─── DELETE ───────────────────────────────────────────────

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.vocabularies.findFirst({
        where: eq(vocabularies.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Từ vựng không tồn tại",
        });
      }

      // DB tự cascade delete liên kết userSavedVocabularies
      await ctx.db.delete(vocabularies).where(eq(vocabularies.id, input.id));
      return { deleted: true };
    }),

  // ─── LIST (Admin view) ────────────────────────────────────

  list: adminProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(100).default(20),
          search: z.string().optional(),
          courseId: z.string().optional(),
          moduleId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { page = 1, pageSize = 20, search, courseId, moduleId } = input ?? {};
      const offset = (page - 1) * pageSize;

      const filters: SQL[] = [];
      if (search) {
        filters.push(
          sql`${vocabularies.word} ILIKE ${`%${search.toLowerCase()}%`}`,
        );
      }
      if (courseId) filters.push(eq(vocabularies.courseId, courseId));
      if (moduleId) filters.push(eq(vocabularies.moduleId, moduleId));

      const whereClause = filters.length > 1 ? and(...filters) : filters[0];

      const [items, countResult] = await Promise.all([
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
      ]);

      const total = Number(countResult[0]?.total ?? 0);

      return {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      };
    }),

  // ─── IMPORT FROM EXCEL ────────────────────────────────────

  importFromExcel: adminProcedure
    .input(importVocabularySchema)
    .mutation(async ({ ctx, input }) => {
      const { courseId, moduleId, items } = input;
      const now = new Date();
      const summary = { inserted: 0, skipped: 0, errors: [] as string[] };

      await ctx.db.transaction(async (tx) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]!;
          const sanitizedWord = item.word.trim().toLowerCase();
          const pos = item.partOfSpeech;

          try {
            const existing = await tx.query.vocabularies.findFirst({
              where: and(
                eq(vocabularies.courseId, courseId),
                eq(vocabularies.word, sanitizedWord),
                eq(vocabularies.partOfSpeech, pos)
              ),
            });

            if (existing) {
              summary.skipped++;
              continue;
            }

            await tx.insert(vocabularies).values({
              id: crypto.randomUUID(),
              courseId,
              moduleId: moduleId ?? null,
              word: sanitizedWord,
              partOfSpeech: pos,
              phonetics: item.phonetics.trim(),
              definition: item.definition.trim(),
              translation: item.translation.trim(),
              example: item.example.trim(),
              exampleTranslation: item.exampleTranslation.trim(),
              mediaUrl: item.mediaUrl || null,
              status: "draft",
              createdAt: now,
              updatedAt: now,
            });

            summary.inserted++;
          } catch (err: any) {
            summary.errors.push(`Dòng ${i + 2} (${sanitizedWord}): ${err.message}`);
          }
        }
      });

      return {
        success: summary.errors.length === 0,
        data: summary,
        message: `Import hoàn tất. Thêm mới: ${summary.inserted}, Bỏ qua trùng: ${summary.skipped}, Lỗi: ${summary.errors.length}`,
        code: "SUCCESS"
      };
    }),
});

