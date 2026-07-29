import { Link, useLocation } from "wouter";
import { Activity, Calendar, LayoutDashboard, Search, Settings, Share2, TrendingUp, BarChart2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/timeline", label: "Timeline", icon: Layers },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/platforms", label: "Platforms", icon: Share2 },
  { href: "/insights", label: "Insights", icon: TrendingUp },
  { href: "/search", label: "Search", icon: Search },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex-shrink-0 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
            <span className="text-primary text-xs leading-none">{'</>'}</span>
          </div>
          CodeHub
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 px-2">Menu</div>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all cursor-pointer group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}>
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <Link href="/settings">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all cursor-pointer">
            <Settings className="w-4 h-4" />
            Settings
          </div>
        </Link>
      </div>
    </aside>
  );
}
