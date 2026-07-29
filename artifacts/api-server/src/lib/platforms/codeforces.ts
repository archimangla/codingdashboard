import type { PlatformAdapter, PlatformAdapterResult, RawSubmission } from "./types.js";
import { logger } from "../logger.js";

export const codeforcesAdapter: PlatformAdapter = {
  platformId: "codeforces",

  async fetch(handle: string): Promise<PlatformAdapterResult> {
    const submissions: RawSubmission[] = [];

    try {
      const res = await fetch(
        `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=200`,
      );

      if (!res.ok) {
        return { submissions: [], error: `HTTP ${res.status}` };
      }

      const data = await res.json() as any;

      if (data.status !== "OK") {
        return { submissions: [], error: data.comment ?? "Unknown error" };
      }

      for (const sub of data.result ?? []) {
        if (sub.verdict !== "OK") continue;

        const isContest = !!sub.contestId;
        const problemName = sub.problem
          ? `${sub.problem.contestId ?? ""}${sub.problem.index ?? ""} - ${sub.problem.name ?? "Unknown"}`
          : "Unknown";

        let difficulty: "easy" | "medium" | "hard" | undefined;
        const rating = sub.problem?.rating;
        if (rating) {
          if (rating <= 1400) difficulty = "easy";
          else if (rating <= 2000) difficulty = "medium";
          else difficulty = "hard";
        }

        const tags: string[] = sub.problem?.tags ?? [];

        submissions.push({
          platformId: "codeforces",
          platformName: "Codeforces",
          problemName,
          problemUrl: sub.contestId
            ? `https://codeforces.com/contest/${sub.contestId}/problem/${sub.problem?.index}`
            : undefined,
          difficulty,
          topic: tags[0],
          language: sub.programmingLanguage,
          status: "accepted",
          isContest,
          solvedAt: new Date(sub.creationTimeSeconds * 1000),
        });
      }
    } catch (err) {
      logger.warn({ err, handle }, "Codeforces fetch failed");
      return { submissions: [], error: String(err) };
    }

    return { submissions };
  },
};
