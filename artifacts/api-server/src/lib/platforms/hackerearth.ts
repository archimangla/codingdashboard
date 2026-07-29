import type { PlatformAdapter, PlatformAdapterResult } from "./types.js";
import { logger } from "../logger.js";

// HackerEarth public API does not expose user submission history.
export const hackearthAdapter: PlatformAdapter = {
  platformId: "hackerearth",

  async fetch(handle: string): Promise<PlatformAdapterResult> {
    logger.info({ handle }, "HackerEarth: no public submission API");
    return {
      submissions: [],
      error: "HackerEarth does not expose public submission history. Stats are shown from profile page.",
    };
  },
};
