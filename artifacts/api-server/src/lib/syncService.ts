import { db, submissionsTable, platformConnectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ADAPTER_MAP } from "./platforms/index.js";
import { logger } from "./logger.js";

export async function syncPlatform(userId: number, platformId: string, handle: string) {
  const adapter = ADAPTER_MAP.get(platformId);
  if (!adapter) {
    return { status: "error" as const, newSubmissions: 0, errorMessage: "No adapter for platform" };
  }

  // Mark syncing
  await db
    .update(platformConnectionsTable)
    .set({ syncStatus: "syncing", errorMessage: null })
    .where(and(eq(platformConnectionsTable.userId, userId), eq(platformConnectionsTable.platformId, platformId)));

  try {
    const result = await adapter.fetch(handle);

    // Deduplicate: get existing submissions for this platform
    const existing = await db
      .select({ problemName: submissionsTable.problemName, solvedAt: submissionsTable.solvedAt })
      .from(submissionsTable)
      .where(and(eq(submissionsTable.userId, userId), eq(submissionsTable.platformId, platformId)));

    const existingKeys = new Set(
      existing.map((s) => `${s.problemName}::${s.solvedAt.toISOString().slice(0, 10)}`),
    );

    const newSubs = result.submissions.filter((s) => {
      const key = `${s.problemName}::${s.solvedAt.toISOString().slice(0, 10)}`;
      return !existingKeys.has(key);
    });

    if (newSubs.length > 0) {
      await db.insert(submissionsTable).values(
        newSubs.map((s) => ({
          userId,
          platformId: s.platformId,
          platformName: s.platformName,
          problemName: s.problemName,
          problemUrl: s.problemUrl,
          difficulty: s.difficulty,
          topic: s.topic,
          language: s.language,
          status: s.status,
          isContest: s.isContest,
          solvedAt: s.solvedAt,
          timeTakenMs: s.timeTakenMs,
        })),
      );
    }

    const finalStatus = result.error ? "partial" : "success";

    await db
      .update(platformConnectionsTable)
      .set({
        syncStatus: "idle",
        lastSyncAt: new Date(),
        errorMessage: result.error ?? null,
      })
      .where(and(eq(platformConnectionsTable.userId, userId), eq(platformConnectionsTable.platformId, platformId)));

    return {
      status: finalStatus as "success" | "partial",
      newSubmissions: newSubs.length,
      errorMessage: result.error ?? null,
    };
  } catch (err) {
    logger.error({ err, platformId, handle }, "Sync failed");
    const errorMessage = String(err);

    await db
      .update(platformConnectionsTable)
      .set({ syncStatus: "error", errorMessage })
      .where(and(eq(platformConnectionsTable.userId, userId), eq(platformConnectionsTable.platformId, platformId)));

    return { status: "error" as const, newSubmissions: 0, errorMessage };
  }
}
