import type { PlatformAdapter, PlatformAdapterResult } from "./types.js";
import { logger } from "../logger.js";

// CodeChef does not have a fully open public API for submission history.
// We return a graceful stub indicating the limitation.
export const codechefAdapter: PlatformAdapter = {
  platformId: "codechef",

  async fetch(handle: string): Promise<PlatformAdapterResult> {
    try {
      // CodeChef removed their public API. Profile pages require login for full history.
      // Return empty with a descriptive limitation message.
      logger.info({ handle }, "CodeChef: no public API available, returning empty");
      return {
        submissions: [],
        error: "CodeChef does not expose a public submission API. Profile page is shown but submission history cannot be fetched automatically.",
      };
    } catch (err) {
      logger.warn({ err, handle }, "CodeChef fetch failed");
      return { submissions: [], error: String(err) };
    }
  },
};
