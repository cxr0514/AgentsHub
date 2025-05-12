import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, DollarSign, TrendingUp, Wrench, Banknote, AlertTriangle, MailOpen } from 'lucide-react';

interface PropertyRecommendationsProps {
  initialLocation?: string;
  initialBudget?: number;
}

export function PropertyRecommendations({ 
  initialLocation = 'Atlanta, GA',
  initialBudget = 500000
}: PropertyRecommendationsProps) {
  const { toast } = useToast();
  const [location, setLocation] = useState(initialLocation);
  const [budget, setBudget] = useState(initialBudget);
  const [investmentStrategy, setInvestmentStrategy] = useState<'cashflow' | 'appreciation' | 'value-add' | 'flip'>('cashflow');
  const [propertyType, setPropertyType] = useState<string>('single-family');
  
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
  
  // Property types
  const propertyTypes = [
    { value: 'single-family', label: 'Single Family' },
    { value: 'multi-family', label: 'Multi-Family' },
    { value: 'condo', label: 'Condo/Townhouse' },
    { value: 'commercial', label: 'Commercial' }
  ];
  
  // Query to fetch property recommendations
  const { data, isLoading, isError, refetch } = useQuery<{ recommendations: string }>({
    queryKey: ['/api/market-analysis/recommendations', { 
      location, 
      budget, 
      strategy: investmentStrategy,
      propertyType
    }],
    enabled: Boolean(location) && budget > 0,
  });
  
  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
  };
  
  const handleBudgetChange = (value: number[]) => {
    setBudget(value[0]);
  };
  
  const formatBudget = (value: number) => {
    return `$${value.toLocaleString()}`;
  };
  
  const handlePropertyTypeChange = (value: string) => {
    setPropertyType(value);
  };
  
  // Helper function to get icon based on strategy
  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'cashflow':
        return <Banknote className="h-4 w-4" />;
      case 'appreciation':
        return <TrendingUp className="h-4 w-4" />;
      case 'value-add':
        return <Wrench className="h-4 w-4" />;
      case 'flip':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };
  
  // Format recommendations for display with some basic Markdown-like formatting
  const formatRecommendations = (text: string) => {
    if (!text) return null;
    
    // Split into paragraphs
    const paragraphs = text.split('\n\n');
    
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => {
          // Check if this is a heading (starts with #)
          if (paragraph.startsWith('# ')) {
            return <h3 key={index} className="text-xl font-bold mt-6 mb-2">{paragraph.substring(2)}</h3>;
          }
          
          // Check if this is a subheading (starts with ##)
          if (paragraph.startsWith('## ')) {
            return <h4 key={index} className="text-lg font-semibold mt-4 mb-1">{paragraph.substring(3)}</h4>;
          }
          
          // Check if this is a list item (starts with - or *)
          if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
            const items = paragraph.split('\n').map(item => item.substring(2));
            return (
              <ul key={index} className="list-disc pl-5 space-y-1">
                {items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            );
          }
          
          // Regular paragraph
          return <p key={index}>{paragraph}</p>;
        })}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-[#071224]">Property Recommendations</CardTitle>
            <CardDescription>
              AI-powered investment property suggestions based on your criteria
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Filters */}
          <div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Location</label>
                <Select value={location} onValueChange={handleLocationChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularLocations.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Budget: {formatBudget(budget)}</label>
                <Slider
                  value={[budget]}
                  min={100000}
                  max={2000000}
                  step={25000}
                  onValueChange={handleBudgetChange}
                  className="my-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$100,000</span>
                  <span>$2,000,000</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Investment Strategy</label>
                <Tabs value={investmentStrategy} onValueChange={(v) => setInvestmentStrategy(v as any)} className="w-full">
                  <TabsList className="grid grid-cols-2 gap-1 mb-2">
                    <TabsTrigger value="cashflow" className="flex items-center gap-1">
                      <Banknote className="h-4 w-4" />
                      <span>Cash Flow</span>
                    </TabsTrigger>
                    <TabsTrigger value="appreciation" className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>Appreciation</span>
                    </TabsTrigger>
                    <TabsTrigger value="value-add" className="flex items-center gap-1">
                      <Wrench className="h-4 w-4" />
                      <span>Value-Add</span>
                    </TabsTrigger>
                    <TabsTrigger value="flip" className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      <span>Flip</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Property Type</label>
                <Select value={propertyType} onValueChange={handlePropertyTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full bg-[#071224] hover:bg-[#0f1d31] text-white mt-2" 
                onClick={() => refetch()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get Recommendations
              </Button>
            </div>
          </div>
          
          {/* Right column - Results */}
          <Card className="border bg-gray-50">
            <CardContent className="p-4">
              {isLoading ? (
                // Loading skeleton
                <div className="space-y-4 p-2">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ) : isError ? (
                // Error state
                <div className="text-center py-6">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Failed to load recommendations</h3>
                  <p className="text-muted-foreground mb-4">
                    There was an error generating property recommendations.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetch()}
                  >
                    Try Again
                  </Button>
                </div>
              ) : !data?.recommendations ? (
                // Empty state
                <div className="text-center py-6">
                  <MailOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No recommendations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Adjust your criteria and click "Get Recommendations" to receive AI-powered suggestions.
                  </p>
                </div>
              ) : (
                // Recommendations content
                <div className="p-2">
                  <div className="flex items-center mb-4">
                    <Badge className="bg-[#071224] text-white mr-2">
                      <span className="flex items-center gap-1">
                        {getStrategyIcon(investmentStrategy)}
                        {investmentStrategy === 'cashflow' ? 'Cash Flow' : 
                          investmentStrategy === 'appreciation' ? 'Appreciation' : 
                          investmentStrategy === 'value-add' ? 'Value-Add' : 'Flip'} Strategy
                      </span>
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatBudget(budget)}
                    </Badge>
                  </div>
                  
                  <div className="text-sm overflow-auto max-h-[500px] pr-2">
                    {formatRecommendations(data.recommendations)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
      
      <CardFooter className="border-t px-6 py-4">
        <div className="flex items-center w-full text-xs text-muted-foreground">
          <Sparkles className="h-4 w-4 mr-2 text-[#FF7A00]" />
          <span>
            Recommendations are generated by AI based on market data and investment principles.
            Individual properties may require further due diligence.
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}