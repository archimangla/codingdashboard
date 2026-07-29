import { Router } from "express";
import { db, submissionsTable } from "@workspace/db";
import {
  ListActivityQueryParams,
  ListActivityResponse,
  GetActivityCalendarQueryParams,
  GetActivityCalendarResponse,
  GetTimelineQueryParams,
  GetTimelineResponse,
} from "@workspace/api-zod";
import { eq, and, gte, lte, desc, sql, ilike, or } from "drizzle-orm";
import { getCalendarData } from "../lib/statsService.js";
import type { IRouter } from "express";

const router: IRouter = Router();
const USER_ID = 1;

router.get("/activity", async (req, res): Promise<void> => {
  const parsed = ListActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    platform,
    difficulty,
    topic,
    date_from,
    date_to,
    contest_only,
    accepted_only,
    page = 1,
    limit = 20,
  } = parsed.data;

  const conditions = [eq(submissionsTable.userId, USER_ID)];

  if (platform) conditions.push(eq(submissionsTable.platformId, platform));
  if (difficulty && difficulty !== "all") conditions.push(eq(submissionsTable.difficulty, difficulty));
  if (topic) conditions.push(ilike(submissionsTable.topic, `%${topic}%`));
  if (date_from) conditions.push(gte(submissionsTable.solvedAt, new Date(date_from)));
  if (date_to) conditions.push(lte(submissionsTable.solvedAt, new Date(date_to + "T23:59:59Z")));
  if (contest_only) conditions.push(eq(submissionsTable.isContest, true));
  if (accepted_only) conditions.push(eq(submissionsTable.status, "accepted"));

  const allSubs = await db
    .select()
    .from(submissionsTable)
    .where(and(...conditions))
    .orderBy(desc(submissionsTable.solvedAt));

  const total = allSubs.length;
  const offset = (page - 1) * limit;
  const items = allSubs.slice(offset, offset + limit);

  res.json(
    ListActivityResponse.parse({
      items: items.map((s) => ({
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
      total,
      page,
      limit,
      hasMore: offset + limit < total,
    }),
  );
});

router.get("/activity/calendar", async (req, res): Promise<void> => {
  const parsed = GetActivityCalendarQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const year = parsed.data.year ?? new Date().getFullYear();
  const data = await getCalendarData(USER_ID, year);

  res.json(GetActivityCalendarResponse.parse(data));
});

router.get("/activity/timeline", async (req, res): Promise<void> => {
  const parsed = GetTimelineQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { cursor, limit = 10 } = parsed.data;

  const conditions = [eq(submissionsTable.userId, USER_ID)];
  if (cursor) {
    conditions.push(lte(submissionsTable.solvedAt, new Date(cursor)));
  }

  const subs = await db
    .select()
    .from(submissionsTable)
    .where(and(...conditions))
    .orderBy(desc(submissionsTable.solvedAt))
    .limit(limit * 10); // Fetch extra to group by day

  // Group by day
  const dayMap = new Map<string, typeof subs>();
  for (const s of subs) {
    const d = s.solvedAt.toISOString().slice(0, 10);
    const list = dayMap.get(d) ?? [];
    list.push(s);
    dayMap.set(d, list);
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const groups = [...dayMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, limit)
    .map(([date, submissions]) => ({
      date,
      label: date === today ? "Today" : date === yesterday ? "Yesterday" : date,
      submissions: submissions.map((s) => ({
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
    }));

  const lastGroup = groups[groups.length - 1];
  const nextCursor = lastGroup?.submissions[lastGroup.submissions.length - 1]?.solvedAt ?? null;

  res.json(
    GetTimelineResponse.parse({
      groups,
      nextCursor,
      hasMore: subs.length >= limit * 10,
    }),
  );
});

export default router;
