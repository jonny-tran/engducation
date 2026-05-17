import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql, inArray, type SQL } from "drizzle-orm";
import { z } from "zod";

import { router, publicProcedure, protectedProcedure } from "../../index";
import { vocabularies, userBookmarks } from "@engducation/db/schema";

// ==========================================
// ZOD SCHEMAS
// ==========================================

const courseLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

const listVocabularySchema = z.object({
  search: z.string().optional(),
  level: courseLevelSchema.optional(),
  topic: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// ==========================================
// HELPERS
// ==========================================

function buildFilters(input: z.input<typeof listVocabularySchema>): SQL<unknown>[] {
  const parts: SQL<unknown>[] = [];
  if (input.search) {
    parts.push(sql`${vocabularies.word} ILIKE ${`%${input.search.toLowerCase()}%`}`);
  }
  if (input.level) parts.push(eq(vocabularies.level, input.level));
  if (input.topic) parts.push(eq(vocabularies.topic, input.topic));
  return parts;
}

// Drizzle's `and()` trả về tuple type gây lỗi spread inference khi dùng trong
// `.where()` của joined query. Helper này gom N filter thành 1 SQL expression
// bằng cách gọi `and()` với tối đa 4 tham số trực tiếp (không spread).
function buildWhereClause(f: SQL<unknown>[]): SQL<unknown> | undefined {
  if (f.length === 0) return undefined;
  if (f.length === 1) return f[0]!;
  if (f.length === 2) return and(f[0]!, f[1]!);
  if (f.length === 3) return and(f[0]!, f[1]!, f[2]!);
  return and(f[0]!, f[1]!, f[2]!, f[3]!);
}

// ==========================================
// ROUTER
// ==========================================

export const userVocabularyRouter = router({
  // ─── LIST (Public + Authenticated) ────────────────────────

  list: publicProcedure
    .input(listVocabularySchema.optional())
    .query(async ({ ctx, input }) => {
      const { page = 1, pageSize = 20, search, level, topic } = input ?? {};
      const offset = (page - 1) * pageSize;

      const extras = buildFilters({ search, level, topic, page, pageSize });
      const whereClause = buildWhereClause(extras);

      // Truy vấn song song: danh sách + đếm tổng
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

      // Hydration: nếu chưa đăng nhập → isBookmarked = false
      const enriched = items.map((item) => ({ ...item, isBookmarked: false }));

      // Nếu có session → đối chiếu với user_bookmarks trong 1 query duy nhất
      if (ctx.session?.user) {
        const userId = ctx.session.user.id;
        const vocabIds = items.map((i) => i.id);

        if (vocabIds.length > 0) {
          const bookmarks = await ctx.db
            .select({ vocabularyId: userBookmarks.vocabularyId })
            .from(userBookmarks)
            .where(
              and(
                eq(userBookmarks.userId, userId),
                inArray(userBookmarks.vocabularyId, vocabIds),
              ),
            );

          const bookmarkedIdsSet = new Set(bookmarks.map((b) => b.vocabularyId));

          for (let i = 0; i < enriched.length; i++) {
            enriched[i]!.isBookmarked = bookmarkedIdsSet.has(enriched[i]!.id);
          }
        }
      }

      return {
        items: enriched,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      };
    }),

  // ─── TOGGLE BOOKMARK ─────────────────────────────────────

  toggleBookmark: protectedProcedure
    .input(z.object({ vocabularyId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { vocabularyId } = input;

      // Xác minh từ vựng tồn tại trong hệ thống
      const vocab = await ctx.db.query.vocabularies.findFirst({
        where: eq(vocabularies.id, vocabularyId),
      });

      if (!vocab) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Từ vựng không tồn tại",
        });
      }

      // Kiểm tra bản ghi bookmark hiện tại
      const existing = await ctx.db.query.userBookmarks.findFirst({
        where: and(
          eq(userBookmarks.userId, userId),
          eq(userBookmarks.vocabularyId, vocabularyId),
        ),
      });

      if (existing) {
        // Đã bookmark → xóa (hủy đánh dấu)
        await ctx.db
          .delete(userBookmarks)
          .where(
            and(
              eq(userBookmarks.userId, userId),
              eq(userBookmarks.vocabularyId, vocabularyId),
            ),
          );
        return { bookmarked: false };
      }

      // Chưa bookmark → tạo mới (đánh dấu)
      await ctx.db.insert(userBookmarks).values({ userId, vocabularyId });

      return { bookmarked: true };
    }),

  // ─── GET PERSONAL NOTEBOOK ────────────────────────────────

  getPersonalNotebook: protectedProcedure
    .input(listVocabularySchema.optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { page = 1, pageSize = 20, search, level, topic } = input ?? {};

      const offset = (page - 1) * pageSize;
      const extras = buildFilters({ search, level, topic, page, pageSize });

      // Ghép userId + extras: tối đa 4 filter → buildWhereClause xử lý an toàn về type
      const whereClause = buildWhereClause([eq(userBookmarks.userId, userId), ...extras]);

      // Bước 1: Lấy toàn bộ bookmark IDs (sắp xếp theo bookmark mới nhất)
      // Cast to `any` để bypass Drizzle's strict functional `.where()` overloads
      // cho joined query (runtime hoạt động bình thường)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allBookmarks = await (ctx.db
        .select({ vocabularyId: userBookmarks.vocabularyId })
        .from(userBookmarks)
        .innerJoin(vocabularies, eq(userBookmarks.vocabularyId, vocabularies.id))
        .where(whereClause as any) as any) as { vocabularyId: string }[];

      const total = allBookmarks.length;
      const paginatedIds = allBookmarks
        .slice(offset, offset + pageSize)
        .map((b) => b.vocabularyId);

      // Bước 2: Lấy chi tiết vocabularies theo IDs đã phân trang
      const items =
        paginatedIds.length > 0
          ? await ctx.db
              .select({
                id: vocabularies.id,
                word: vocabularies.word,
                ipa: vocabularies.ipa,
                partOfSpeech: vocabularies.partOfSpeech,
                meaningVi: vocabularies.meaningVi,
                exampleEn: vocabularies.exampleEn,
                exampleVi: vocabularies.exampleVi,
                audioUrl: vocabularies.audioUrl,
                level: vocabularies.level,
                topic: vocabularies.topic,
                createdAt: vocabularies.createdAt,
                updatedAt: vocabularies.updatedAt,
              })
              .from(vocabularies)
              .where(inArray(vocabularies.id, paginatedIds))
          : [];

      // Duy trì thứ tự bookmark gốc bằng Map
      const orderMap = new Map(items.map((v) => [v.id, v]));
      const ordered = paginatedIds
        .map((id) => orderMap.get(id))
        .filter((v): v is NonNullable<typeof v> => v !== undefined)
        .map((v) => ({ ...v, isBookmarked: true }));

      return {
        items: ordered,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      };
    }),
});
