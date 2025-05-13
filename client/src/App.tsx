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
import AttomSearch from "@/pages/AttomSearch";
import AttomSearchHelp from "@/pages/attom-search-help";
import MarketAnalysisPage from "@/pages/market-analysis-page";
import MapVisualizationPage from "@/pages/map-visualization";
import PropertyComparisonPage from "@/pages/property-comparison-page";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import FinancialCalculatorsPage from "@/pages/financial-calculators";
import AIMarketAnalysisPage from "@/pages/ai-market-analysis";
import PropertyAnalyzerPage from "@/pages/property-analyzer";
import CompMatchingPage from "@/pages/comp-matching";
import CMAReportPage from "@/pages/cma-report";
import SharedPropertiesPage from "@/pages/shared-properties";
import SharedPropertyView from "@/pages/shared-property-view";
import CollaborationTeamsPage from "@/pages/collaboration-teams";
import ApiKeysManager from "@/pages/not-found";
import RentalPropertiesPage from "@/pages/rental-properties";
import RentalAnalysisPage from "@/pages/rental-analysis";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/properties" component={PropertiesPage} />
      <ProtectedRoute path="/search" component={SearchPage} />
      <ProtectedRoute path="/attom-search" component={AttomSearch} />
      <ProtectedRoute path="/attom-search-help" component={AttomSearchHelp} />
      <ProtectedRoute path="/market-analysis" component={MarketAnalysisPage} />
      <ProtectedRoute path="/ai-market-analysis" component={AIMarketAnalysisPage} />
      <ProtectedRoute path="/property-analyzer" component={PropertyAnalyzerPage} />
      <ProtectedRoute path="/comp-matching" component={CompMatchingPage} />
      <ProtectedRoute path="/cma-report" component={CMAReportPage} />
      <ProtectedRoute path="/map-visualization" component={MapVisualizationPage} />
      <ProtectedRoute path="/property-comparison" component={PropertyComparisonPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/financial-calculators" component={FinancialCalculatorsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/settings/api-keys" component={ApiKeyManagement} />
      <ProtectedRoute path="/shared-properties" component={SharedPropertiesPage} />
      <ProtectedRoute path="/collaboration-teams" component={CollaborationTeamsPage} />
      <ProtectedRoute path="/rental-properties" component={RentalPropertiesPage} />
      <ProtectedRoute path="/rental-analysis/:id" component={RentalAnalysisPage} />
      <Route path="/shared/:token" component={SharedPropertyView} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/api-keys" component={ApiKeysManager} />
      <Route component={() => <ApiKeysManager />} />
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
