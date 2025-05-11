import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import PropertySearch from "@/pages/PropertySearch";
import PropertyDetail from "@/pages/PropertyDetail";
import MarketAnalysis from "@/pages/MarketAnalysis";
import SavedProperties from "@/pages/SavedProperties";
import Reports from "@/pages/Reports";
import CMAGenerator from "@/pages/CMAGenerator";
import DocumentGenerator from "@/pages/DocumentGenerator";
import ApiKeyManagement from "@/pages/ApiKeyManagement";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/search" component={PropertySearch} />
        <Route path="/properties/:id" component={PropertyDetail} />
        <Route path="/market" component={MarketAnalysis} />
        <Route path="/saved" component={SavedProperties} />
        <Route path="/reports" component={Reports} />
        <Route path="/cma-generator" component={CMAGenerator} />
        <Route path="/documents" component={DocumentGenerator} />
        <Route path="/settings/api-keys" component={ApiKeyManagement} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
