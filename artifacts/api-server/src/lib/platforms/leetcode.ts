import type { PlatformAdapter, PlatformAdapterResult, RawSubmission } from "./types.js";
import { logger } from "../logger.js";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const RECENT_SUBMISSIONS_QUERY = `
query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
    lang
  }
}`;

const USER_STATS_QUERY = `
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
  }
}`;

export const leetcodeAdapter: PlatformAdapter = {
  platformId: "leetcode",

  async fetch(handle: string): Promise<PlatformAdapterResult> {
    const submissions: RawSubmission[] = [];

    try {
      const res = await fetch(LEETCODE_GRAPHQL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://leetcode.com",
        },
        body: JSON.stringify({
          query: RECENT_SUBMISSIONS_QUERY,
          variables: { username: handle, limit: 100 },
        }),
      });

      if (!res.ok) {
        return { submissions: [], error: `HTTP ${res.status}` };
      }

      const data = await res.json() as any;
      const list = data?.data?.recentAcSubmissionList ?? [];

      for (const sub of list) {
        const ts = parseInt(sub.timestamp, 10) * 1000;
        submissions.push({
          platformId: "leetcode",
          platformName: "LeetCode",
          problemName: sub.title,
          problemUrl: `https://leetcode.com/problems/${sub.titleSlug}/`,
          language: sub.lang,
          status: "accepted",
          isContest: false,
          solvedAt: new Date(ts),
        });
      }
    } catch (err) {
      logger.warn({ err, handle }, "LeetCode fetch failed");
      return { submissions: [], error: String(err) };
    }

    return { submissions };
  },
};
