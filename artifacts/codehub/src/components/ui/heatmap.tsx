import React from 'react';
import { DayCount } from '@workspace/api-client-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapProps {
  data: DayCount[];
}

export function Heatmap({ data }: HeatmapProps) {
  // We need 52 weeks of 7 days
  const weeks = 52;
  const daysInWeek = 7;
  
  // Create a map of date string (YYYY-MM-DD) to count
  const countMap = new Map<string, number>();
  let maxCount = 0;
  
  data.forEach(d => {
    countMap.set(d.date.split('T')[0], d.count);
    if (d.count > maxCount) maxCount = d.count;
  });

  const today = new Date();
  const days = [];
  
  // Generate the last 364 days (52 weeks)
  for (let i = weeks * daysInWeek - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  // Split into columns (weeks)
  const columns = [];
  for (let i = 0; i < weeks; i++) {
    columns.push(days.slice(i * daysInWeek, (i + 1) * daysInWeek));
  }

  const getColor = (count: number) => {
    if (count === 0) return 'bg-[#161B22]'; // Empty state
    if (maxCount === 0) return 'bg-[#161B22]';
    
    const ratio = count / maxCount;
    if (ratio < 0.25) return 'bg-primary/30';
    if (ratio < 0.5) return 'bg-primary/50';
    if (ratio < 0.75) return 'bg-primary/80';
    return 'bg-primary';
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Find which columns start a new month for labels
  const monthLabels = [];
  let currentMonth = -1;
  columns.forEach((col, i) => {
    const month = col[0].getMonth();
    if (month !== currentMonth) {
      monthLabels.push({ text: months[month], colIndex: i });
      currentMonth = month;
    }
  });

  return (
    <div className="flex flex-col gap-2">
      {/* Month Labels */}
      <div className="flex text-xs text-muted-foreground mb-1 relative h-4">
        {monthLabels.map((ml, i) => (
          <div 
            key={i} 
            className="absolute"
            style={{ left: `${(ml.colIndex / weeks) * 100}%` }}
          >
            {ml.text}
          </div>
        ))}
      </div>
      
      {/* Heatmap Grid */}
      <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-2">
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col gap-1 shrink-0">
            {col.map((day, j) => {
              const dateStr = day.toISOString().split('T')[0];
              const count = countMap.get(dateStr) || 0;
              return (
                <Tooltip key={j}>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-3 h-3 rounded-sm ${getColor(count)} transition-colors hover:ring-1 hover:ring-white`}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-card text-card-foreground border-border">
                    <p className="font-medium text-sm">{count} submissions</p>
                    <p className="text-xs text-muted-foreground">{dateStr}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-2">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-[#161B22]"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/30"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/50"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/80"></div>
          <div className="w-3 h-3 rounded-sm bg-primary"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
