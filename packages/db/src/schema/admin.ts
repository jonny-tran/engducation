import { relations } from "drizzle-orm";
import { pgTable, text, integer, doublePrecision, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { courses, writingAssignments, writingSubmissions } from "./content";

// ==========================================
// 1. AI PROMPTS CONFIGURATION
// ==========================================
export const aiPrompts = pgTable("ai_prompts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template").notNull(),
  temperature: doublePrecision("temperature").default(0.7).notNull(),
  maxTokens: integer("max_tokens").default(2000).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiPromptsRelations = relations(aiPrompts, ({ many }) => ({
  writingAssignments: many(writingAssignments),
}));

// ==========================================
// 2. AI USAGE LOGS (Append-Only)
// ==========================================
export const aiLogs = pgTable("ai_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  writingId: text("writing_id")
    .notNull()
    .references(() => writingAssignments.id, { onDelete: "cascade" }),
  tokensUsed: integer("tokens_used").default(0).notNull(),
  cost: doublePrecision("cost").default(0.0).notNull(),
  status: text("status").notNull(), // "success", "failed"
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiLogsRelations = relations(aiLogs, ({ one }) => ({
  user: one(user, {
    fields: [aiLogs.userId],
    references: [user.id],
  }),
  writingAssignment: one(writingAssignments, {
    fields: [aiLogs.writingId],
    references: [writingAssignments.id],
  }),
}));

// ==========================================
// 3. COURSE ORDERS & PAYMENTS (Append-Only Status Updates)
// ==========================================
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: text("status").default("pending").notNull(), // "pending", "success", "failed"
  paymentMethod: text("payment_method").notNull(), // "MANUAL_BANK_TRANSFER"
  notes: text("notes"),
  approvedById: text("approved_by_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  course: one(courses, {
    fields: [orders.courseId],
    references: [courses.id],
  }),
  approvedBy: one(user, {
    fields: [orders.approvedById],
    references: [user.id],
  }),
}));

// ==========================================
// 4. USER COURSE OWNERSHIPS & ACCESS SUBSCRIPTIONS
// ==========================================
export const userCourses = pgTable("user_courses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  activatedAt: timestamp("activated_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }), // null = lifetime
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userCoursesRelations = relations(userCourses, ({ one }) => ({
  user: one(user, {
    fields: [userCourses.userId],
    references: [user.id],
  }),
  course: one(courses, {
    fields: [userCourses.courseId],
    references: [courses.id],
  }),
}));

// ==========================================
// 5. HUMAN-IN-THE-LOOP WRITING REVIEW TICKETS
// ==========================================
export const writingReviewTickets = pgTable("writing_review_tickets", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id")
    .notNull()
    .references(() => writingSubmissions.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  writingId: text("writing_id")
    .notNull()
    .references(() => writingAssignments.id, { onDelete: "cascade" }),
  originalEssay: text("original_essay").notNull(),
  aiFeedback: jsonb("ai_feedback").notNull(),
  userMessage: text("user_message").notNull(),
  status: text("status").default("pending").notNull(), // "pending", "resolved"
  teacherEssay: text("teacher_essay"),
  teacherScore: integer("teacher_score"),
  teacherFeedback: text("teacher_feedback"),
  resolvedById: text("resolved_by_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const writingReviewTicketsRelations = relations(writingReviewTickets, ({ one }) => ({
  submission: one(writingSubmissions, {
    fields: [writingReviewTickets.submissionId],
    references: [writingSubmissions.id],
  }),
  user: one(user, {
    fields: [writingReviewTickets.userId],
    references: [user.id],
  }),
  writingAssignment: one(writingAssignments, {
    fields: [writingReviewTickets.writingId],
    references: [writingAssignments.id],
  }),
  resolvedBy: one(user, {
    fields: [writingReviewTickets.resolvedById],
    references: [user.id],
  }),
}));

// ==========================================
// 6. ADMIN SYSTEM AUDIT LOGS (Append-Only)
// ==========================================
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: text("id").primaryKey(),
  adminId: text("admin_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  action: text("action").notNull(), // e.g. "CREATE_PROMPT", "BAN_USER", "APPROVE_ORDER"
  targetTable: text("target_table").notNull(),
  targetId: text("target_id").notNull(),
  oldPayload: text("old_payload"), // JSON String
  newPayload: text("new_payload"), // JSON String
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  admin: one(user, {
    fields: [adminAuditLogs.adminId],
    references: [user.id],
  }),
}));

// ==========================================
// 7. VOUCHERS & DISCOUNTS
// ==========================================
export const vouchers = pgTable("vouchers", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  maxUses: integer("max_uses").default(100).notNull(),
  usesCount: integer("uses_count").default(0).notNull(),
  status: text("status").default("active").notNull(), // "active", "inactive"
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
