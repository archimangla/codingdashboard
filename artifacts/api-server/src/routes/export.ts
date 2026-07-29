import { Router } from "express";
import { db, submissionsTable } from "@workspace/db";
import { ExportJsonResponse } from "@workspace/api-zod";
import { eq, and, desc } from "drizzle-orm";
import type { IRouter } from "express";

const router: IRouter = Router();
const USER_ID = 1;

router.get("/export/json", async (req, res): Promise<void> => {
  const subs = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.userId, USER_ID))
    .orderBy(desc(submissionsTable.solvedAt));

  res.json(
    ExportJsonResponse.parse({
      exportedAt: new Date().toISOString(),
      totalSubmissions: subs.length,
      submissions: subs.map((s) => ({
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
    }),
  );
});

router.get("/export/csv", async (req, res): Promise<void> => {
  const subs = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.userId, USER_ID))
    .orderBy(desc(submissionsTable.solvedAt));

  const header = "id,platform,problemName,difficulty,topic,language,status,isContest,solvedAt,problemUrl";
  const rows = subs.map((s) =>
    [
      s.id,
      `"${s.platformName}"`,
      `"${s.problemName.replace(/"/g, '""')}"`,
      s.difficulty ?? "",
      `"${s.topic ?? ""}"`,
      s.language ?? "",
      s.status,
      s.isContest ? "true" : "false",
      s.solvedAt.toISOString(),
      `"${s.problemUrl ?? ""}"`,
    ].join(","),
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=codehub-export.csv");
  res.send([header, ...rows].join("\n"));
});

export default router;
