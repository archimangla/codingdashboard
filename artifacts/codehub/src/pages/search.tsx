import { useState, useEffect } from "react";
import { useSearch } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2, ArrowRight } from "lucide-react";
import { getPlatformIcon } from "@/components/PlatformIcon";
import { getDifficultyColor, formatTime, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useSearch({
    query: {
      queryKey: ['search', debouncedQuery],
      enabled: debouncedQuery.length > 1,
      keepPreviousData: true
    },
    q: debouncedQuery,
    limit: 50
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pt-6">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
        <Input 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search problems, topics, tags..." 
          className="w-full h-16 pl-14 pr-4 text-xl rounded-2xl bg-card border-card-border shadow-lg shadow-black/20 focus-visible:ring-primary/50"
          autoFocus
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
        )}
      </div>

      {!debouncedQuery || debouncedQuery.length <= 1 ? (
        <div className="text-center py-20 opacity-50">
          <SearchIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">Type at least 2 characters to search</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.items.map(sub => (
             <div key={sub.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/50 hover:bg-card transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-background flex items-center justify-center shrink-0 border border-border">
                  {getPlatformIcon(sub.platformId)}
                </div>
                <div>
                  <h4 className="font-semibold group-hover:text-primary transition-colors">{sub.problemName}</h4>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                    <span>{sub.platformName}</span>
                    {sub.topic && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border self-center" />
                        <span>{sub.topic}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:justify-end">
                {sub.difficulty && (
                  <Badge variant="outline" className={`border-current bg-transparent ${getDifficultyColor(sub.difficulty)}`}>
                    {sub.difficulty}
                  </Badge>
                )}
                <div className="text-xs text-muted-foreground font-mono text-right w-24">
                  {formatDate(sub.solvedAt)}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all -translate-x-2 group-hover:translate-x-0" />
              </div>
             </div>
          ))}
          {data?.items.length === 0 && !isLoading && (
            <div className="text-center py-20 text-muted-foreground">
              No results found for "{debouncedQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
