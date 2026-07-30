import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useListActivity, ListActivityDifficulty } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPlatformIcon } from "@/components/PlatformIcon";
import { getDifficultyColor, formatTime, formatDate } from "@/lib/utils";
import { Filter, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Activity() {
  const [page, setPage] = useState(1);
  const [difficulty, setDifficulty] = useState<ListActivityDifficulty>("all");
  const [acceptedOnly, setAcceptedOnly] = useState(false);
  const [contestOnly, setContestOnly] = useState(false);

  const { data, isLoading } = useListActivity(
    {
      difficulty: difficulty === "all" ? undefined : difficulty,
      accepted_only: acceptedOnly ? true : undefined,
      contest_only: contestOnly ? true : undefined,
      page,
      limit: 20
    },
    {
      query: {
        placeholderData: keepPreviousData
      }
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground">All your submissions in one place.</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant={difficulty === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => { setDifficulty("all"); setPage(1); }}
          >
            All
          </Button>
          <Button 
            variant={difficulty === "easy" ? "default" : "outline"} 
            size="sm"
            className={difficulty === "easy" ? "bg-difficulty-easy/20 text-[#00E676] hover:bg-difficulty-easy/30" : ""}
            onClick={() => { setDifficulty("easy"); setPage(1); }}
          >
            Easy
          </Button>
          <Button 
            variant={difficulty === "medium" ? "default" : "outline"} 
            size="sm"
            className={difficulty === "medium" ? "bg-difficulty-medium/20 text-[#FFD600] hover:bg-difficulty-medium/30" : ""}
            onClick={() => { setDifficulty("medium"); setPage(1); }}
          >
            Medium
          </Button>
          <Button 
            variant={difficulty === "hard" ? "default" : "outline"} 
            size="sm"
            className={difficulty === "hard" ? "bg-difficulty-hard/20 text-[#FF3366] hover:bg-difficulty-hard/30" : ""}
            onClick={() => { setDifficulty("hard"); setPage(1); }}
          >
            Hard
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button 
            variant={acceptedOnly ? "default" : "outline"} 
            size="sm"
            onClick={() => { setAcceptedOnly(!acceptedOnly); setPage(1); }}
          >
            Accepted Only
          </Button>
          <Button 
            variant={contestOnly ? "default" : "outline"} 
            size="sm"
            onClick={() => { setContestOnly(!contestOnly); setPage(1); }}
          >
            Contests
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center p-4 border-b border-border/50">
                  <Skeleton className="w-8 h-8 rounded shrink-0 mr-4" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-20 text-center">
              <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No activity found</h3>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {data.items.map((sub) => (
                <div key={sub.id} className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-md bg-background/50 border border-border flex items-center justify-center shrink-0">
                    {getPlatformIcon(sub.platformId, "w-5 h-5")}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {sub.problemUrl ? (
                          <a href={sub.problemUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {sub.problemName}
                          </a>
                        ) : sub.problemName}
                      </h4>
                      {sub.status === 'accepted' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">{sub.platformName}</span>
                      
                      {sub.topic && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>{sub.topic}</span>
                        </>
                      )}
                      
                      {sub.language && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>{sub.language}</span>
                        </>
                      )}
                      
                      {sub.isContest && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-secondary font-medium">Contest</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:justify-end shrink-0">
                    {sub.difficulty && (
                      <Badge variant="outline" className={`border-current bg-transparent ${getDifficultyColor(sub.difficulty)}`}>
                        {sub.difficulty}
                      </Badge>
                    )}
                    <div className="text-right text-xs text-muted-foreground w-24">
                      <div className="font-mono">{formatDate(sub.solvedAt)}</div>
                      <div className="font-mono opacity-70">{formatTime(sub.solvedAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total > data.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * data.limit + 1} to {Math.min(page * data.limit, data.total)} of {data.total} submissions
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!data.hasMore}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
