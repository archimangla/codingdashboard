export interface RawSubmission {
  externalId?: string;
  platformId: string;
  platformName: string;
  problemName: string;
  problemUrl?: string;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
  language?: string;
  status: "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "compilation_error" | "unknown";
  isContest: boolean;
  solvedAt: Date;
  timeTakenMs?: number;
  companyTags?: string[];
}

export interface PlatformAdapterResult {
  submissions: RawSubmission[];
  totalSolved?: number;
  rating?: number;
  ranking?: number;
  error?: string;
}

export interface PlatformAdapter {
  platformId: string;
  fetch(handle: string): Promise<PlatformAdapterResult>;
}
