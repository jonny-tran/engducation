import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { courseLevelEnum } from "./auth";

// ==========================================
// 1. ENUMS
// ==========================================

/** CEFR language proficiency levels — re-exported from auth for convenience */
export { courseLevelEnum } from "./auth";

/** Admin content lifecycle status */
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
  "archived",
]);

/** Per-lesson learning progress status */
export const progressStatusEnum = pgEnum("progress_status", [
  "learning",
  "completed",
]);

// ==========================================
// 2. STATIC TABLES  (CMS / Admin-authored content)
// ==========================================

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  level: courseLevelEnum("level").notNull(),
  status: contentStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const lessons = pgTable(
  "lessons",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    videoPublicId: text("video_public_id"),
    videoUrl: text("video_url"),
    order: integer("order").notNull(),
    status: contentStatusEnum("status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("lessons_course_order_idx").on(table.courseId, table.order),
  ],
);

export const quizzes = pgTable(
  "quizzes",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("quizzes_lesson_unique_idx").on(table.lessonId),
  ],
);

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  explanation: text("explanation"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const answers = pgTable("answers", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ==========================================
// 3. DYNAMIC / INTERACTION TABLES  (User-generated data)
// ==========================================

export const userProgress = pgTable(
  "user_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    status: progressStatusEnum("status").default("learning").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.lessonId] }),
  ],
);

export const quizAttempts = pgTable("quiz_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  quizId: text("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  selectedAnswers: jsonb("selected_answers").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ==========================================
// 4. RELATIONS
// ==========================================

export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  quiz: one(quizzes, {
    fields: [lessons.id],
    references: [quizzes.lessonId],
  }),
  progressLogs: many(userProgress),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  questions: many(questions),
  attempts: many(quizAttempts),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(user, {
    fields: [userProgress.userId],
    references: [user.id],
  }),
  lesson: one(lessons, {
    fields: [userProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(user, {
    fields: [quizAttempts.userId],
    references: [user.id],
  }),
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
}));

// ==========================================
// 5. VOCABULARY HUB  (Admin CMS + User Interaction)
// ==========================================

/** Từ loại tiếng Anh */
export const partOfSpeechEnum = pgEnum("part_of_speech", [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "idiom",
  "phrasal_verb",
]);

/**
 * Bảng tĩnh chứa kho từ vựng do Admin tạo/quản lý.
 * Mỗi bản ghi là một từ cụ thể ở một từ loại xác định.
 */
export const vocabularies = pgTable(
  "vocabularies",
  {
    id: text("id").primaryKey(),
    word: text("word").notNull(),
    ipa: text("ipa").notNull(),
    partOfSpeech: partOfSpeechEnum("part_of_speech").notNull(),
    meaningVi: text("meaning_vi").notNull(),
    exampleEn: text("example_en").notNull(),
    exampleVi: text("example_vi").notNull(),
    audioUrl: text("audio_url"),
    level: courseLevelEnum("level").notNull(),
    topic: text("topic").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    /**
     * Cho phép cùng một từ tồn tại ở nhiều từ loại khác nhau
     * (ví dụ: "run" là noun khi là danh từ, là verb khi là động từ).
     */
    uniqueIndex("vocabularies_word_part_of_speech_idx").on(
      table.word,
      table.partOfSpeech,
    ),
  ],
);

/**
 * Bảng trung gian lưu trữ từ vựng mà người dùng đã bookmark.
 * Composite primary key đảm bảo mỗi user chỉ bookmark một từ tối đa một lần.
 */
export const userBookmarks = pgTable(
  "user_bookmarks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    vocabularyId: text("vocabulary_id")
      .notNull()
      .references(() => vocabularies.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.vocabularyId] })],
);

// ==========================================
// 5a. VOCABULARY HUB — RELATIONS
// ==========================================

export const vocabulariesRelations = relations(vocabularies, ({ many }) => ({
  bookmarks: many(userBookmarks),
}));

export const userBookmarksRelations = relations(userBookmarks, ({ one }) => ({
  user: one(user, {
    fields: [userBookmarks.userId],
    references: [user.id],
  }),
  vocabulary: one(vocabularies, {
    fields: [userBookmarks.vocabularyId],
    references: [vocabularies.id],
  }),
}));
