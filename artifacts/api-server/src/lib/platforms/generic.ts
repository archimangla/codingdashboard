import type { PlatformAdapter, PlatformAdapterResult } from "./types.js";
import { logger } from "../logger.js";

// Generic stub for platforms without a public API (SPOJ, TopCoder, CSES, InterviewBit)
export function makeStubAdapter(platformId: string, platformName: string, reason: string): PlatformAdapter {
  return {
    platformId,
    async fetch(handle: string): Promise<PlatformAdapterResult> {
      logger.info({ handle, platformId }, `${platformName}: no public API`);
      return {
        submissions: [],
        error: reason,
      };
    },
  };
}
