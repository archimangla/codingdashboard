import { Router } from "express";
import { db, submissionsTable } from "@workspace/db";
import {
  GetWeeklyAnalyticsQueryParams,
  GetWeeklyAnalyticsResponse,
  GetMonthlyAnalyticsQueryParams,
  GetMonthlyAnalyticsResponse,
  GetYearlyAnalyticsQueryParams,
  GetYearlyAnalyticsResponse,
} from "@workspace/api-zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { getCalendarData, computeStreak } from "../lib/statsService.js";
import { PLATFORM_MAP } from "../lib/platforms/index.js";
import type { IRouter } from "express";

const router: IRouter = Router();
const USER_ID = 1;

router.get("/analytics/weekly", async (req, res): Promise<void> => {
  const parsed = GetWeeklyAnalyticsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const weekOffset = parsed.data.week_offset ?? 0;

  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - dayOfWeek - weekOffset * 7);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
  weekEnd.setUTCHours(23, 59, 59, 999);

  const subs = await db
    .select()
    .from(submissionsTable)
    .where(
      and(
        eq(submissionsTable.userId, USER_ID),
        eq(submissionsTable.status, "accepted"),
        gte(submissionsTable.solvedAt, weekStart),
        lte(submissionsTable.solvedAt, weekEnd),
      ),
    );

  const dayMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.getTime() + i * 86400000);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const s of subs) {
    const d = s.solvedAt.toISOString().slice(0, 10);
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
  }

  const diffBreakdown = { easy: 0, medium: 0, hard: 0 };
  for (const s of subs) {
    if (s.difficulty === "easy") diffBreakdown.easy++;
    else if (s.difficulty === "medium") diffBreakdown.medium++;
    else if (s.difficulty === "hard") diffBreakdown.hard++;
  }

  const topicMap = new Map<string, number>();
  for (const s of subs) {
    if (s.topic) topicMap.set(s.topic, (topicMap.get(s.topic) ?? 0) + 1);
  }

  const platformMap = new Map<string, number>();
  for (const s of subs) {
    platformMap.set(s.platformId, (platformMap.get(s.platformId) ?? 0) + 1);
  }

  const activeDays = [...dayMap.values()].filter((v) => v > 0).length;

  res.json(
    GetWeeklyAnalyticsResponse.parse({
      weekStart: weekStart.toISOString().slice(0, 10),
      weekEnd: weekEnd.toISOString().slice(0, 10),
      totalSolved: subs.length,
      activeDays,
      dailyCounts: [...dayMap.entries()].map(([date, count]) => ({ date, count })),
      difficultyBreakdown: diffBreakdown,
      topicBreakdown: [...topicMap.entries()].map(([topic, count]) => ({ topic, count })),
      platformBreakdown: [...platformMap.entries()].map(([pid, count]) => ({
        platformId: pid,
        platformName: PLATFORM_MAP.get(pid)?.name ?? pid,
        count,
        color: PLATFORM_MAP.get(pid)?.color ?? "#666",
      })),
      acceptedCount: subs.length,
    }),
  );
});

router.get("/analytics/monthly", async (req, res): Promise<void> => {
  const parsed = GetMonthlyAnalyticsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const now = new Date();
  const month = parsed.data.month ?? now.getUTCMonth() + 1;
  const year = parsed.data.year ?? now.getUTCFullYear();

  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCMilliseconds(-1);

  const subs = await db
    .select()
    .from(submissionsTable)
    .where(
      and(
        eq(submissionsTable.userId, USER_ID),
        eq(submissionsTable.status, "accepted"),
        gte(submissionsTable.solvedAt, start),
        lte(submissionsTable.solvedAt, end),
      ),
    );

  const dayMap = new Map<string, number>();
  for (const s of subs) {
    const d = s.solvedAt.toISOString().slice(0, 10);
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
  }

  const activeDays = dayMap.size;
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  const avgPerDay = activeDays > 0 ? subs.length / totalDays : 0;

  const sortedDays = [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  const bestDay = sortedDays.reduce((best, cur) => (cur[1] > (best?.[1] ?? 0) ? cur : best), sortedDays[0]);
  const activeSortedDays = sortedDays.filter(([, c]) => c > 0);
  const worstDay = activeSortedDays.reduce(
    (worst, cur) => (cur[1] < (worst?.[1] ?? Infinity) ? cur : worst),
    activeSortedDays[0],
  );

  // Longest streak for the month
  const datesInMonth = sortedDays.filter(([, c]) => c > 0).map(([d]) => d);
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;
  for (const d of datesInMonth) {
    const cur = new Date(d + "T00:00:00Z");
    if (prevDate && (cur.getTime() - prevDate.getTime()) / 86400000 === 1) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    prevDate = cur;
  }

  const platformMap = new Map<string, number>();
  for (const s of subs) {
    platformMap.set(s.platformId, (platformMap.get(s.platformId) ?? 0) + 1);
  }

  const diffBreakdown = { easy: 0, medium: 0, hard: 0 };
  for (const s of subs) {
    if (s.difficulty === "easy") diffBreakdown.easy++;
    else if (s.difficulty === "medium") diffBreakdown.medium++;
    else if (s.difficulty === "hard") diffBreakdown.hard++;
  }

  res.json(
    GetMonthlyAnalyticsResponse.parse({
      month,
      year,
      totalSolved: subs.length,
      activeDays,
      avgPerDay: Math.round(avgPerDay * 100) / 100,
      bestDay: bestDay ? { date: bestDay[0], count: bestDay[1] } : { date: start.toISOString().slice(0, 10), count: 0 },
      worstDay: worstDay ? { date: worstDay[0], count: worstDay[1] } : { date: start.toISOString().slice(0, 10), count: 0 },
      longestStreak,
      platformBreakdown: [...platformMap.entries()].map(([pid, count]) => ({
        platformId: pid,
        platformName: PLATFORM_MAP.get(pid)?.name ?? pid,
        count,
        color: PLATFORM_MAP.get(pid)?.color ?? "#666",
      })),
      dailyCounts: sortedDays.map(([date, count]) => ({ date, count })),
      difficultyBreakdown: diffBreakdown,
    }),
  );
});

router.get("/analytics/yearly", async (req, res): Promise<void> => {
  const parsed = GetYearlyAnalyticsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const year = parsed.data.year ?? new Date().getUTCFullYear();
  const calendarData = await getCalendarData(USER_ID, year);
  const streak = await computeStreak(USER_ID);

  const start = new Date(`${year}-01-01T00:00:00Z`);
  const end = new Date(`${year}-12-31T23:59:59Z`);

  const subs = await db
    .select()
    .from(submissionsTable)
    .where(
      and(
        eq(submissionsTable.userId, USER_ID),
        eq(submissionsTable.status, "accepted"),
        gte(submissionsTable.solvedAt, start),
        lte(submissionsTable.solvedAt, end),
      ),
    );

  // Monthly trend
  const monthMap = new Map<number, number>();
  for (const s of subs) {
    const m = s.solvedAt.getUTCMonth() + 1;
    monthMap.set(m, (monthMap.get(m) ?? 0) + 1);
  }
  const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    year,
    count: monthMap.get(i + 1) ?? 0,
  }));

  const activeDays = new Set(subs.map((s) => s.solvedAt.toISOString().slice(0, 10))).size;
  const daysInYear = year % 4 === 0 ? 366 : 365;
  const codingConsistency = Math.round((activeDays / daysInYear) * 100 * 10) / 10;

  const platformMap = new Map<string, number>();
  for (const s of subs) {
    platformMap.set(s.platformId, (platformMap.get(s.platformId) ?? 0) + 1);
  }

  // Compute longest streak for the year
  const dateDates = [...new Set(subs.map((s) => s.solvedAt.toISOString().slice(0, 10)))].sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;
  for (const d of dateDates) {
    const cur = new Date(d + "T00:00:00Z");
    if (prevDate && (cur.getTime() - prevDate.getTime()) / 86400000 === 1) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    prevDate = cur;
  }

  res.json(
    GetYearlyAnalyticsResponse.parse({
      year,
      totalSolved: subs.length,
      activeDays,
      longestStreak,
      codingConsistency,
      monthlyTrend,
      calendarData,
      platformBreakdown: [...platformMap.entries()].map(([pid, count]) => ({
        platformId: pid,
        platformName: PLATFORM_MAP.get(pid)?.name ?? pid,
        count,
        color: PLATFORM_MAP.get(pid)?.color ?? "#666",
      })),
      growthRate: null,
    }),
  );
});

export default router;
