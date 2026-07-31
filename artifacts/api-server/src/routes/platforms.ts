import { Router } from "express";
import { db, platformConnectionsTable, submissionsTable } from "@workspace/db";
import {
  ListPlatformsResponse,
  ConnectPlatformParams,
  ConnectPlatformBody,
  ConnectPlatformResponse,
  DisconnectPlatformParams,
  SyncPlatformParams,
  SyncPlatformResponse,
  GetPlatformStatsParams,
  GetPlatformStatsResponse,
  SyncAllPlatformsResponse,
} from "@workspace/api-zod";
import { eq, and, desc } from "drizzle-orm";
import { PLATFORMS, PLATFORM_MAP } from "../lib/platforms/index.js";
import { syncPlatform } from "../lib/syncService.js";
import type { IRouter } from "express";

const router: IRouter = Router();
const USER_ID = 1;

router.get("/platforms", async (req, res): Promise<void> => {
  const connections = await db
    .select()
    .from(platformConnectionsTable)
    .where(eq(platformConnectionsTable.userId, USER_ID));

  const connectionMap = new Map(connections.map((c) => [c.platformId, c]));

  const result = PLATFORMS.map((p) => {
    const conn = connectionMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      color: p.color,
      logoUrl: p.logoUrl,
      connected: !!conn,
      handle: conn?.handle ?? null,
      lastSyncAt: conn?.lastSyncAt?.toISOString() ?? null,
      syncStatus: conn?.syncStatus ?? null,
      totalSolved: conn?.totalSolved ?? null,
      errorMessage: conn?.errorMessage ?? null,
    };
  });

  res.json(ListPlatformsResponse.parse(result));
});

router.post("/platforms/:platformId/connect", async (req, res): Promise<void> => {
  const params = ConnectPlatformParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ConnectPlatformBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { platformId } = params.data;
  const { handle } = body.data;
  const platform = PLATFORM_MAP.get(platformId);

  if (!platform) {
    res.status(400).json({ error: "Unknown platform" });
    return;
  }

  const [existing] = await db
    .select()
    .from(platformConnectionsTable)
    .where(and(eq(platformConnectionsTable.userId, USER_ID), eq(platformConnectionsTable.platformId, platformId)));

  if (existing) {
    await db
      .update(platformConnectionsTable)
      .set({ handle, syncStatus: "idle", errorMessage: null })
      .where(eq(platformConnectionsTable.id, existing.id));
  } else {
    await db.insert(platformConnectionsTable).values({
      userId: USER_ID,
      platformId,
      handle,
      syncStatus: "idle",
    });
  }

  res.json(
    ConnectPlatformResponse.parse({
      id: platformId,
      name: platform.name,
      slug: platform.slug,
      color: platform.color,
      logoUrl: platform.logoUrl,
      connected: true,
      handle,
      lastSyncAt: null,
      syncStatus: "idle",
      totalSolved: null,
      errorMessage: null,
    }),
  );
});

router.delete("/platforms/:platformId/disconnect", async (req, res): Promise<void> => {
  const params = DisconnectPlatformParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(platformConnectionsTable)
    .where(
      and(
        eq(platformConnectionsTable.userId, USER_ID),
        eq(platformConnectionsTable.platformId, params.data.platformId),
      ),
    );

  res.sendStatus(204);
});

router.post("/platforms/:platformId/sync", async (req, res): Promise<void> => {
  const params = SyncPlatformParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { platformId } = params.data;

  const [conn] = await db
    .select()
    .from(platformConnectionsTable)
    .where(and(eq(platformConnectionsTable.userId, USER_ID), eq(platformConnectionsTable.platformId, platformId)));

  if (!conn) {
    res.status(404).json({ error: "Platform not connected" });
    return;
  }

  const result = await syncPlatform(USER_ID, platformId, conn.handle);

  res.json(
    SyncPlatformResponse.parse({
      platformId,
      status: result.status,
      newSubmissions: result.newSubmissions,
      errorMessage: result.errorMessage,
      syncedAt: new Date().toISOString(),
    }),
  );
});

router.get("/platforms/:platformId/stats", async (req, res): Promise<void> => {
  const params = GetPlatformStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { platformId } = params.data;
  const platform = PLATFORM_MAP.get(platformId);

  if (!platform) {
    res.status(404).json({ error: "Platform not found" });
    return;
  }

  const [conn] = await db
    .select()
    .from(platformConnectionsTable)
    .where(and(eq(platformConnectionsTable.userId, USER_ID), eq(platformConnectionsTable.platformId, platformId)));

  const subs = await db
    .select()
    .from(submissionsTable)
    .where(and(eq(submissionsTable.userId, USER_ID), eq(submissionsTable.platformId, platformId)))
    .orderBy(desc(submissionsTable.solvedAt));

  const accepted = subs.filter((s) => s.status === "accepted");

  const easySolved = accepted.filter((s) => s.difficulty === "easy").length;
  const mediumSolved = accepted.filter((s) => s.difficulty === "medium").length;
  const hardSolved = accepted.filter((s) => s.difficulty === "hard").length;

  // Topic breakdown
  const topicMap = new Map<string, number>();
  for (const s of accepted) {
    if (s.topic) {
      topicMap.set(s.topic, (topicMap.get(s.topic) ?? 0) + 1);
    }
  }

  // Language breakdown
  const langMap = new Map<string, number>();
  for (const s of accepted) {
    if (s.language) {
      langMap.set(s.language, (langMap.get(s.language) ?? 0) + 1);
    }
  }

  // Daily submission graph (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dayMap = new Map<string, number>();
  for (const s of accepted) {
    if (s.solvedAt >= thirtyDaysAgo) {
      const d = s.solvedAt.toISOString().slice(0, 10);
      dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
    }
  }

  // Active days
  const uniqueDays = new Set(accepted.map((s) => s.solvedAt.toISOString().slice(0, 10)));

  res.json(
    GetPlatformStatsResponse.parse({
      platformId,
      name: platform.name,
      handle: conn?.handle ?? "",
      // Prefer counting actual submission rows when they exist (more
      // accurate, and needed for the breakdown fields below anyway). Fall
      // back to the connection's stored aggregate total for platforms
      // like GFG that structurally can't have dated submission rows --
      // without this fallback, those platforms always show 0 even after
      // a fully successful sync, since accepted.length is always 0 for them.
      totalSolved: subs.length > 0 ? accepted.length : (conn?.totalSolved ?? accepted.length),
      easySolved,
      mediumSolved,
      hardSolved,
      totalSubmissions: subs.length,
      acceptanceRate: subs.length > 0 ? accepted.length / subs.length : null,
      ranking: conn?.ranking ?? null,
      rating: null,
      streak: null,
      maxStreak: null,
      contestsParticipated: null,
      activeDays: uniqueDays.size,
      topicsBreakdown: [...topicMap.entries()].map(([topic, count]) => ({ topic, count })),
      languagesUsed: [...langMap.entries()].map(([language, count]) => ({ language, count })),
      recentSubmissions: accepted.slice(0, 10).map((s) => ({
        id: s.id,
        platformId: s.platformId,
        platformName: s.platformName,
        problemName: s.problemName,
        problemUrl: s.problemUrl ?? null,
        difficulty: (s.difficulty as any) ?? null,
        topic: s.topic ?? null,
        language: s.language ?? null,
        status: s.status as any,
        isContest: s.isContest,
        solvedAt: s.solvedAt.toISOString(),
        timeTakenMs: s.timeTakenMs ?? null,
        companyTags: [],
      })),
      badges: [],
      submissionGraph: [...dayMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    }),
  );
});

router.post("/platforms/sync-all", async (req, res): Promise<void> => {
  const connections = await db
    .select()
    .from(platformConnectionsTable)
    .where(eq(platformConnectionsTable.userId, USER_ID));

  const results = await Promise.all(
    connections.map(async (conn) => {
      const r = await syncPlatform(USER_ID, conn.platformId, conn.handle);
      return {
        platformId: conn.platformId,
        status: r.status,
        newSubmissions: r.newSubmissions,
        errorMessage: r.errorMessage,
        syncedAt: new Date().toISOString(),
      };
    }),
  );

  res.json(SyncAllPlatformsResponse.parse({ results }));
});

export default router;
