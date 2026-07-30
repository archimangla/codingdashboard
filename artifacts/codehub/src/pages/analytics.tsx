import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useGetWeeklyAnalytics, useGetMonthlyAnalytics, useGetYearlyAnalytics } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

export default function Analytics() {
  const [tab, setTab] = useState("weekly");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your performance data.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="weekly" className="m-0 space-y-6">
            <WeeklyView />
          </TabsContent>
          <TabsContent value="monthly" className="m-0 space-y-6">
            <MonthlyView />
          </TabsContent>
          <TabsContent value="yearly" className="m-0 space-y-6">
            <YearlyView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function WeeklyView() {
  const { data, isLoading } = useGetWeeklyAnalytics(undefined, {
    query: { placeholderData: keepPreviousData }
  });

  if (isLoading) return <AnalyticsSkeleton />;
  if (!data) return <div className="text-muted-foreground text-center py-10">No data available</div>;

  const difficultyData = [
    { name: 'Easy', value: data.difficultyBreakdown.easy, color: '#00E676' },
    { name: 'Medium', value: data.difficultyBreakdown.medium, color: '#FFD600' },
    { name: 'Hard', value: data.difficultyBreakdown.hard, color: '#FF3366' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="col-span-1 md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Problems solved this week</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailyCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })} axisLine={false} tickLine={false} tick={{ fill: '#8A94A6', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8A94A6', fontSize: 12 }} />
              <RechartsTooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: '#12161E', border: '1px solid #1D2330', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#00F0FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Difficulty Split</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex flex-col items-center justify-center relative">
          {difficultyData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={difficultyData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#12161E', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-4">
                <span className="text-3xl font-bold font-mono">{data.totalSolved}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </>
          ) : (
            <span className="text-muted-foreground">No data</span>
          )}
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Top Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.topicBreakdown.map(topic => (
              <div key={topic.topic} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                <span className="text-sm">{topic.topic}</span>
                <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 rounded-sm">{topic.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MonthlyView() {
  const date = new Date();
  const { data, isLoading } = useGetMonthlyAnalytics(
    {
      month: date.getMonth() + 1,
      year: date.getFullYear()
    },
    {
      query: { placeholderData: keepPreviousData }
    }
  );

  if (isLoading) return <AnalyticsSkeleton />;
  if (!data) return <div className="text-muted-foreground text-center py-10">No data available</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Solved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-black font-mono text-primary">{data.totalSolved}</div>
          <p className="text-xs text-muted-foreground mt-1">Average {data.avgPerDay.toFixed(1)} / day</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Best Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-black font-mono text-emerald-500">{data.bestDay.count}</div>
          <p className="text-xs text-muted-foreground mt-1">On {new Date(data.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Longest Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-black font-mono text-orange-500">{data.longestStreak}</div>
          <p className="text-xs text-muted-foreground mt-1">Days in a row</p>
        </CardContent>
      </Card>

      {data.dailyCounts && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle>Daily Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={d => new Date(d).getDate().toString()} axisLine={false} tickLine={false} tick={{ fill: '#8A94A6', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8A94A6', fontSize: 12 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#12161E', border: '1px solid #1D2330', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="count" stroke="#6C5CE7" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function YearlyView() {
  const year = new Date().getFullYear();
  const { data, isLoading } = useGetYearlyAnalytics(
    { year },
    {
      query: { placeholderData: keepPreviousData }
    }
  );

  if (isLoading) return <AnalyticsSkeleton />;
  if (!data) return <div className="text-muted-foreground text-center py-10">No data available</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Progress</CardTitle>
          <CardDescription>Problems solved per month in {data.year}</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tickFormatter={m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} axisLine={false} tickLine={false} tick={{ fill: '#8A94A6', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8A94A6', fontSize: 12 }} />
              <RechartsTooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: '#12161E', border: '1px solid #1D2330', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#00E676" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
