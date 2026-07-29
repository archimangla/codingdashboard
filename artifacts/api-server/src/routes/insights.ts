import { Router } from "express";
import { db, submissionsTable } from "@workspace/db";
import { GetInsightsResponse } from "@workspace/api-zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { computeStreak } from "../lib/statsService.js";
import { PLATFORM_MAP } from "../lib/platforms/index.js";
import type { IRouter } from "express";

const router: IRouter = Router();
const USER_ID = 1;

router.get("/insights", async (req, res): Promise<void> => {
  const subs = await db
    .select()
    .from(submissionsTable)
    .where(and(eq(submissionsTable.userId, USER_ID), eq(submissionsTable.status, "accepted")));

  const streak = await computeStreak(USER_ID);
  const insights: { id: string; type: string; message: string; detail: string | null; generatedAt: string }[] = [];
  const now = new Date().toISOString();

  // Streak milestone
  if (streak.currentStreak >= 30) {
    insights.push({
      id: "streak-30",
      type: "milestone",
      message: `You're on a ${streak.currentStreak}-day streak — incredible consistency!`,
      detail: "Maintaining a 30+ day streak puts you in the top 1% of coders.",
      generatedAt: now,
    });
  } else if (streak.currentStreak >= 7) {
    insights.push({
      id: "streak-7",
      type: "achievement",
      message: `${streak.currentStreak}-day streak in progress. Keep it up!`,
      detail: null,
      generatedAt: now,
    });
  }

  // Streak at risk
  if (streak.streakAtRisk && streak.currentStreak > 0) {
    insights.push({
      id: "streak-risk",
      type: "warning",
      message: `Your ${streak.currentStreak}-day streak is at risk today.`,
      detail: "You haven't solved any problems today. Solve one to keep the streak alive.",
      generatedAt: now,
    });
  }

  // This month vs last month
  const now2 = new Date();
  const thisMonthStart = new Date(now2.getUTCFullYear(), now2.getUTCMonth(), 1);
  const lastMonthStart = new Date(now2.getUTCFullYear(), now2.getUTCMonth() - 1, 1);

  const thisMonthSubs = subs.filter((s) => s.solvedAt >= thisMonthStart).length;
  const lastMonthSubs = subs.filter(
    (s) => s.solvedAt >= lastMonthStart && s.solvedAt < thisMonthStart,
  ).length;

  if (lastMonthSubs > 0 && thisMonthSubs > lastMonthSubs) {
    const pct = Math.round(((thisMonthSubs - lastMonthSubs) / lastMonthSubs) * 100);
    insights.push({
      id: "monthly-growth",
      type: "trend",
      message: `Your activity is up ${pct}% compared to last month.`,
      detail: `${thisMonthSubs} problems this month vs ${lastMonthSubs} last month.`,
      generatedAt: now,
    });
  }

  // Total milestone
  if (subs.length >= 100 && subs.length < 150) {
    insights.push({
      id: "total-100",
      type: "milestone",
      message: "You've crossed 100 problems solved!",
      detail: "A major milestone — consistency is your superpower.",
      generatedAt: now,
    });
  } else if (subs.length >= 500) {
    insights.push({
      id: "total-500",
      type: "milestone",
      message: `${subs.length} problems solved across all platforms.`,
      detail: "You're in the top tier of dedicated coders.",
      generatedAt: now,
    });
  }

  // Most productive day of week
  const dayMap = new Map<number, number>();
  for (const s of subs) {
    const d = s.solvedAt.getUTCDay();
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
  }
  if (dayMap.size > 0) {
    const bestDay = [...dayMap.entries()].sort(([, a], [, b]) => b - a)[0];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    insights.push({
      id: "best-day",
      type: "trend",
      message: `${dayNames[bestDay[0]]} is your most productive coding day.`,
      detail: `You solve an average of ${Math.round((bestDay[1] / 52) * 10) / 10} problems on ${dayNames[bestDay[0]]}s.`,
      generatedAt: now,
    });
  }

  // Topic focus this month
  const topicMap = new Map<string, number>();
  const thisMonthSubsArr = subs.filter((s) => s.solvedAt >= thisMonthStart);
  for (const s of thisMonthSubsArr) {
    if (s.topic) topicMap.set(s.topic, (topicMap.get(s.topic) ?? 0) + 1);
  }
  if (topicMap.size > 0) {
    const topTopic = [...topicMap.entries()].sort(([, a], [, b]) => b - a)[0];
    insights.push({
      id: "top-topic",
      type: "trend",
      message: `You solved ${topTopic[1]} ${topTopic[0]} problems this month.`,
      detail: "Deep focus on a single topic improves pattern recognition significantly.",
      generatedAt: now,
    });
  }

  // Difficulty distribution
  const mediumSolved = subs.filter((s) => s.difficulty === "medium").length;
  const hardSolved = subs.filter((s) => s.difficulty === "hard").length;
  const easySolved = subs.filter((s) => s.difficulty === "easy").length;
  const total = easySolved + mediumSolved + hardSolved;

  if (total > 10) {
    const mediumPct = Math.round((mediumSolved / total) * 100);
    if (mediumPct > 50) {
      insights.push({
        id: "medium-focus",
        type: "trend",
        message: `${mediumPct}% of your problems are Medium difficulty.`,
        detail: "Medium problems are the sweet spot for interview prep.",
        generatedAt: now,
      });
    }
    if (hardSolved > 20) {
      insights.push({
        id: "hard-solver",
        type: "achievement",
        message: `You've solved ${hardSolved} Hard problems — elite territory.`,
        detail: null,
        generatedAt: now,
      });
    }
  }

  // Platform diversity
  const platformSet = new Set(subs.map((s) => s.platformId));
  if (platformSet.size >= 3) {
    insights.push({
      id: "multi-platform",
      type: "achievement",
      message: `Active on ${platformSet.size} platforms — great breadth.`,
      detail: [...platformSet].map((p) => PLATFORM_MAP.get(p)?.name ?? p).join(", "),
      generatedAt: now,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "get-started",
      type: "reminder",
      message: "Connect your coding platforms and start syncing to see insights here.",
      detail: null,
      generatedAt: now,
    });
  }

  res.json(GetInsightsResponse.parse(insights));
});

export default router;
