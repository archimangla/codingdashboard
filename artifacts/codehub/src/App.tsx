import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/layout/Shell';

import Dashboard from '@/pages/dashboard';
import Onboarding from '@/pages/onboarding';
import Activity from '@/pages/activity';
import Calendar from '@/pages/calendar';
import Timeline from '@/pages/timeline';
import Platforms from '@/pages/platforms';
import PlatformDetail from '@/pages/platform-detail';
import Analytics from '@/pages/analytics';
import Search from '@/pages/search';
import Insights from '@/pages/insights';
import Settings from '@/pages/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/activity" component={Activity} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/timeline" component={Timeline} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/platforms" component={Platforms} />
        <Route path="/platforms/:platformId" component={PlatformDetail} />
        <Route path="/search" component={Search} />
        <Route path="/insights" component={Insights} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
