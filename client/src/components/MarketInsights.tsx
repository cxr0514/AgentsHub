import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, AlertTriangle, BadgePercent, Sparkles, ExternalLink, ArrowRight, Share2 } from 'lucide-react';

interface MarketInsight {
  insight: string;
  analysisType: 'trend' | 'prediction' | 'risk' | 'opportunity';
  confidence: number; // 0-1
  locationContext: string;
  timeframe: string;
  supportingData?: string;
  citations?: string[];
}

interface MarketInsightsProps {
  initialLocation?: string;
}

export function MarketInsights({ initialLocation = 'Atlanta, GA' }: MarketInsightsProps) {
  const { toast } = useToast();
  const [location, setLocation] = useState(initialLocation);
  const [insightType, setInsightType] = useState<'trend' | 'prediction' | 'risk' | 'opportunity'>('trend');
  
  // Popular locations for the selector
  const popularLocations = [
    'Atlanta, GA',
    'Boston, MA',
    'Chicago, IL',
    'Dallas, TX',
    'Denver, CO',
    'Las Vegas, NV',
    'Los Angeles, CA',
    'Miami, FL',
    'Nashville, TN',
    'New York, NY',
    'Orlando, FL',
    'Phoenix, AZ',
    'San Francisco, CA',
    'Seattle, WA',
    'Austin, TX'
  ];
  
  // Query to fetch market insights based on location and type
  const { data: insights, isLoading, isError, refetch } = useQuery<MarketInsight[]>({
    queryKey: [`/api/market-analysis/insights/${encodeURIComponent(location)}`, { type: insightType }],
    enabled: Boolean(location),
  });
  
  const handleShareInsight = (insight: MarketInsight) => {
    navigator.clipboard.writeText(insight.insight)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Market insight copied to clipboard",
        });
      })
      .catch((err) => {
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard: " + err.message,
          variant: "destructive",
        });
      });
  };

  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
  };
  
  // Helper function to get icon based on insight type
  const getInsightIcon = (type: 'trend' | 'prediction' | 'risk' | 'opportunity') => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'prediction':
        return <Sparkles className="h-5 w-5 text-purple-500" />;
      case 'risk':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'opportunity':
        return <BadgePercent className="h-5 w-5 text-green-500" />;
    }
  };
  
  // Helper function to format confidence score
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-300';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <Card className="w-full bg-[#050e1d] border-[#0f1d31] text-white">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-white">AI Market Insights</CardTitle>
            <CardDescription className="text-slate-400">
              AI-powered analysis of real estate market trends and opportunities
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 min-w-[280px]">
            <Select value={location} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-full bg-[#071224] border-[#0f1d31] text-white">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                {popularLocations.map((loc) => (
                  <SelectItem key={loc} value={loc} className="focus:bg-[#0f1d31] focus:text-white">{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={insightType} onValueChange={(v) => setInsightType(v as any)} className="w-full">
        <div className="px-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full bg-[#071224]">
            <TabsTrigger value="trend" className="flex items-center gap-2 text-white data-[state=active]:bg-[#0f1d31] data-[state=active]:text-[#FF7A00]">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Current Trends</span>
              <span className="sm:hidden">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="prediction" className="flex items-center gap-2 text-white data-[state=active]:bg-[#0f1d31] data-[state=active]:text-[#FF7A00]">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Future Predictions</span>
              <span className="sm:hidden">Predictions</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2 text-white data-[state=active]:bg-[#0f1d31] data-[state=active]:text-[#FF7A00]">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Risk Factors</span>
              <span className="sm:hidden">Risks</span>
            </TabsTrigger>
            <TabsTrigger value="opportunity" className="flex items-center gap-2 text-white data-[state=active]:bg-[#0f1d31] data-[state=active]:text-[#FF7A00]">
              <BadgePercent className="h-4 w-4" />
              <span className="hidden sm:inline">Opportunities</span>
              <span className="sm:hidden">Opportunities</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          {isLoading ? (
            // Loading skeleton state
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="border border-[#0f1d31] rounded-lg p-4 bg-[#071224]">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-[#0f1d31]" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4 bg-[#0f1d31]" />
                      <Skeleton className="h-4 w-full bg-[#0f1d31]" />
                      <Skeleton className="h-4 w-full bg-[#0f1d31]" />
                      <div className="flex gap-2 mt-2">
                        <Skeleton className="h-6 w-16 bg-[#0f1d31]" />
                        <Skeleton className="h-6 w-24 bg-[#0f1d31]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            // Error state
            <div className="text-center py-8 text-white">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Failed to load market insights</h3>
              <p className="text-slate-400 mb-4">
                There was an error fetching data from our AI analysis service.
              </p>
              <Button onClick={() => refetch()} className="bg-[#FF7A00] hover:bg-orange-600 text-white">Try Again</Button>
            </div>
          ) : !insights || insights.length === 0 ? (
            // Empty state
            <div className="text-center py-8 text-white">
              <TrendingUp className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No market insights available</h3>
              <p className="text-slate-400 mb-4">
                We don't have any insights for this location and type yet.
              </p>
              <Button onClick={() => refetch()} className="bg-[#FF7A00] hover:bg-orange-600 text-white">Refresh Analysis</Button>
            </div>
          ) : (
            // Insights list
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <Card key={index} className="overflow-hidden border-l-4 bg-[#071224] border-[#0f1d31] text-white" 
                  style={{ borderLeftColor: 
                    insight.analysisType === 'trend' ? '#3b82f6' : 
                    insight.analysisType === 'prediction' ? '#8b5cf6' : 
                    insight.analysisType === 'risk' ? '#ef4444' : 
                    '#10b981' 
                  }}>
                  <CardContent className="p-4">
                    <div className="flex gap-4 items-start">
                      <div className="mt-1 flex-shrink-0">
                        {getInsightIcon(insight.analysisType)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-base mb-1 text-white">{insight.insight}</div>
                        
                        {insight.supportingData && (
                          <p className="text-sm text-slate-400 mb-2">{insight.supportingData}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="outline" className="bg-[#0f1d31] text-slate-300 border-[#0f1d31]">
                            {insight.timeframe}
                          </Badge>
                          <Badge variant="outline" 
                            className={insight.confidence >= 0.8 ? 'bg-green-900/40 text-green-400 border-green-800/50' : 
                                     insight.confidence >= 0.6 ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50' : 
                                     'bg-red-900/40 text-red-400 border-red-800/50'}>
                            Confidence: {getConfidenceLabel(insight.confidence)}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleShareInsight(insight)} className="text-slate-300 hover:text-white">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t border-[#0f1d31] px-6 py-4">
          <div className="flex justify-between items-center w-full text-xs text-slate-400">
            <div>Updated: {new Date().toLocaleDateString()}</div>
            <Button variant="link" size="sm" className="gap-1 text-xs text-[#FF7A00] hover:text-orange-500">
              View full market report
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardFooter>
      </Tabs>
    </Card>
  );
}