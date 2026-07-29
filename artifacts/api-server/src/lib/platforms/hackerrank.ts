import type { PlatformAdapter, PlatformAdapterResult } from "./types.js";
import { logger } from "../logger.js";

// HackerRank requires authentication for submission history.
export const hackerrankAdapter: PlatformAdapter = {
  platformId: "hackerrank",

  async fetch(handle: string): Promise<PlatformAdapterResult> {
    logger.info({ handle }, "HackerRank: submission history requires authentication, returning stub");
    return {
      submissions: [],
      error: "HackerRank submission history requires authentication. Connect your account to enable full sync.",
    };
  },
};
