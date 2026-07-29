import { useState } from "react";
import { useGetActivityCalendar } from "@workspace/api-client-react";
import { Heatmap } from "@/components/ui/heatmap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Calendar() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<string>(currentYear.toString());

  const { data: calendarData, isLoading } = useGetActivityCalendar({
    query: {
      queryKey: ['calendar', parseInt(year)],
      keepPreviousData: true
    },
    year: parseInt(year)
  });

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contribution Calendar</h1>
          <p className="text-muted-foreground">Detailed view of your coding history.</p>
        </div>
        
        <div className="w-32">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 overflow-x-auto">
          {isLoading ? (
            <Skeleton className="w-full h-48" />
          ) : (
            <div className="min-w-[700px]">
              <Heatmap data={calendarData || []} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
