import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AppLayout from "@/components/AppLayout";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ApiKeyManagement from "@/pages/api-key-management";
import PropertiesPage from "@/pages/properties-page";
import SearchPage from "@/pages/search-page";
import MarketAnalysisPage from "@/pages/market-analysis-page";
import PropertyComparisonPage from "@/pages/property-comparison-page";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/properties" component={PropertiesPage} />
      <ProtectedRoute path="/search" component={SearchPage} />
      <ProtectedRoute path="/market-analysis" component={MarketAnalysisPage} />
      <ProtectedRoute path="/property-comparison" component={PropertyComparisonPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/api-keys" component={ApiKeyManagement} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <AppLayout>
            <Router />
          </AppLayout>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
