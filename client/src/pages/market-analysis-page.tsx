import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Permission } from '@shared/permissions';

// Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  PieChart, Pie, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Home, 
  DollarSign, 
  Clock, 
  Layers, 
  Award, 
  BarChart3, 
  Building, 
  Loader2 
} from 'lucide-react';

// Form schema
const locationFormSchema = z.object({
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  zipCode: z.string().optional(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

export default function MarketAnalysisPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('predictions');
  const [selectedLocation, setSelectedLocation] = useState<LocationFormValues | null>(null);
  
  // Form for location selection
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      city: '',
      state: '',
      zipCode: '',
    },
  });

  // Handle location form submission
  const onSubmit = (values: LocationFormValues) => {
    setSelectedLocation(values);
  };

  // Query for market predictions
  const {
    data: predictions,
    isLoading: isPredictionsLoading,
    error: predictionsError,
  } = useQuery({
    queryKey: ['/api/market-predictions', selectedLocation?.city, selectedLocation?.state, selectedLocation?.zipCode],
    queryFn: () => {
      if (!selectedLocation) return null;
      
      const params = new URLSearchParams({
        city: selectedLocation.city,
        state: selectedLocation.state,
      });
      
      if (selectedLocation.zipCode) {
        params.append('zipCode', selectedLocation.zipCode);
      }
      
      return apiRequest('GET', `/api/market-predictions?${params.toString()}`).then(res => res.json());
    },
    enabled: !!selectedLocation,
  });

  // Query for market report
  const {
    data: marketReport,
    isLoading: isReportLoading,
    error: reportError,
  } = useQuery({
    queryKey: ['/api/market-report', selectedLocation?.city, selectedLocation?.state, selectedLocation?.zipCode],
    queryFn: () => {
      if (!selectedLocation) return null;
      
      const params = new URLSearchParams({
        city: selectedLocation.city,
        state: selectedLocation.state,
      });
      
      if (selectedLocation.zipCode) {
        params.append('zipCode', selectedLocation.zipCode);
      }
      
      return apiRequest('GET', `/api/market-report?${params.toString()}`).then(res => res.json());
    },
    enabled: !!selectedLocation && activeTab === 'report',
  });

  // Mutation for property recommendations
  const propertyRecommendationsMutation = useMutation({
    mutationFn: (preferences: any) => {
      return apiRequest('POST', `/api/property-recommendations/${user?.id}`, preferences)
        .then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Recommendations Generated",
        description: "Your personalized property recommendations have been generated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/property-recommendations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to generate recommendations: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Function to get recommendations
  const getRecommendations = () => {
    if (!user) return;
    
    // Example preferences
    const preferences = {
      priceRange: { min: 100000, max: 500000 },
      bedrooms: 3,
      propertyTypes: ["Single Family"],
      locations: [selectedLocation?.city]
    };
    
    propertyRecommendationsMutation.mutate(preferences);
  };
  
  // Function to detect property anomalies
  const detectAnomalies = () => {
    // For demonstration, we would need property IDs to analyze
    toast({
      title: "Feature Coming Soon",
      description: "Property anomaly detection will be available soon.",
    });
  };

  return (
    <div className="py-10 bg-[#071224] -mx-4 -my-6 p-10 rounded-md min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-4">AI-Powered Market Analysis</h1>
      <p className="text-lg text-gray-300 mb-10">
        Leverage advanced AI algorithms to analyze real estate markets, predict trends, and get personalized recommendations.
      </p>
      
      <Card className="mb-8 bg-[#0F1D32] border border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Location Selection</CardTitle>
          <CardDescription className="text-gray-300">
            Select a location to analyze the real estate market
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-0 md:flex md:space-x-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-white">City</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter city" 
                        {...field} 
                        className="bg-[#162233] border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-white">State</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#162233] border-gray-700 text-white">
                          <SelectValue placeholder="Select state" className="text-gray-400" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#162233] border-gray-700 text-white">
                        <SelectItem value="AL">Alabama</SelectItem>
                        <SelectItem value="AK">Alaska</SelectItem>
                        <SelectItem value="AZ">Arizona</SelectItem>
                        <SelectItem value="AR">Arkansas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="CT">Connecticut</SelectItem>
                        <SelectItem value="DE">Delaware</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="HI">Hawaii</SelectItem>
                        <SelectItem value="ID">Idaho</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IA">Iowa</SelectItem>
                        <SelectItem value="KS">Kansas</SelectItem>
                        <SelectItem value="KY">Kentucky</SelectItem>
                        <SelectItem value="LA">Louisiana</SelectItem>
                        <SelectItem value="ME">Maine</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="MN">Minnesota</SelectItem>
                        <SelectItem value="MS">Mississippi</SelectItem>
                        <SelectItem value="MO">Missouri</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                        <SelectItem value="NE">Nebraska</SelectItem>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="NH">New Hampshire</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="NM">New Mexico</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="ND">North Dakota</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="OK">Oklahoma</SelectItem>
                        <SelectItem value="OR">Oregon</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="RI">Rhode Island</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                        <SelectItem value="SD">South Dakota</SelectItem>
                        <SelectItem value="TN">Tennessee</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="UT">Utah</SelectItem>
                        <SelectItem value="VT">Vermont</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="WV">West Virginia</SelectItem>
                        <SelectItem value="WI">Wisconsin</SelectItem>
                        <SelectItem value="WY">Wyoming</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-white">ZIP Code (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter ZIP code" 
                        {...field} 
                        className="bg-[#162233] border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  className="w-full md:w-auto bg-[#FF7A00] hover:bg-[#E56C00] text-white"
                >
                  Analyze Market
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {selectedLocation && (
        <Tabs defaultValue="predictions" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-8 bg-[#0F1D32] p-1">
            <TabsTrigger value="predictions" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">Market Predictions</TabsTrigger>
            <TabsTrigger value="report" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">Market Report</TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">Recommendations</TabsTrigger>
            <TabsTrigger value="anomalies" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">Anomaly Detection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="predictions">
            <Card className="bg-[#0F1D32] border border-gray-700 text-white">
              <CardHeader>
                <CardTitle className="text-white">
                  Market Predictions for {selectedLocation.city}, {selectedLocation.state}
                  {selectedLocation.zipCode && ` (${selectedLocation.zipCode})`}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  AI-powered predictions based on historical market data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isPredictionsLoading ? (
                  <div className="flex justify-center items-center h-64 text-gray-300">
                    <Loader2 className="h-8 w-8 animate-spin text-[#FF7A00]" />
                    <span className="ml-2">Generating market predictions...</span>
                  </div>
                ) : predictionsError ? (
                  <div className="text-center py-8 text-red-400">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Error Loading Predictions</h3>
                    <p>We encountered an error while generating market predictions.</p>
                  </div>
                ) : predictions ? (
                  <div className="space-y-8">
                    <PermissionGuard permission={Permission.GENERATE_REPORTS}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-muted/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center">
                              <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                              Price Trend
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {predictions.projections?.oneMonth?.priceChange > 0 ? (
                                <span className="text-green-600 flex items-center">
                                  +{predictions.projections.oneMonth.priceChange.toFixed(1)}%
                                  <TrendingUp className="h-5 w-5 ml-2" />
                                </span>
                              ) : (
                                <span className="text-red-600 flex items-center">
                                  {predictions.projections.oneMonth.priceChange.toFixed(1)}%
                                  <TrendingDown className="h-5 w-5 ml-2" />
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">Projected 1-month change</p>
                            
                            <div className="mt-4">
                              <p className="font-medium">3-Month Projection:</p>
                              <p className="text-lg">
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                  maximumFractionDigits: 0,
                                }).format(predictions.projections.threeMonths.medianPrice)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-[#162233] border border-gray-700">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center text-white">
                              <Layers className="h-5 w-5 mr-2 text-blue-400" />
                              Inventory
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-white">
                              {predictions.projections.oneMonth.inventory}
                            </div>
                            <p className="text-sm text-gray-400">Expected active listings</p>
                            
                            <div className="mt-4">
                              <p className="font-medium text-white">Market Type:</p>
                              <p className="text-lg text-[#FF7A00]">{predictions.marketOutlook}</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-[#162233] border border-gray-700">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center text-white">
                              <Clock className="h-5 w-5 mr-2 text-amber-400" />
                              Days on Market
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-white">
                              {predictions.projections.oneMonth.daysOnMarket} days
                            </div>
                            <p className="text-sm text-gray-400">Average time to sell</p>
                            
                            <div className="mt-4">
                              <p className="font-medium text-white">3-Month Projection:</p>
                              <p className="text-lg text-[#FF7A00]">
                                {predictions.projections.threeMonths.daysOnMarket} days
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold mb-3 text-white">Key Insights</h3>
                        <ul className="space-y-2">
                          {predictions.keyFindings?.map((finding: string, index: number) => (
                            <li key={index} className="flex items-start text-gray-200">
                              <span className="mr-2 text-[#FF7A00] flex-shrink-0">•</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold mb-3 text-white">Recommendations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center text-white">
                              <Home className="h-4 w-4 mr-1 text-blue-400" /> For Buyers
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {predictions.recommendedActions?.buyers.map((rec: string, index: number) => (
                                <li key={index} className="flex items-start text-gray-300">
                                  <span className="mr-2 text-blue-400 flex-shrink-0">→</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2 flex items-center text-white">
                              <Building className="h-4 w-4 mr-1 text-green-400" /> For Sellers
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {predictions.recommendedActions?.sellers.map((rec: string, index: number) => (
                                <li key={index} className="flex items-start text-gray-300">
                                  <span className="mr-2 text-green-400 flex-shrink-0">→</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2 flex items-center text-white">
                              <Award className="h-4 w-4 mr-1 text-[#FF7A00]" /> For Investors
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {predictions.recommendedActions?.investors.map((rec: string, index: number) => (
                                <li key={index} className="flex items-start text-gray-300">
                                  <span className="mr-2 text-[#FF7A00] flex-shrink-0">→</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </PermissionGuard>
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No predictions yet</h3>
                    <p className="text-muted-foreground">
                      Select a location and click "Analyze Market" to generate AI-powered predictions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="report">
            <Card>
              <CardHeader>
                <CardTitle>
                  Market Analysis Report for {selectedLocation.city}, {selectedLocation.state}
                  {selectedLocation.zipCode && ` (${selectedLocation.zipCode})`}
                </CardTitle>
                <CardDescription>
                  Comprehensive AI-generated market analysis report
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isReportLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Generating market report...</span>
                  </div>
                ) : reportError ? (
                  <div className="text-center py-8 text-destructive">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Error Loading Report</h3>
                    <p>We encountered an error while generating the market report.</p>
                  </div>
                ) : marketReport ? (
                  <div className="space-y-8">
                    <PermissionGuard permission={Permission.GENERATE_REPORTS}>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold mb-2">Executive Summary</h3>
                        <p>{marketReport.executiveSummary}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Market Trends</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Price Trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-sm space-y-2">
                                <p>{marketReport.marketTrends.pricesTrend.description}</p>
                                <div className="flex justify-between items-center font-medium">
                                  <span>Annual Change:</span>
                                  <span className={marketReport.marketTrends.pricesTrend.annualChange >= 0 ? "text-green-600" : "text-red-600"}>
                                    {marketReport.marketTrends.pricesTrend.annualChange > 0 ? "+" : ""}
                                    {marketReport.marketTrends.pricesTrend.annualChange}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Outlook:</span>
                                  <span>{marketReport.marketTrends.pricesTrend.outlook}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Inventory Trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-sm space-y-2">
                                <p>{marketReport.marketTrends.inventoryTrend.description}</p>
                                <div className="flex justify-between items-center font-medium">
                                  <span>Annual Change:</span>
                                  <span className={marketReport.marketTrends.inventoryTrend.annualChange >= 0 ? "text-green-600" : "text-red-600"}>
                                    {marketReport.marketTrends.inventoryTrend.annualChange > 0 ? "+" : ""}
                                    {marketReport.marketTrends.inventoryTrend.annualChange}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Outlook:</span>
                                  <span>{marketReport.marketTrends.inventoryTrend.outlook}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Days on Market</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-sm space-y-2">
                                <p>{marketReport.marketTrends.daysOnMarketTrend.description}</p>
                                <div className="flex justify-between items-center font-medium">
                                  <span>Annual Change:</span>
                                  <span className={marketReport.marketTrends.daysOnMarketTrend.annualChange <= 0 ? "text-green-600" : "text-red-600"}>
                                    {marketReport.marketTrends.daysOnMarketTrend.annualChange > 0 ? "+" : ""}
                                    {marketReport.marketTrends.daysOnMarketTrend.annualChange}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Outlook:</span>
                                  <span>{marketReport.marketTrends.daysOnMarketTrend.outlook}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-xl font-semibold mb-4">Market Health Indicators</h3>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Overall Market Health:</span>
                                  <span className="px-3 py-1 rounded-full bg-muted text-secondary-foreground">
                                    {marketReport.marketHealthIndicators.overall}
                                  </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                  <span>Affordability:</span>
                                  <span>{marketReport.marketHealthIndicators.affordability}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                  <span>Competitiveness:</span>
                                  <span>{marketReport.marketHealthIndicators.competitiveness}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                  <span>Stability:</span>
                                  <span>{marketReport.marketHealthIndicators.stability}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-semibold mb-4">Opportunity Analysis</h3>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">For Buyers:</h4>
                                  <ul className="text-sm list-disc pl-5 space-y-1">
                                    {marketReport.opportunityAnalysis.buyerOpportunities.map((opp: string, i: number) => (
                                      <li key={i}>{opp}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <Separator />
                                
                                <div>
                                  <h4 className="text-sm font-medium mb-1">For Sellers:</h4>
                                  <ul className="text-sm list-disc pl-5 space-y-1">
                                    {marketReport.opportunityAnalysis.sellerOpportunities.map((opp: string, i: number) => (
                                      <li key={i}>{opp}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <Separator />
                                
                                <div>
                                  <h4 className="text-sm font-medium mb-1">For Investors:</h4>
                                  <ul className="text-sm list-disc pl-5 space-y-1">
                                    {marketReport.opportunityAnalysis.investorOpportunities.map((opp: string, i: number) => (
                                      <li key={i}>{opp}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Local Factors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Economic Indicators</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="text-sm list-disc pl-5 space-y-1">
                                {marketReport.localFactors.economicIndicators.map((indicator: string, i: number) => (
                                  <li key={i}>{indicator}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Demographic Trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="text-sm list-disc pl-5 space-y-1">
                                {marketReport.localFactors.demographicTrends.map((trend: string, i: number) => (
                                  <li key={i}>{trend}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold mb-2">Conclusion</h3>
                        <p>{marketReport.conclusion}</p>
                      </div>
                      
                      <div className="text-sm text-muted-foreground text-right">
                        <p>Report generated on {new Date(marketReport.generatedAt).toLocaleDateString()}</p>
                        <p>Based on data from {marketReport.timeRange?.start} to {marketReport.timeRange?.end}</p>
                      </div>
                    </PermissionGuard>
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No report yet</h3>
                    <p className="text-muted-foreground">
                      Select a location and click "Analyze Market" to generate an AI-powered market report.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle>Personalized Property Recommendations</CardTitle>
                <CardDescription>
                  AI-powered property recommendations based on your preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PermissionGuard permission={Permission.VIEW_PROPERTIES}>
                  <div className="text-center py-12 border border-dashed rounded-lg mb-8">
                    <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Get Personalized Recommendations</h3>
                    <p className="text-muted-foreground mb-4">
                      Our AI will analyze your preferences and the current market to find the best properties for you.
                    </p>
                    
                    <Button 
                      onClick={getRecommendations}
                      disabled={propertyRecommendationsMutation.isPending || !selectedLocation}
                    >
                      {propertyRecommendationsMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Generate Recommendations
                    </Button>
                  </div>
                  
                  {/* Display recommendations (mocked for now) */}
                  {propertyRecommendationsMutation.isPending ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Generating personalized recommendations...</span>
                    </div>
                  ) : null}
                </PermissionGuard>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="anomalies">
            <Card>
              <CardHeader>
                <CardTitle>Property Anomaly Detection</CardTitle>
                <CardDescription>
                  AI-powered analysis to detect anomalies in property listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PermissionGuard permission={Permission.VIEW_PROPERTIES}>
                  <div className="text-center py-12 border border-dashed rounded-lg mb-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Detect Market Anomalies</h3>
                    <p className="text-muted-foreground mb-4">
                      Our AI will analyze property listings to detect mispricing, fraud, or unusual patterns.
                    </p>
                    
                    <Button 
                      onClick={detectAnomalies}
                      disabled={!selectedLocation}
                    >
                      Analyze Properties
                    </Button>
                  </div>
                </PermissionGuard>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}