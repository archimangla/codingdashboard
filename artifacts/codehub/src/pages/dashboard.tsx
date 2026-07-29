import { useGetDashboardOverview, useGetTodayActivity, useGetStreakInfo } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flame, Trophy, CalendarDays, Target, AlertTriangle } from "lucide-react";
import { getPlatformIcon } from "@/components/PlatformIcon";
import { getDifficultyColor, formatTime } from "@/lib/utils";
import { Heatmap } from "@/components/ui/heatmap";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useGetDashboardOverview();
  const { data: todayActivity, isLoading: todayLoading } = useGetTodayActivity();
  const { data: streak, isLoading: streakLoading } = useGetStreakInfo();

  if (overviewLoading || streakLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Fallback data structure to show empty states correctly
  const stats = overview || {
    totalSolved: 0,
    activeDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    todaySolved: 0,
    platformBreakdown: [],
    streakAtRisk: false,
    weeklyActivity: []
  };

  const streakData = streak || {
    currentStreak: 0,
    longestStreak: 0,
    streakAtRisk: false,
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Alerts */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Your coding activity at a glance.</p>
        
        {stats.streakAtRisk && (
          <div className="mt-2 flex items-center gap-2 px-4 py-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-medium">Your streak is at risk! Solve a problem today to keep it going.</span>
          </div>
        )}
        {!stats.streakAtRisk && stats.currentStreak === 0 && (
          <div className="mt-2 flex items-center gap-2 px-4 py-3 rounded-md bg-primary/10 text-primary border border-primary/20 animate-in fade-in slide-in-from-top-2">
            <Target className="w-5 h-5 shrink-0" />
            <span className="font-medium">Let's start a new streak today!</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50 border-card-border overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono text-orange-500">
              {streakData.currentStreak} <span className="text-lg font-sans font-normal text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Best: {streakData.longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-card-border overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Solved</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono text-primary">
              {stats.totalSolved}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {stats.platformBreakdown?.length || 0} platforms
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-card-border overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Output</CardTitle>
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono text-secondary">
              {stats.todaySolved}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium text-[#00E676]">{stats.todayEasy || 0} E</span>
              <span className="text-xs font-medium text-[#FFD600]">{stats.todayMedium || 0} M</span>
              <span className="text-xs font-medium text-[#FF3366]">{stats.todayHard || 0} H</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-card-border overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Days</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono text-emerald-500">
              {stats.activeDays}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total coding days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap / Activity Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contribution Calendar</CardTitle>
            <CardDescription>Your coding activity over the last 52 weeks</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto pb-6">
            <div className="min-w-[700px] p-2">
              <Heatmap data={stats.weeklyActivity || []} />
            </div>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
            <CardDescription>Where you solve the most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.platformBreakdown?.map((platform) => (
                <div key={platform.platformId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-background/50 flex items-center justify-center">
                      {getPlatformIcon(platform.platformId)}
                    </div>
                    <span className="font-medium text-sm">{platform.platformName}</span>
                  </div>
                  <span className="font-mono text-sm">{platform.count}</span>
                </div>
              ))}
              {(!stats.platformBreakdown || stats.platformBreakdown.length === 0) && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No platform data yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity Mini-feed */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Activity</CardTitle>
          <CardDescription>Problems you've solved today</CardDescription>
        </CardHeader>
        <CardContent>
          {todayLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : todayActivity && todayActivity.length > 0 ? (
            <div className="space-y-3">
              {todayActivity.map((sub) => (
                <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background/30 hover:bg-accent/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-background shrink-0 flex items-center justify-center">
                      {getPlatformIcon(sub.platformId)}
                    </div>
                    <div>
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">
                        {sub.problemName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>{sub.platformName}</span>
                        {sub.isContest && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-secondary">Contest</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:justify-end">
                    {sub.difficulty && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-background border ${getDifficultyColor(sub.difficulty)}`}>
                        {sub.difficulty}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTime(sub.solvedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No problems solved today.</p>
              <p className="text-xs text-muted-foreground mt-1">Time to break out the editor!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
