import { useGetTimeline } from "@workspace/api-client-react";
import { getPlatformIcon } from "@/components/PlatformIcon";
import { getDifficultyColor, formatTime, formatDate } from "@/lib/utils";
import { Loader2, CalendarDays } from "lucide-react";

export default function Timeline() {
  const { data, isLoading } = useGetTimeline({ limit: 50 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timeline</h1>
        <p className="text-muted-foreground">Chronological view of your journey.</p>
      </div>

      {(!data?.groups || data.groups.length === 0) ? (
        <div className="py-20 text-center text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No activity yet</p>
          <p className="text-sm mt-1">Connect a platform and sync to see your timeline.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {data.groups.map((group) => (
            <div key={group.date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold font-mono text-primary uppercase tracking-widest">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground font-mono">{group.submissions.length} solved</span>
              </div>

              {/* Submissions */}
              <div className="relative border-l border-border/40 ml-2 pl-6 space-y-3">
                {group.submissions.map((sub) => (
                  <div key={sub.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[29px] top-3.5 w-2 h-2 rounded-full bg-primary/60 ring-4 ring-background" />

                    <div className="group flex items-start gap-4 bg-card/30 border border-border/50 p-4 rounded-xl hover:border-primary/30 hover:bg-card/50 transition-all">
                      <div className="w-9 h-9 rounded-lg bg-background shrink-0 flex items-center justify-center border border-border">
                        {getPlatformIcon(sub.platformId, "w-5 h-5")}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                          {sub.problemUrl ? (
                            <a href={sub.problemUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {sub.problemName}
                            </a>
                          ) : sub.problemName}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span className="font-medium text-foreground/70">{sub.platformName}</span>

                          {sub.difficulty && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border/80" />
                              <span className={`${getDifficultyColor(sub.difficulty)} font-semibold capitalize`}>{sub.difficulty}</span>
                            </>
                          )}

                          {sub.topic && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border/80" />
                              <span>{sub.topic}</span>
                            </>
                          )}

                          {sub.language && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border/80" />
                              <span className="font-mono">{sub.language}</span>
                            </>
                          )}

                          {sub.isContest && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border/80" />
                              <span className="text-secondary font-medium">Contest</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5 text-right">
                        {formatTime(sub.solvedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
