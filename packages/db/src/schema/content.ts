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
  price: integer("price").default(0).notNull(),
  certificateTemplateUrl: text("certificate_template_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const modules = pgTable(
  "modules",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
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
    uniqueIndex("modules_course_order_idx").on(table.courseId, table.order),
  ],
);

export const lessons = pgTable(
  "lessons",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
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
    uniqueIndex("lessons_module_order_idx").on(table.moduleId, table.order),
  ],
);

export const quizzes = pgTable(
  "quizzes",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
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
    uniqueIndex("quizzes_module_order_idx").on(table.moduleId, table.order),
  ],
);

export const writingAssignments = pgTable(
  "writing_assignments",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    rubric: text("rubric").notNull(),
    wordLimit: integer("word_limit"),
    suggestedAnswer: text("suggested_answer"),
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
    uniqueIndex("writing_assignments_module_order_idx").on(
      table.moduleId,
      table.order,
    ),
  ],
);

export const writingSubmissions = pgTable(
  "writing_submissions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    writingId: text("writing_id")
      .notNull()
      .references(() => writingAssignments.id, { onDelete: "cascade" }),
    essay: text("essay").notNull(),
    score: integer("score"),
    feedback: jsonb("feedback"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
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
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .references(() => lessons.id, { onDelete: "cascade" }),
    quizId: text("quiz_id")
      .references(() => quizzes.id, { onDelete: "cascade" }),
    writingId: text("writing_id")
      .references(() => writingAssignments.id, { onDelete: "cascade" }),
    status: progressStatusEnum("status").default("learning").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_progress_user_lesson_idx").on(table.userId, table.lessonId),
    uniqueIndex("user_progress_user_quiz_idx").on(table.userId, table.quizId),
    uniqueIndex("user_progress_user_writing_idx").on(table.userId, table.writingId),
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
  modules: many(modules),
  vocabularies: many(vocabularies),
  enrollments: many(userEnrollments),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
  quizzes: many(quizzes),
  writingAssignments: many(writingAssignments),
  vocabularies: many(vocabularies),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  progressLogs: many(userProgress),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  module: one(modules, {
    fields: [quizzes.moduleId],
    references: [modules.id],
  }),
  questions: many(questions),
  attempts: many(quizAttempts),
  progressLogs: many(userProgress),
}));

export const writingAssignmentsRelations = relations(writingAssignments, ({ one, many }) => ({
  module: one(modules, {
    fields: [writingAssignments.moduleId],
    references: [modules.id],
  }),
  submissions: many(writingSubmissions),
  progressLogs: many(userProgress),
}));

export const writingSubmissionsRelations = relations(writingSubmissions, ({ one }) => ({
  user: one(user, {
    fields: [writingSubmissions.userId],
    references: [user.id],
  }),
  writingAssignment: one(writingAssignments, {
    fields: [writingSubmissions.writingId],
    references: [writingAssignments.id],
  }),
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
  quiz: one(quizzes, {
    fields: [userProgress.quizId],
    references: [quizzes.id],
  }),
  writingAssignment: one(writingAssignments, {
    fields: [userProgress.writingId],
    references: [writingAssignments.id],
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
 * Bảng tĩnh chứa kho từ vựng do Admin tạo/quản lý (Flashcard nâng cao).
 */
export const vocabularies = pgTable(
  "vocabularies",
  {
    id: text("id").primaryKey(),
    word: text("word").notNull(),
    partOfSpeech: partOfSpeechEnum("part_of_speech").notNull(),
    phonetics: text("phonetics").notNull(),
    definition: text("definition").notNull(),
    translation: text("translation").notNull(),
    example: text("example").notNull(),
    exampleTranslation: text("example_translation").notNull(),
    mediaUrl: text("media_url"),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    moduleId: text("module_id")
      .references(() => modules.id, { onDelete: "cascade" }),
    status: contentStatusEnum("status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("vocabularies_course_word_part_of_speech_idx").on(
      table.courseId,
      table.word,
      table.partOfSpeech,
    ),
  ],
);

/**
 * Bảng trung gian ghi nhận các khóa học người dùng đã đăng ký học.
 */
export const userEnrollments = pgTable(
  "user_enrollments",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.courseId] })],
);

/**
 * Bảng trung gian lưu vết từ vựng cá nhân phục vụ ôn tập (Sổ tay Quizlet-like).
 */
export const userSavedVocabularies = pgTable(
  "user_saved_vocabularies",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    vocabularyId: text("vocabulary_id")
      .notNull()
      .references(() => vocabularies.id, { onDelete: "cascade" }),
    isMastered: boolean("is_mastered").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.vocabularyId] })],
);

// ==========================================
// 5a. VOCABULARY HUB — RELATIONS
// ==========================================

export const vocabulariesRelations = relations(vocabularies, ({ one, many }) => ({
  course: one(courses, {
    fields: [vocabularies.courseId],
    references: [courses.id],
  }),
  module: one(modules, {
    fields: [vocabularies.moduleId],
    references: [modules.id],
  }),
  savedUsers: many(userSavedVocabularies),
}));

export const userEnrollmentsRelations = relations(userEnrollments, ({ one }) => ({
  user: one(user, {
    fields: [userEnrollments.userId],
    references: [user.id],
  }),
  course: one(courses, {
    fields: [userEnrollments.courseId],
    references: [courses.id],
  }),
}));

export const userSavedVocabulariesRelations = relations(userSavedVocabularies, ({ one }) => ({
  user: one(user, {
    fields: [userSavedVocabularies.userId],
    references: [user.id],
  }),
  vocabulary: one(vocabularies, {
    fields: [userSavedVocabularies.vocabularyId],
    references: [vocabularies.id],
  }),
}));
