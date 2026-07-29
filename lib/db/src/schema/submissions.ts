import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().default(1),
  platformId: text("platform_id").notNull(),
  platformName: text("platform_name").notNull(),
  problemName: text("problem_name").notNull(),
  problemUrl: text("problem_url"),
  difficulty: text("difficulty"), // easy | medium | hard | null
  topic: text("topic"),
  language: text("language"),
  status: text("status").notNull().default("accepted"), // accepted | wrong_answer | time_limit | runtime_error | compilation_error | unknown
  isContest: boolean("is_contest").notNull().default(false),
  timeTakenMs: integer("time_taken_ms"),
  solvedAt: timestamp("solved_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
