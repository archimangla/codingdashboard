import { Router } from "express";
import { db, submissionsTable, platformConnectionsTable } from "@workspace/db";
import {
  GetDashboardOverviewResponse,
  GetTodayActivityResponse,
  GetStreakInfoResponse,
} from "@workspace/api-zod";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { computeStreak } from "../lib/statsService.js";
import { PLATFORM_MAP } from "../lib/platforms/index.js";
import type { IRouter } from "express";

const router: IRouter = Router();
const USER_ID = 1;

router.get("/dashboard/overview", async (req, res): Promise<void> => {
  const allAccepted = await db
    .select()
    .from(submissionsTable)
    .where(and(eq(submissionsTable.userId, USER_ID), eq(submissionsTable.status, "accepted")));

  const streak = await computeStreak(USER_ID);

  // Today's stats
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todaySubs = allAccepted.filter((s) => s.solvedAt >= todayStart);
  const todayEasy = todaySubs.filter((s) => s.difficulty === "easy").length;
  const todayMedium = todaySubs.filter((s) => s.difficulty === "medium").length;
  const todayHard = todaySubs.filter((s) => s.difficulty === "hard").length;

  // Platform breakdown
  const platformMap = new Map<string, number>();
  for (const s of allAccepted) {
    platformMap.set(s.platformId, (platformMap.get(s.platformId) ?? 0) + 1);
  }

  const connections = await db
    .select()
    .from(platformConnectionsTable)
    .where(eq(platformConnectionsTable.userId, USER_ID));

  const platformBreakdown = [...platformMap.entries()].map(([pid, count]) => {
    const meta = PLATFORM_MAP.get(pid);
    return {
      platformId: pid,
      platformName: meta?.name ?? pid,
      count,
      color: meta?.color ?? "#666",
    };
  });

  // First/last coding day
  const sorted = [...allAccepted].sort((a, b) => a.solvedAt.getTime() - b.solvedAt.getTime());
  const firstCodingDay = sorted[0]?.solvedAt.toISOString().slice(0, 10) ?? null;
  const lastCodingDay = sorted[sorted.length - 1]?.solvedAt.toISOString().slice(0, 10) ?? null;

  // Weekly activity (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setUTCHours(0, 0, 0, 0);

  const weekMap = new Map<string, number>();
  for (const s of allAccepted) {
    if (s.solvedAt >= weekAgo) {
      const d = s.solvedAt.toISOString().slice(0, 10);
      weekMap.set(d, (weekMap.get(d) ?? 0) + 1);
    }
  }

  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo.getTime() + i * 86400000);
    const ds = d.toISOString().slice(0, 10);
    return { date: ds, count: weekMap.get(ds) ?? 0 };
  });

  const totalContests = allAccepted.filter((s) => s.isContest).length;

  res.json(
    GetDashboardOverviewResponse.parse({
      totalSolved: allAccepted.length,
      activeDays: streak.activeDays,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      firstCodingDay,
      lastCodingDay,
      todaySolved: todaySubs.length,
      todayEasy,
      todayMedium,
      todayHard,
      totalContests,
      totalAccepted: allAccepted.length,
      platformBreakdown,
      streakAtRisk: streak.streakAtRisk,
      weeklyActivity,
    }),
  );
});

router.get("/dashboard/today", async (req, res): Promise<void> => {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const subs = await db
    .select()
    .from(submissionsTable)
    .where(
      and(
        eq(submissionsTable.userId, USER_ID),
        gte(submissionsTable.solvedAt, todayStart),
      ),
    )
    .orderBy(desc(submissionsTable.solvedAt));

  res.json(
    GetTodayActivityResponse.parse(
      subs.map((s) => ({
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
    ),
  );
});

router.get("/dashboard/streak", async (req, res): Promise<void> => {
  const streak = await computeStreak(USER_ID);

  res.json(
    GetStreakInfoResponse.parse({
      ...streak,
      currentStreakStart: streak.currentStreakStart ?? null,
      longestStreakStart: streak.longestStreakStart ?? null,
      longestStreakEnd: streak.longestStreakEnd ?? null,
    }),
  );
});

export default router;
