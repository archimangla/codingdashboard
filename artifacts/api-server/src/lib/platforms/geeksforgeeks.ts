import type { PlatformAdapter, PlatformAdapterResult } from "./types.js";
import { logger } from "../logger.js";

// ---------------------------------------------------------------------------
// GeeksforGeeks has no official public API. There is also no publicly
// exposed endpoint (official or undocumented) that returns a dated
// submission history / activity heatmap for a GFG user -- the public
// profile only ever shows aggregate counts (total solved, per-difficulty
// counts, current/max streak, institute rank). Every third-party "GFG API"
// on GitHub confirms this: they all scrape the same aggregate numbers,
// none of them expose per-problem solve *dates*.
//
// So instead of one fragile third-party mirror (the old implementation),
// this adapter tries several known community mirrors in order and takes
// the first one that responds. These are free-tier hobby projects and go
// down individually all the time, but it's unlikely all of them are down
// at once. Each mirror has a slightly different response shape, so each
// gets its own small parser.
//
// What this CANNOT do: populate `submissions` with dated entries (for the
// activity calendar / streak graph / timeline), because that data isn't
// publicly exposed anywhere. What it CAN do reliably: total solved count
// and institute rank when the mirror provides it.
// ---------------------------------------------------------------------------

interface GfgParsedResult {
  totalSolved: number;
  ranking?: number;
}

async function fetchJson(url: string, timeoutMs = 6000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
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

type MirrorParser = (handle: string) => Promise<GfgParsedResult | null>;

// Mirror 1: arnoob16/sukesh2000 style wrapper (also what the old adapter used)
const mirrorClassic: MirrorParser = async (handle) => {
  const data = await fetchJson(
    `https://geeks-for-geeks-api.vercel.app/${encodeURIComponent(handle)}`,
  );
  // Field name verified against the live API's actual response shape --
  // it's `info.solved`, not `info.totalProblemsSolved` (the latter was a
  // wrong assumption in an earlier version of this file that was never
  // caught because this endpoint couldn't be reached from the sandbox
  // used to originally write it). Checking both defensively in case the
  // API's shape ever changes again.
  const total = toInt(data?.info?.solved ?? data?.info?.totalProblemsSolved);
  const rank = toInt(data?.info?.instituteRank);
  if (total === undefined) return null;
  return { totalSolved: total, ranking: rank };
};

// Mirror 2: tashif.codes GFG-Stats-API -- flat JSON shape
const mirrorTashif: MirrorParser = async (handle) => {
  const data = await fetchJson(
    `https://gfg-stats.tashif.codes/${encodeURIComponent(handle)}`,
  );
  const total = toInt(data?.totalProblemsSolved);
  if (total === undefined) return null;
  return { totalSolved: total };
};

// Mirror 3: pratham1singh GFG_API on Render
const mirrorPratham: MirrorParser = async (handle) => {
  const data = await fetchJson(
    `https://gfg-api-fefa.onrender.com/${encodeURIComponent(handle)}`,
  );
  const total = toInt(data?.problems_solved ?? data?.total_problems_solved);
  const rank = toInt(data?.rank);
  if (total === undefined) return null;
  return { totalSolved: total, ranking: rank };
};

// Mirror 4: worktrack.azurewebsites.net (Joeljaison391 wrapper)
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

export const geeksforgeeksAdapter: PlatformAdapter = {
  platformId: "geeksforgeeks",

  async fetch(handle: string): Promise<PlatformAdapterResult> {
    // Run every mirror concurrently rather than one-after-another. Sequential
    // tries could add up to ~24s worst case (4 mirrors x 6s timeout each),
    // which risks tripping a serverless function's execution time limit.
    // Concurrently, the worst case is just the slowest single mirror.
    const attempts = await Promise.allSettled(
      MIRRORS.map(async (mirror) => ({
        name: mirror.name,
        parsed: await mirror.parse(handle),
      })),
    );

    const failures: string[] = [];

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      const mirrorName = MIRRORS[i].name;
      if (attempt.status === "fulfilled") {
        if (attempt.value.parsed === null) {
          failures.push(`${mirrorName}: no usable data in response`);
        }
      } else {
        failures.push(`${mirrorName}: ${String(attempt.reason?.message ?? attempt.reason)}`);
      }
    }

    // Prefer results in the mirrors' declared priority order, not whichever
    // happened to resolve first.
    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      if (attempt.status === "fulfilled" && attempt.value.parsed !== null) {
        const parsed = attempt.value.parsed;
        logger.info(
          { handle, mirror: MIRRORS[i].name, totalSolved: parsed.totalSolved },
          "GFG: resolved via mirror",
        );
        return {
          submissions: [],
          totalSolved: parsed.totalSolved,
          ranking: parsed.ranking,
          // Not a failure -- this is a permanent limitation of GFG's public
          // data (no dated submission history exists anywhere publicly),
          // surfaced so the UI can explain why GFG has no activity
          // calendar / timeline entries even though the sync succeeded.
          // Uses `note`, not `error` -- this must NOT downgrade the sync
          // status, since the sync genuinely succeeded.
          note:
            "GeeksforGeeks does not publicly expose dated submission history, so only the total solved count (and rank, when available) can be synced -- no per-day activity, streak graph, or timeline entries are possible for this platform.",
        };
      }
    }

    logger.warn({ handle, failures }, "GFG: all mirrors failed");
    return {
      submissions: [],
      error:
        "Could not reach any GeeksforGeeks data source right now (all community mirrors are unofficial, free-tier services and occasionally go down together). " +
        `Tried: ${failures.join("; ")}. This will retry on the next sync automatically.`,
    };
  },
};
