import { useParams, Link } from "wouter";
import { useGetPlatformStats, useSyncPlatform } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlatformIcon } from "@/components/PlatformIcon";
import { getDifficultyColor, formatDate } from "@/lib/utils";
import { RefreshCw, Trophy, Star, Target, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function PlatformDetail() {
  const { platformId } = useParams<{ platformId: string }>();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const syncMutation = useSyncPlatform();

  const { data: stats, isLoading, refetch } = useGetPlatformStats(platformId || "", {
    query: {
      enabled: !!platformId
    }
  });

  const handleSync = () => {
    if (!platformId) return;
    setIsSyncing(true);
    syncMutation.mutate({ platformId }, {
      onSuccess: () => {
        toast({ title: "Sync successful", description: "Platform data is up to date." });
        refetch();
        setIsSyncing(false);
      },
      onError: () => {
        toast({ title: "Sync failed", description: "Could not sync platform data.", variant: "destructive" });
        setIsSyncing(false);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Platform Not Found</h2>
        <p className="text-muted-foreground mt-2">Make sure it's connected first.</p>
        <Button asChild className="mt-4"><Link href="/platforms">Go Back</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/platforms"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center border border-border shrink-0">
          {getPlatformIcon(stats.platformId, "w-8 h-8")}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{stats.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">{stats.handle}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleSync}
          disabled={isSyncing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
          Sync
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" /> Total Solved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{stats.totalSolved}</div>
          </CardContent>
        </Card>
        
        {stats.rating != null && (
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-[#FFD600]" /> Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{stats.rating}</div>
            </CardContent>
          </Card>
        )}

        {stats.ranking != null && (
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-secondary" /> Global Rank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">#{stats.ranking.toLocaleString()}</div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" /> Acceptance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {stats.acceptanceRate ? `${stats.acceptanceRate.toFixed(1)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Difficulty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#00E676] font-medium">Easy</span>
                <span className="font-mono">{stats.easySolved}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-[#00E676]" 
                  style={{ width: `${(stats.easySolved / Math.max(1, stats.totalSolved)) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#FFD600] font-medium">Medium</span>
                <span className="font-mono">{stats.mediumSolved}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-[#FFD600]" 
                  style={{ width: `${(stats.mediumSolved / Math.max(1, stats.totalSolved)) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#FF3366] font-medium">Hard</span>
                <span className="font-mono">{stats.hardSolved}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-[#FF3366]" 
                  style={{ width: `${(stats.hardSolved / Math.max(1, stats.totalSolved)) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentSubmissions && stats.recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentSubmissions.map((sub) => (
                  <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background/30 hover:bg-accent/50 transition-colors">
                    <div>
                      <div className="font-medium text-sm hover:text-primary transition-colors cursor-pointer">
                        {sub.problemUrl ? (
                          <a href={sub.problemUrl} target="_blank" rel="noopener noreferrer">{sub.problemName}</a>
                        ) : sub.problemName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center">
                        {sub.topic && <span>{sub.topic}</span>}
                        {sub.topic && sub.language && <span className="w-1 h-1 rounded-full bg-border" />}
                        {sub.language && <span>{sub.language}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      {sub.difficulty && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-background border ${getDifficultyColor(sub.difficulty)}`}>
                          {sub.difficulty}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatDate(sub.solvedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No recent submissions found.</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
