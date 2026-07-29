import type { PlatformAdapter, PlatformAdapterResult, RawSubmission } from "./types.js";
import { logger } from "../logger.js";

export const atcoderAdapter: PlatformAdapter = {
  platformId: "atcoder",

  async fetch(handle: string): Promise<PlatformAdapterResult> {
    const submissions: RawSubmission[] = [];

    try {
      // AtCoder Problems API (community, public)
      const res = await fetch(
        `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(handle)}&from_second=0`,
      );

      if (!res.ok) {
        return { submissions: [], error: `HTTP ${res.status}` };
      }

      const data = await res.json() as any[];

      for (const sub of data.slice(0, 200)) {
        if (sub.result !== "AC") continue;

        submissions.push({
          platformId: "atcoder",
          platformName: "AtCoder",
          problemName: sub.problem_id ?? "Unknown",
          problemUrl: sub.contest_id
            ? `https://atcoder.jp/contests/${sub.contest_id}/tasks/${sub.problem_id}`
            : undefined,
          language: sub.language,
          status: "accepted",
          isContest: true,
          solvedAt: new Date(sub.epoch_second * 1000),
        });
      }
    } catch (err) {
      logger.warn({ err, handle }, "AtCoder fetch failed");
      return { submissions: [], error: String(err) };
    }

    return { submissions };
  },
};
