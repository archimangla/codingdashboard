import { Bell, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useSyncAllPlatforms, useGetUserProfile } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function Topbar() {
  const { data: profile } = useGetUserProfile({ query: { enabled: true } });
  const syncAll = useSyncAllPlatforms();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAll = () => {
    setIsSyncing(true);
    syncAll.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Sync complete", description: "All connected platforms have been synced." });
        setIsSyncing(false);
      },
      onError: () => {
        toast({ title: "Sync failed", description: "Failed to sync platforms.", variant: "destructive" });
        setIsSyncing(false);
      }
    });
  };

  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center w-full max-w-md">
        <Link href="/search" className="w-full">
          <div className="relative group cursor-text w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="h-9 w-full rounded-md border border-input bg-muted/50 pl-10 pr-4 flex items-center text-sm text-muted-foreground group-hover:border-primary/50 transition-colors">
              Search submissions, problems...
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleSyncAll}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
          <span>Sync All</span>
        </Button>
        
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
        </Button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm ring-2 ring-background cursor-pointer">
          {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
