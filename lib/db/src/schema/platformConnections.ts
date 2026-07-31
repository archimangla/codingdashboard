import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const platformConnectionsTable = pgTable("platform_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().default(1),
  platformId: text("platform_id").notNull(),
  handle: text("handle").notNull(),
  syncStatus: text("sync_status").notNull().default("idle"), // idle | syncing | error
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  // Aggregate stats reported directly by a platform's adapter. Some
  // platforms (e.g. GeeksforGeeks) can only ever provide an aggregate
  // solved count / rank -- they have no dated per-problem submission
  // history available publicly, so there's nothing to insert into
  // submissionsTable for them. Without storing these here, that data
  // has nowhere to go and silently disappears after every sync.
  totalSolved: integer("total_solved"),
  ranking: integer("ranking"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("platform_connections_user_platform_uidx").on(t.userId, t.platformId),
]);

export const insertPlatformConnectionSchema = createInsertSchema(platformConnectionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlatformConnection = z.infer<typeof insertPlatformConnectionSchema>;
export type PlatformConnection = typeof platformConnectionsTable.$inferSelect;
