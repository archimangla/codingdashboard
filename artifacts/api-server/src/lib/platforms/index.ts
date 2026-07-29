import { leetcodeAdapter } from "./leetcode.js";
import { codeforcesAdapter } from "./codeforces.js";
import { atcoderAdapter } from "./atcoder.js";
import { codechefAdapter } from "./codechef.js";
import { geeksforgeeksAdapter } from "./geeksforgeeks.js";
import { hackerrankAdapter } from "./hackerrank.js";
import { hackearthAdapter } from "./hackerearth.js";
import { makeStubAdapter } from "./generic.js";
import type { PlatformAdapter } from "./types.js";

export * from "./registry.js";
export * from "./types.js";

const adapters: PlatformAdapter[] = [
  leetcodeAdapter,
  codeforcesAdapter,
  atcoderAdapter,
  codechefAdapter,
  geeksforgeeksAdapter,
  hackerrankAdapter,
  hackearthAdapter,
  makeStubAdapter("cses", "CSES", "CSES does not provide a public submissions API."),
  makeStubAdapter("interviewbit", "InterviewBit", "InterviewBit does not provide a public submissions API."),
  makeStubAdapter("spoj", "SPOJ", "SPOJ does not provide a public submissions API."),
  makeStubAdapter("topcoder", "TopCoder", "TopCoder public API access is limited. Manual sync not supported."),
  makeStubAdapter("codingninjas", "Coding Ninjas", "Coding Ninjas (Code360) does not provide a public submissions API. Manual sync not supported."),
];

export const ADAPTER_MAP = new Map(adapters.map((a) => [a.platformId, a]));
