import { useState } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, Lightbulb, FileText, TargetIcon, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { MarketInsights } from '@/components/MarketInsights';
import { MarketReport } from '@/components/MarketReport';
import { PropertyRecommendations } from '@/components/PropertyRecommendations';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function AIMarketAnalysisPage() {
  const [activeTab, setActiveTab] = useState('insights');
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>AI Market Analysis</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-[#071224]">AI Market Analysis</h1>
        </div>
        <p className="text-muted-foreground">
          Leverage the power of AI to analyze real estate markets, generate comprehensive reports, and receive personalized investment recommendations.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#071224] to-[#0c2348] text-white rounded-lg p-5 shadow-md flex flex-col">
          <div className="rounded-full bg-white/10 w-10 h-10 flex items-center justify-center mb-3">
            <Lightbulb className="h-5 w-5 text-[#FF7A00]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Market Insights</h3>
          <p className="text-sm text-gray-300 flex-1 mb-4">
            Get AI-powered insights on current trends, predictions, risks, and opportunities in your target market.
          </p>
          <Button
            variant={activeTab === 'insights' ? 'default' : 'secondary'}
            className={activeTab === 'insights' ? 'bg-[#FF7A00] hover:bg-[#e56e00] text-white' : 'text-white bg-white/10 hover:bg-white/20'}
            onClick={() => setActiveTab('insights')}
          >
            View Insights
          </Button>
        </div>
        
        <div className="bg-gradient-to-br from-[#071224] to-[#0c2348] text-white rounded-lg p-5 shadow-md flex flex-col">
          <div className="rounded-full bg-white/10 w-10 h-10 flex items-center justify-center mb-3">
            <FileText className="h-5 w-5 text-[#FF7A00]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Market Reports</h3>
          <p className="text-sm text-gray-300 flex-1 mb-4">
            Generate comprehensive market reports with detailed analysis of supply, demand, pricing trends, and investment outlook.
          </p>
          <Button
            variant={activeTab === 'reports' ? 'default' : 'secondary'}
            className={activeTab === 'reports' ? 'bg-[#FF7A00] hover:bg-[#e56e00] text-white' : 'text-white bg-white/10 hover:bg-white/20'}
            onClick={() => setActiveTab('reports')}
          >
            Generate Reports
          </Button>
        </div>
        
        <div className="bg-gradient-to-br from-[#071224] to-[#0c2348] text-white rounded-lg p-5 shadow-md flex flex-col">
          <div className="rounded-full bg-white/10 w-10 h-10 flex items-center justify-center mb-3">
            <TargetIcon className="h-5 w-5 text-[#FF7A00]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
          <p className="text-sm text-gray-300 flex-1 mb-4">
            Receive personalized property investment recommendations based on your budget, strategy, and preferences.
          </p>
          <Button
            variant={activeTab === 'recommendations' ? 'default' : 'secondary'}
            className={activeTab === 'recommendations' ? 'bg-[#FF7A00] hover:bg-[#e56e00] text-white' : 'text-white bg-white/10 hover:bg-white/20'}
            onClick={() => setActiveTab('recommendations')}
          >
            Get Recommendations
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Market Insights</span>
              <span className="sm:hidden">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Market Reports</span>
              <span className="sm:hidden">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <TargetIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Recommendations</span>
              <span className="sm:hidden">Recommend</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="mt-0">
            <MarketInsights />
          </TabsContent>
          
          <TabsContent value="reports" className="mt-0">
            <MarketReport />
          </TabsContent>
          
          <TabsContent value="recommendations" className="mt-0">
            <PropertyRecommendations />
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="bg-[#071224] rounded-full p-3">
            <Brain className="h-6 w-6 text-[#FF7A00]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Powered by Advanced AI</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our market analysis tools leverage state-of-the-art AI to provide you with the most accurate and actionable real estate insights.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="font-medium text-sm mb-1">Real-Time Data</h4>
                <p className="text-xs text-muted-foreground">
                  Analysis based on up-to-date market data from multiple trusted sources
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="font-medium text-sm mb-1">Predictive Models</h4>
                <p className="text-xs text-muted-foreground">
                  Advanced algorithms to forecast market trends and identify opportunities
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="font-medium text-sm mb-1">Personalized Insights</h4>
                <p className="text-xs text-muted-foreground">
                  Tailored recommendations based on your specific investment criteria
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}