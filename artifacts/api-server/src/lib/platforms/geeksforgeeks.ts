import type { PlatformAdapter, PlatformAdapterResult, RawSubmission } from "./types.js";
import { logger } from "../logger.js";

// ---------------------------------------------------------------------------
// CORRECTION from an earlier version of this file: GFG's *public profile
// page* only shows aggregate counts, but GFG's own website calls two
// internal (undocumented, unofficial, but real -- not third-party) JSON
// endpoints client-side to render that page, and one of them DOES include
// a real timestamp per solved problem. So a genuine dated activity history
// is possible after all -- this was verified against a real, working
// reference implementation (tashifkhan/GFG-Stats-API), not guessed.
//
// Primary path: call GFG's own endpoints directly.
//   - https://authapi.geeksforgeeks.org/api-get/user-profile-info/
//     -> profile aggregate: total_problems_solved, institute_rank,
//        pod_solved_current_streak, pod_solved_global_longest_streak, etc.
//   - https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/
//     -> solved problems grouped by difficulty, each with a real
//        `user_subtime` timestamp ("YYYY-MM-DD HH:MM:SS").
// Both are the same public data GFG's own frontend fetches to render a
// profile page that anyone (logged in or not) can already view -- this
// is not session/credential reuse, just calling the JSON endpoint
// instead of scraping the rendered HTML.
//
// Fallback path: if GFG's own endpoints ever get blocked/rate-limited for
// server-to-server calls, or change shape, fall back to the same set of
// community mirrors used before. Those can only ever give aggregate
// numbers (no dates), so that fallback path still attaches an
// informational `note` explaining the reduced data in that case.
// ---------------------------------------------------------------------------

const PROFILE_URL = "https://authapi.geeksforgeeks.org/api-get/user-profile-info/";
const SUBMISSIONS_URL = "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/";
const BROWSER_HEADERS = {
  Accept: "application/json, text/plain, */*",
  Origin: "https://www.geeksforgeeks.org",
  Referer: "https://www.geeksforgeeks.org/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 7000,
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function toInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = parseInt(value, 10);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

// GFG's own difficulty buckets are school/basic/easy/medium/hard.
// RawSubmission only models easy/medium/hard -- school and basic problems
// still count toward totalSolved and get a submission row (so they show
// up in the activity heatmap/streak), just without a difficulty tag,
// rather than being dropped or mis-labeled.
function mapDifficulty(raw: string): "easy" | "medium" | "hard" | undefined {
  const d = raw.toLowerCase();
  if (d === "easy" || d === "medium" || d === "hard") return d;
  return undefined;
}

function parseGfgDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  // Format: "YYYY-MM-DD HH:MM:SS" -- not directly ISO (space instead of
  // "T"), so needs an explicit swap before Date can parse it reliably.
  const iso = value.trim().replace(" ", "T") + "Z";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

interface DirectFetchResult {
  submissions: RawSubmission[];
  totalSolved: number;
  ranking?: number;
}

async function fetchDirectFromGfg(handle: string): Promise<DirectFetchResult> {
  const [profilePayload, submissionPayload] = await Promise.all([
    fetchJsonWithTimeout(
      `${PROFILE_URL}?handle=${encodeURIComponent(handle)}&article_count=false&redirect=true`,
      { headers: BROWSER_HEADERS },
    ),
    fetchJsonWithTimeout(SUBMISSIONS_URL, {
      method: "POST",
      headers: { ...BROWSER_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ handle, requestType: "", year: "", month: "" }),
    }),
  ]);

  const profileData = profilePayload?.data;
  if (!profileData) {
    throw new Error("GFG profile-info endpoint returned no data (user may not exist)");
  }

  const submissions: RawSubmission[] = [];
  const resultByDifficulty = submissionPayload?.result ?? {};
  for (const [difficultyKey, problems] of Object.entries<any>(resultByDifficulty)) {
    if (!problems || typeof problems !== "object") continue;
    for (const details of Object.values<any>(problems)) {
      const solvedAt = parseGfgDate(details?.user_subtime);
      if (!solvedAt) continue; // skip entries GFG didn't give a usable date for
      submissions.push({
        platformId: "geeksforgeeks",
        platformName: "GeeksforGeeks",
        problemName: details?.pname || "Unknown problem",
        problemUrl: details?.slug
          ? `https://www.geeksforgeeks.org/problems/${details.slug}`
          : undefined,
        difficulty: mapDifficulty(difficultyKey),
        status: "accepted",
        isContest: false,
        solvedAt,
      });
    }
  }

  const totalSolved = toInt(profileData.total_problems_solved) ?? submissions.length;
  const ranking = toInt(profileData.institute_rank);

  return { submissions, totalSolved, ranking };
}

// --- Fallback: community mirrors (aggregate-only, no dates) ---------------

interface GfgParsedResult {
  totalSolved: number;
  ranking?: number;
}

async function fetchJson(url: string, timeoutMs = 6000): Promise<any> {
  return fetchJsonWithTimeout(url, { headers: { Accept: "application/json" } }, timeoutMs);
}

type MirrorParser = (handle: string) => Promise<GfgParsedResult | null>;

const mirrorClassic: MirrorParser = async (handle) => {
  const data = await fetchJson(
    `https://geeks-for-geeks-api.vercel.app/${encodeURIComponent(handle)}`,
  );
  const total = toInt(data?.info?.solved ?? data?.info?.totalProblemsSolved);
  const rank = toInt(data?.info?.instituteRank);
  if (total === undefined) return null;
  return { totalSolved: total, ranking: rank };
};

const mirrorTashif: MirrorParser = async (handle) => {
  const data = await fetchJson(
    `https://gfg-stats.tashif.codes/${encodeURIComponent(handle)}`,
  );
  const total = toInt(data?.totalProblemsSolved);
  if (total === undefined) return null;
  return { totalSolved: total };
};

const mirrorPratham: MirrorParser = async (handle) => {
  const data = await fetchJson(
    `https://gfg-api-fefa.onrender.com/${encodeURIComponent(handle)}`,
  );
  const total = toInt(data?.totalSolved ?? data?.problems_solved ?? data?.total_problems_solved);
  const rank = toInt(data?.rank);
  if (total === undefined) return null;
  return { totalSolved: total, ranking: rank };
};

const mirrorWorktrack: MirrorParser = async (handle) => {
  const data = await fetchJson(
    `https://worktrack.azurewebsites.net/api/profile/${encodeURIComponent(handle)}`,
  );
  const total = toInt(data?.solvedProblemsCount);
  const rank = toInt(data?.rank);
  if (total === undefined) return null;
  return { totalSolved: total, ranking: rank };
};

const MIRRORS: { name: string; parse: MirrorParser }[] = [
  { name: "geeks-for-geeks-api.vercel.app", parse: mirrorClassic },
  { name: "gfg-stats.tashif.codes", parse: mirrorTashif },
  { name: "gfg-api-fefa.onrender.com", parse: mirrorPratham },
  { name: "worktrack.azurewebsites.net", parse: mirrorWorktrack },
];

async function fetchViaMirrors(handle: string): Promise<PlatformAdapterResult> {
  const attempts = await Promise.allSettled(
    MIRRORS.map(async (mirror) => ({ name: mirror.name, parsed: await mirror.parse(handle) })),
  );

  const failures: string[] = [];
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    const mirrorName = MIRRORS[i].name;
    if (attempt.status === "fulfilled") {
      if (attempt.value.parsed === null) failures.push(`${mirrorName}: no usable data in response`);
    } else {
      failures.push(`${mirrorName}: ${String(attempt.reason?.message ?? attempt.reason)}`);
    }
  }

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    if (attempt.status === "fulfilled" && attempt.value.parsed !== null) {
      const parsed = attempt.value.parsed;
      logger.info(
        { handle, mirror: MIRRORS[i].name, totalSolved: parsed.totalSolved },
        "GFG: resolved via fallback mirror",
      );
      return {
        submissions: [],
        totalSolved: parsed.totalSolved,
        ranking: parsed.ranking,
        note:
          "GeeksforGeeks's own API couldn't be reached directly, so this fell back to a community mirror that only provides the total solved count (and rank, when available) -- no per-day activity, streak graph, or timeline entries for this sync.",
      };
    }
  }

  logger.warn({ handle, failures }, "GFG: direct fetch and all fallback mirrors failed");
  return {
    submissions: [],
    error:
      "Could not fetch GeeksforGeeks data right now, from GFG directly or any fallback mirror. " +
      `Tried: ${failures.join("; ")}. This will retry on the next sync automatically.`,
  };
}

export const geeksforgeeksAdapter: PlatformAdapter = {
  platformId: "geeksforgeeks",

  async fetch(handle: string): Promise<PlatformAdapterResult> {
    try {
      const direct = await fetchDirectFromGfg(handle);
      logger.info(
        { handle, totalSolved: direct.totalSolved, submissions: direct.submissions.length },
        "GFG: resolved directly from GFG's own endpoints",
      );
      return {
        submissions: direct.submissions,
        totalSolved: direct.totalSolved,
        ranking: direct.ranking,
      };
    } catch (err) {
      logger.warn(
        { handle, err: String((err as Error)?.message ?? err) },
        "GFG: direct fetch failed, falling back to mirrors",
      );
      return fetchViaMirrors(handle);
    }
  },
};
