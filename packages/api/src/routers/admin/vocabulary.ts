import { TRPCError } from "@trpc/server";
import { eq, and, ne, desc, sql, type SQL } from "drizzle-orm";
import { z } from "zod";

import { router, adminProcedure } from "../../index";
import { vocabularies } from "@engducation/db/schema";

// ==========================================
// ZOD SCHEMAS
// ==========================================

const courseLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
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
  word: z.string().min(1, "Từ gốc không được để trống"),
  ipa: z.string().min(1, "Phiên âm không được để trống"),
  partOfSpeech: partOfSpeechSchema,
  meaningVi: z.string().min(1, "Nghĩa tiếng Việt không được để trống"),
  exampleEn: z.string().min(1, "Câu ví dụ tiếng Anh không được để trống"),
  exampleVi: z.string().min(1, "Bản dịch câu ví dụ không được để trống"),
  audioUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
  level: courseLevelSchema,
  topic: z.string().min(1, "Chủ đề không được để trống"),
});

const updateVocabularySchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1).optional(),
  ipa: z.string().min(1).optional(),
  partOfSpeech: partOfSpeechSchema.optional(),
  meaningVi: z.string().min(1).optional(),
  exampleEn: z.string().min(1).optional(),
  exampleVi: z.string().min(1).optional(),
  audioUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .optional(),
  level: courseLevelSchema.optional(),
  topic: z.string().min(1).optional(),
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
      const pos = input.partOfSpeech as z.infer<typeof partOfSpeechSchema>;

      // Kiểm tra trùng lặp [word, partOfSpeech] trước khi INSERT
      const existing = await ctx.db.query.vocabularies.findFirst({
        where: and(eq(vocabularies.word, sanitizedWord), eq(vocabularies.partOfSpeech, pos)),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Từ vựng này với từ loại tương ứng đã tồn tại trong hệ thống.",
        });
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(vocabularies).values({
        id,
        word: sanitizedWord,
        ipa: input.ipa.trim(),
        partOfSpeech: pos,
        meaningVi: input.meaningVi.trim(),
        exampleEn: input.exampleEn.trim(),
        exampleVi: input.exampleVi.trim(),
        audioUrl: input.audioUrl,
        level: input.level,
        topic: input.topic.trim(),
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

      // Nếu thay đổi word hoặc partOfSpeech → kiểm tra xung đột (loại trừ chính nó)
      if (input.word !== undefined || input.partOfSpeech !== undefined) {
        const newWord = input.word!.trim().toLowerCase();
        const newPos = input.partOfSpeech ?? existing.partOfSpeech;

        const conflict = await ctx.db.query.vocabularies.findFirst({
          where: and(
            eq(vocabularies.word, newWord),
            eq(vocabularies.partOfSpeech, newPos),
            ne(vocabularies.id, input.id),
          ),
        });

        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Từ vựng này với từ loại tương ứng đã tồn tại trong hệ thống.",
          });
        }
      }

      // Xây dựng object cập nhật tường minh theo từng trường
      await ctx.db
        .update(vocabularies)
        .set({
          ...(input.word !== undefined && { word: input.word.trim().toLowerCase() }),
          ...(input.ipa !== undefined && { ipa: input.ipa.trim() }),
          ...(input.partOfSpeech !== undefined && { partOfSpeech: input.partOfSpeech }),
          ...(input.meaningVi !== undefined && { meaningVi: input.meaningVi.trim() }),
          ...(input.exampleEn !== undefined && { exampleEn: input.exampleEn.trim() }),
          ...(input.exampleVi !== undefined && { exampleVi: input.exampleVi.trim() }),
          ...(input.audioUrl !== undefined && { audioUrl: input.audioUrl }),
          ...(input.level !== undefined && { level: input.level }),
          ...(input.topic !== undefined && { topic: input.topic.trim() }),
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

      // Cascade delete: DB tự dọn sạch user_bookmarks liên quan
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
          level: courseLevelSchema.optional(),
          topic: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { page = 1, pageSize = 20, search, level, topic } = input ?? {};
      const offset = (page - 1) * pageSize;

      const filters: SQL[] = [];
      if (search) {
        filters.push(
          sql`${vocabularies.word} ILIKE ${`%${search.toLowerCase()}%`}`,
        );
      }
      if (level) filters.push(eq(vocabularies.level, level));
      if (topic) filters.push(eq(vocabularies.topic, topic));

      // and() nhận rest params, không phải array
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
});
