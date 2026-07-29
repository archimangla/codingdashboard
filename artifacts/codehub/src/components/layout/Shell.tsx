import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useGetUserProfile } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [location, setLocation] = useLocation();
  const { data: profile, isLoading, isError } = useGetUserProfile();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex bg-background">
        <Skeleton className="w-64 h-full rounded-none" />
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-16 w-full rounded-none border-b border-border/50" />
          <div className="p-8">
            <Skeleton className="h-32 w-full mb-8" />
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is completely unauthenticated or doesn't exist, we might get 404 or 401
  // For this mock/demo, we assume 404 means they need to onboard
  if ((isError || (profile && !profile.onboardingComplete)) && location !== "/onboarding") {
    // We defer navigation slightly to avoid react warnings about updating state during render
    setTimeout(() => setLocation("/onboarding"), 0);
    return null;
  }

  // If we are on onboarding, we don't show the standard shell
  if (location === "/onboarding") {
    return <div className="h-[100dvh] bg-background w-full overflow-hidden text-foreground">{children}</div>;
  }

  return (
    <div className="h-[100dvh] w-full flex bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Glow effect behind content */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <Topbar />
        <main className="flex-1 overflow-y-auto z-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
