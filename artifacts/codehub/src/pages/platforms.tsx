import { useState } from "react";
import { useListPlatforms, useConnectPlatform, useDisconnectPlatform } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlatformIcon } from "@/components/PlatformIcon";
import { Link } from "wouter";
import { ExternalLink, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Platforms() {
  const { data: platforms, isLoading, refetch } = useListPlatforms();
  const { toast } = useToast();
  
  const connectPlatform = useConnectPlatform();
  const disconnectPlatform = useDisconnectPlatform();
  
  const [connectingId, setConnectingId] = useState<string | null>(null);
  // per-platform handle inputs so typing in one doesn't bleed into another
  const [handles, setHandles] = useState<Record<string, string>>({});

  const handleConnect = (platformId: string) => {
    const handle = handles[platformId]?.trim();
    if (!handle) return;
    
    connectPlatform.mutate({
      platformId,
      data: { handle }
    }, {
      onSuccess: () => {
        toast({ title: "Platform connected!" });
        setConnectingId(null);
        setHandles((prev) => ({ ...prev, [platformId]: "" }));
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to connect", variant: "destructive" });
      }
    });
  };

  const handleDisconnect = (platformId: string) => {
    disconnectPlatform.mutate({ platformId }, {
      onSuccess: () => {
        toast({ title: "Platform disconnected" });
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platforms</h1>
          <p className="text-muted-foreground">Manage your connected coding profiles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </>
        ) : (
          platforms?.map((platform) => (
            <Card key={platform.id} className={`overflow-hidden transition-all ${!platform.connected && connectingId !== platform.id ? 'opacity-60 hover:opacity-100' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-background flex items-center justify-center border border-border">
                    {getPlatformIcon(platform.id, "w-6 h-6")}
                  </div>
                  <CardTitle className="text-base">{platform.name}</CardTitle>
                </div>
                {platform.connected ? (
                  <Badge variant="outline" className="text-[#00E676] bg-[#00E676]/10 border-[#00E676]/20">Connected</Badge>
                ) : (
                  <Badge variant="outline">Disconnected</Badge>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {platform.connected ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Handle</span>
                      <span className="font-mono font-medium">{platform.handle}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total Solved</span>
                      <span className="font-mono font-bold text-primary">{platform.totalSolved || 0}</span>
                    </div>
                    {platform.syncStatus === 'error' && (
                      <div className="flex items-center gap-2 text-xs text-destructive mt-2">
                        <AlertCircle className="w-3 h-3" />
                        Sync failed
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <Button variant="ghost" size="sm" onClick={() => handleDisconnect(platform.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8">
                        Disconnect
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="h-8">
                        <Link href={`/platforms/${platform.id}`}>View Stats <ExternalLink className="ml-2 w-3 h-3" /></Link>
                      </Button>
                    </div>
                  </div>
                ) : connectingId === platform.id ? (
                  <div className="space-y-3 pt-2">
                    <Input 
                      placeholder="Username or URL" 
                      value={handles[platform.id] ?? ""}
                      onChange={e => setHandles(prev => ({ ...prev, [platform.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleConnect(platform.id)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConnectingId(null)}>Cancel</Button>
                      <Button size="sm" className="flex-1" onClick={() => handleConnect(platform.id)} disabled={!handles[platform.id]?.trim() || connectPlatform.isPending}>
                        {connectPlatform.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <Button variant="secondary" size="sm" onClick={() => setConnectingId(platform.id)}>
                      Connect {platform.name}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
