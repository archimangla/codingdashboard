import { useState, useEffect } from "react";
import { useGetUserProfile, useUpdateUserProfile, useListPlatforms } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getPlatformIcon } from "@/components/PlatformIcon";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User, Share2, Trash2 } from "lucide-react";

export default function Settings() {
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const { data: platforms, isLoading: platformsLoading } = useListPlatforms();
  const updateProfile = useUpdateUserProfile();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  // handles keyed by platformId
  const [handles, setHandles] = useState<Record<string, string>>({});

  // Initialise form from loaded profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      const h: Record<string, string> = {};
      for (const p of profile.platforms ?? []) {
        h[p.platformId] = p.handle;
      }
      setHandles(h);
    }
  }, [profile]);

  const handleSave = () => {
    const platformsPayload = Object.entries(handles)
      .filter(([, h]) => h.trim() !== "")
      .map(([platformId, handle]) => ({ platformId, handle: handle.trim() }));

    updateProfile.mutate(
      { data: { displayName: displayName.trim() || undefined, platforms: platformsPayload } },
      {
        onSuccess: () => toast({ title: "Settings saved" }),
        onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
      },
    );
  };

  const isLoading = profileLoading || platformsLoading;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and platform credentials.</p>
      </div>

      {/* Profile section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription className="text-xs">Your display name shown across the dashboard.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="bg-background/50"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform credentials section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Platform Handles</CardTitle>
              <CardDescription className="text-xs">
                Enter your username for each platform. Leave blank to skip.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {platforms?.map((platform) => (
                <div key={platform.id} className="flex items-center gap-4 py-3">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                    {getPlatformIcon(platform.id, "w-4 h-4")}
                  </div>
                  <span className="text-sm font-medium w-36 shrink-0">{platform.name}</span>
                  <Input
                    className="h-8 text-sm bg-background/50 font-mono"
                    placeholder={`${platform.name} username`}
                    value={handles[platform.id] ?? ""}
                    onChange={(e) =>
                      setHandles((prev) => ({ ...prev, [platform.id]: e.target.value }))
                    }
                  />
                  {handles[platform.id]?.trim() && (
                    <button
                      onClick={() => setHandles((prev) => ({ ...prev, [platform.id]: "" }))}
                      className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      title="Clear"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading || updateProfile.isPending} className="min-w-32">
          {updateProfile.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
