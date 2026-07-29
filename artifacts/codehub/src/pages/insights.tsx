import { useGetInsights } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, AlertTriangle, TrendingUp, Target, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Insights() {
  const { data: insights, isLoading } = useGetInsights();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="w-6 h-6 text-[#FFD600]" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-destructive" />;
      case 'trend': return <TrendingUp className="w-6 h-6 text-primary" />;
      case 'milestone': return <Target className="w-6 h-6 text-[#00E676]" />;
      default: return <Bell className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'from-[#FFD600]/20 to-transparent border-[#FFD600]/30';
      case 'warning': return 'from-destructive/20 to-transparent border-destructive/30';
      case 'trend': return 'from-primary/20 to-transparent border-primary/30';
      case 'milestone': return 'from-[#00E676]/20 to-transparent border-[#00E676]/30';
      default: return 'from-muted to-transparent border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pt-6">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">Auto-generated analysis of your performance.</p>
      </div>

      <div className="space-y-4">
        {insights?.map(insight => (
          <Card key={insight.id} className={`bg-gradient-to-r ${getInsightColor(insight.type)}`}>
            <CardContent className="p-6 flex gap-4">
              <div className="shrink-0 mt-1">
                {getInsightIcon(insight.type)}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{insight.message}</h3>
                {insight.detail && (
                  <p className="text-muted-foreground text-sm leading-relaxed">{insight.detail}</p>
                )}
                <div className="text-xs text-muted-foreground font-mono mt-4 opacity-50">
                  {new Date(insight.generatedAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!insights || insights.length === 0) && (
          <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
            No insights generated yet. Keep coding to generate data!
          </div>
        )}
      </div>
    </div>
  );
}
