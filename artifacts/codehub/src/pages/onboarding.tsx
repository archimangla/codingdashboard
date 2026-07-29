import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateUserProfile, useListPlatforms, useGetUserProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getPlatformIcon } from "@/components/PlatformIcon";
import { ArrowRight, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Also check if already onboarded to avoid showing this page
  const { data: profile, isSuccess } = useGetUserProfile();
  
  useEffect(() => {
    if (isSuccess && profile?.onboardingComplete) {
      setLocation("/");
    }
  }, [isSuccess, profile, setLocation]);

  const { data: platforms, isLoading: platformsLoading } = useListPlatforms();
  const createProfile = useCreateUserProfile();


  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [handles, setHandles] = useState<Record<string, string>>({});

  const handleNext = () => {
    if (step === 1 && !displayName.trim()) {
      toast({ title: "Name required", description: "Please enter a display name to continue.", variant: "destructive" });
      return;
    }
    if (step === 1) setStep(2);
  };

  const handleComplete = () => {
    const connectedPlatforms = Object.entries(handles)
      .filter(([_, handle]) => handle.trim() !== "")
      .map(([platformId, handle]) => ({ platformId, handle }));

    createProfile.mutate({
      data: {
        displayName,
        platforms: connectedPlatforms
      }
    }, {
      onSuccess: () => {
        toast({ title: "Setup complete!", description: "Welcome to CodeHub." });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create profile. Please try again.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-2xl border-border/50 bg-card/50 backdrop-blur-xl relative z-10 shadow-2xl shadow-primary/5">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/50 mb-6">
            <span className="text-primary text-xl font-bold leading-none">{'</>'}</span>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {step === 1 ? "Welcome to CodeHub" : "Connect Your Platforms"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {step === 1 
              ? "Your personal command center for competitive programming."
              : "Link your coding profiles to aggregate your activity in one place."}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-10 pb-10">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">What should we call you?</label>
                <Input 
                  placeholder="e.g. John Doe or jdoe99" 
                  className="h-12 text-lg bg-background/50"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  autoFocus
                />
              </div>
              <Button 
                className="w-full h-12 text-lg" 
                onClick={handleNext}
                disabled={!displayName.trim()}
              >
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              {platformsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {platforms?.map((platform) => (
                    <div key={platform.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background/30 group hover:border-primary/30 transition-colors">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                        {getPlatformIcon(platform.id, "w-5 h-5")}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{platform.name}</h4>
                        <Input 
                          placeholder={`${platform.name} Handle or URL`}
                          className="h-8 mt-1 text-sm bg-transparent border-none px-0 focus-visible:ring-0 focus-visible:border-b-primary rounded-none border-b border-border placeholder:text-muted-foreground/50"
                          value={handles[platform.id] || ""}
                          onChange={(e) => setHandles({...handles, [platform.id]: e.target.value})}
                        />
                      </div>
                      <div className="shrink-0">
                        {handles[platform.id]?.trim() ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/50" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="px-8">
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleComplete}
                  disabled={createProfile.isPending}
                >
                  {createProfile.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Complete Setup <ChevronRight className="ml-1 w-5 h-5" /></>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
