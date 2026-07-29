import { Router } from "express";
import { db, submissionsTable } from "@workspace/db";
import {
  SearchQueryParams,
  SearchResponse,
} from "@workspace/api-zod";
import { eq, and, gte, lte, ilike, or } from "drizzle-orm";
import { desc } from "drizzle-orm";
import type { IRouter } from "express";

const router: IRouter = Router();
const USER_ID = 1;

router.get("/search", async (req, res): Promise<void> => {
  const parsed = SearchQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q, platform, difficulty, topic, date_from, date_to, page = 1, limit = 20 } = parsed.data;

  const conditions = [eq(submissionsTable.userId, USER_ID)];

  if (q) {
    conditions.push(ilike(submissionsTable.problemName, `%${q}%`));
  }
  if (platform) conditions.push(eq(submissionsTable.platformId, platform));
  if (difficulty) conditions.push(eq(submissionsTable.difficulty, difficulty));
  if (topic) conditions.push(ilike(submissionsTable.topic, `%${topic}%`));
  if (date_from) conditions.push(gte(submissionsTable.solvedAt, new Date(date_from)));
  if (date_to) conditions.push(lte(submissionsTable.solvedAt, new Date(date_to + "T23:59:59Z")));

  const allSubs = await db
    .select()
    .from(submissionsTable)
    .where(and(...conditions))
    .orderBy(desc(submissionsTable.solvedAt));

  const total = allSubs.length;
  const offset = (page - 1) * limit;
  const items = allSubs.slice(offset, offset + limit);

  res.json(
    SearchResponse.parse({
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
      query: q ?? "",
    }),
  );
});

export default router;
