import { db, submissionsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function computeStreak(userId: number) {
  const rows = await db
    .selectDistinct({ date: sql<string>`DATE(${submissionsTable.solvedAt} AT TIME ZONE 'UTC')` })
    .from(submissionsTable)
    .where(and(eq(submissionsTable.userId, userId), eq(submissionsTable.status, "accepted")))
    .orderBy(sql`DATE(${submissionsTable.solvedAt} AT TIME ZONE 'UTC') DESC`);

  const dates = rows.map((r) => r.date);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let currentStreakStart: string | null = null;
  let longestStreakStart: string | null = null;
  let longestStreakEnd: string | null = null;

  const dateSet = new Set(dates);

  // Check if streak is active (solved today or yesterday)
  const streakActive = dateSet.has(todayStr) || dateSet.has(yesterdayStr);

  if (streakActive) {
    // Walk back from today/yesterday
    let cursor = dateSet.has(todayStr) ? today : new Date(today.getTime() - 86400000);
    while (true) {
      const dateStr = cursor.toISOString().slice(0, 10);
      if (!dateSet.has(dateStr)) break;
      currentStreak++;
      currentStreakStart = dateStr;
      cursor = new Date(cursor.getTime() - 86400000);
    }
  }

  // Compute longest streak
  let streakCursor: Date | null = null;
  let streakStart: string | null = null;
  const sortedDates = [...dates].sort();

  for (const d of sortedDates) {
    const dDate = new Date(d + "T00:00:00Z");
    if (streakCursor === null) {
      tempStreak = 1;
      streakStart = d;
      streakCursor = dDate;
    } else {
      const diff = (dDate.getTime() - streakCursor.getTime()) / 86400000;
      if (diff === 1) {
        tempStreak++;
        streakCursor = dDate;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
          longestStreakStart = streakStart;
          longestStreakEnd = d;
        }
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
          longestStreakStart = streakStart;
          longestStreakEnd = d;
        }
        tempStreak = 1;
        streakStart = d;
        streakCursor = dDate;
      }
    }
  }
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
    longestStreakStart = streakStart;
    longestStreakEnd = sortedDates[sortedDates.length - 1] ?? null;
  }

  const streakAtRisk = !dateSet.has(todayStr) && dateSet.has(yesterdayStr) && currentStreak > 0;

  const recentDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today.getTime() - i * 86400000);
    const ds = d.toISOString().slice(0, 10);
    return { date: ds, active: dateSet.has(ds), count: 0 };
  }).reverse();

  return {
    currentStreak,
    longestStreak,
    activeDays: dates.length,
    streakAtRisk,
    currentStreakStart,
    longestStreakStart,
    longestStreakEnd,
    recentDays,
  };
}

export async function getCalendarData(userId: number, year: number) {
  const start = new Date(`${year}-01-01T00:00:00Z`);
  const end = new Date(`${year}-12-31T23:59:59Z`);

  const rows = await db
    .select({
      date: sql<string>`DATE(${submissionsTable.solvedAt} AT TIME ZONE 'UTC')`,
      platformId: submissionsTable.platformId,
      platformName: submissionsTable.platformName,
      problemName: submissionsTable.problemName,
    })
    .from(submissionsTable)
    .where(
      and(
        eq(submissionsTable.userId, userId),
        eq(submissionsTable.status, "accepted"),
        gte(submissionsTable.solvedAt, start),
        lte(submissionsTable.solvedAt, end),
      ),
    );

  // Group by date
  const byDate = new Map<string, { platformId: string; platformName: string; problemName: string }[]>();
  for (const r of rows) {
    const list = byDate.get(r.date) ?? [];
    list.push({ platformId: r.platformId, platformName: r.platformName, problemName: r.problemName });
    byDate.set(r.date, list);
  }

  const result = [];
  const allCounts = [...byDate.values()].map((v) => v.length);
  const maxCount = allCounts.length > 0 ? Math.max(...allCounts) : 1;

  for (const [date, submissions] of byDate.entries()) {
    const count = submissions.length;
    const intensity = Math.ceil((count / maxCount) * 4);

    // Group by platform
    const platformMap = new Map<string, { platformId: string; platformName: string; count: number; problems: string[] }>();
    for (const s of submissions) {
      const p = platformMap.get(s.platformId) ?? {
        platformId: s.platformId,
        platformName: s.platformName,
        count: 0,
        problems: [],
      };
      p.count++;
      p.problems.push(s.problemName);
      platformMap.set(s.platformId, p);
    }

    result.push({ date, count, intensity, platforms: [...platformMap.values()] });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}
