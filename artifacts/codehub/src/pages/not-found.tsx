import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
      <div className="text-6xl font-black font-mono text-primary">404</div>
      <h2 className="text-2xl font-bold tracking-tight">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button asChild className="mt-4">
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
