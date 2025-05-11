import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, 
  Search, 
  TrendingUp, 
  Home, 
  DollarSign, 
  Calendar, 
  Clock, 
  Building, 
  PieChart,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart4,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface MarketData {
  id: number;
  city: string;
  state: string;
  zipCode: string;
  daysOnMarket: number | null;
  year: number;
  month: number;
  medianPrice: string | null;
  averagePricePerSqft: string | null;
  inventory: number | null;
  soldCount: number | null;
  newListings: number | null;
  marketType: string | null;
  createdAt: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function MarketAnalysisPage() {
  const { user } = useAuth();
  const [location, setLocation] = useState({
    city: "Austin",
    state: "TX",
    zipCode: ""
  });

  // Fetch market data
  const { data: marketData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/market-data', location],
    queryFn: async () => {
      const params = new URLSearchParams({
        city: location.city,
        state: location.state,
      });
      
      if (location.zipCode) {
        params.append('zipCode', location.zipCode);
      }
      
      const url = `/api/market-data?${params.toString()}`;
      const response = await apiRequest('GET', url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      
      return response.json();
    },
    enabled: !!location.city && !!location.state
  });
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const locationString = formData.get('location') as string;
    
    // Parse location string (e.g., "Austin, TX 78701")
    const match = locationString.match(/^(.*?)(?:,\s*([A-Z]{2}))?(?:\s+(\d{5}))?$/i);
    
    if (match) {
      const [, city, state, zipCode] = match;
      setLocation({
        city: city || location.city,
        state: state || location.state,
        zipCode: zipCode || ""
      });
    }
  };
  
  // Format price for display
  const formatPrice = (price: string | null) => {
    if (!price) return 'N/A';
    
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(numPrice);
  };
  
  // Format date for monthly labels
  const formatMonthYear = (year: number, month: number) => {
    return `${MONTHS[month-1]} ${year}`;
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!marketData || !Array.isArray(marketData)) return [];
    
    // Sort data by year and month
    return [...marketData].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    }).map(data => ({
      ...data,
      monthYear: formatMonthYear(data.year, data.month),
      medianPriceValue: data.medianPrice ? parseFloat(data.medianPrice) : 0
    }));
  };
  
  const chartData = prepareChartData();
  
  // Calculate market trends
  const calculateTrends = () => {
    if (!marketData || !Array.isArray(marketData) || marketData.length === 0) {
      return {
        priceChange: { amount: 0, percent: 0, direction: 'neutral' },
        domChange: { amount: 0, percent: 0, direction: 'neutral' },
        inventoryChange: { amount: 0, percent: 0, direction: 'neutral' }
      };
    }
    
    // Get the most recent two months of data
    const sortedData = [...marketData].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    const current = sortedData[0];
    const previous = sortedData[1] || current;
    
    // Calculate price change
    const currentPrice = current.medianPrice ? parseFloat(current.medianPrice) : 0;
    const previousPrice = previous.medianPrice ? parseFloat(previous.medianPrice) : 0;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;
    
    // Calculate days on market change
    const currentDOM = current.daysOnMarket || 0;
    const previousDOM = previous.daysOnMarket || 0;
    const domChange = currentDOM - previousDOM;
    const domChangePercent = previousDOM ? (domChange / previousDOM) * 100 : 0;
    
    // Calculate inventory change
    const currentInventory = current.inventory || 0;
    const previousInventory = previous.inventory || 0;
    const inventoryChange = currentInventory - previousInventory;
    const inventoryChangePercent = previousInventory ? (inventoryChange / previousInventory) * 100 : 0;
    
    return {
      priceChange: { 
        amount: priceChange, 
        percent: priceChangePercent,
        direction: priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'neutral'
      },
      domChange: { 
        amount: domChange, 
        percent: domChangePercent,
        // For DOM, up is negative (slower market), down is positive (faster market)
        direction: domChange > 0 ? 'up' : domChange < 0 ? 'down' : 'neutral'
      },
      inventoryChange: { 
        amount: inventoryChange, 
        percent: inventoryChangePercent,
        direction: inventoryChange > 0 ? 'up' : inventoryChange < 0 ? 'down' : 'neutral'
      }
    };
  };
  
  const trends = calculateTrends();
  
  // Calculate property type distribution
  const calculatePropertyDistribution = () => {
    if (!marketData || !Array.isArray(marketData) || marketData.length === 0) {
      return [];
    }
    
    // Use the most recent data
    const latestData = [...marketData].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })[0];
    
    // This would normally come from the API but we'll use sample data for now
    return [
      { name: 'Single Family', value: 65 },
      { name: 'Condo', value: 15 },
      { name: 'Townhouse', value: 10 },
      { name: 'Multi-Family', value: 5 },
      { name: 'Land', value: 3 },
      { name: 'Other', value: 2 }
    ];
  };
  
  const propertyDistribution = calculatePropertyDistribution();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-2" asChild>
              <Link href="/" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Market Analysis</h1>
            <p className="text-muted-foreground">Analyze property market trends and data</p>
          </div>
          
          <Button onClick={() => refetch()} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Location search */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                name="location"
                placeholder="Enter city, state, or ZIP (e.g., Austin, TX 78701)" 
                className="pl-10"
                defaultValue={`${location.city}, ${location.state}${location.zipCode ? ' ' + location.zipCode : ''}`}
              />
            </div>
            <Button type="submit">Analyze Market</Button>
          </form>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
            
            <Card className="col-span-1 md:col-span-3">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load market data</h3>
            <p className="text-red-600">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Market insights */}
        {!isLoading && marketData && Array.isArray(marketData) && marketData.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Median Price Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Median Home Price</CardTitle>
                    <CardDescription>Current market average</CardDescription>
                  </div>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(marketData[0]?.medianPrice || null)}
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    {trends.priceChange.direction === 'up' ? (
                      <ArrowUpCircle className="h-4 w-4 text-green-500 mr-1" />
                    ) : trends.priceChange.direction === 'down' ? (
                      <ArrowDownCircle className="h-4 w-4 text-red-500 mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-gray-500 mr-1" />
                    )}
                    <span className={trends.priceChange.direction === 'up' ? 'text-green-500' : 
                          trends.priceChange.direction === 'down' ? 'text-red-500' : 'text-gray-500'}>
                      {trends.priceChange.percent.toFixed(1)}% from last month
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Days on Market Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Days on Market</CardTitle>
                    <CardDescription>Average time to sell</CardDescription>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {marketData[0]?.daysOnMarket || 'N/A'} days
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    {/* For DOM, opposite colors (up is bad, down is good) */}
                    {trends.domChange.direction === 'up' ? (
                      <ArrowUpCircle className="h-4 w-4 text-red-500 mr-1" />
                    ) : trends.domChange.direction === 'down' ? (
                      <ArrowDownCircle className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-gray-500 mr-1" />
                    )}
                    <span className={trends.domChange.direction === 'up' ? 'text-red-500' : 
                          trends.domChange.direction === 'down' ? 'text-green-500' : 'text-gray-500'}>
                      {trends.domChange.percent.toFixed(1)}% from last month
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Inventory Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Housing Inventory</CardTitle>
                    <CardDescription>Active listings</CardDescription>
                  </div>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {marketData[0]?.inventory?.toLocaleString() || 'N/A'} properties
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    {trends.inventoryChange.direction === 'up' ? (
                      <ArrowUpCircle className="h-4 w-4 text-green-500 mr-1" />
                    ) : trends.inventoryChange.direction === 'down' ? (
                      <ArrowDownCircle className="h-4 w-4 text-red-500 mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-gray-500 mr-1" />
                    )}
                    <span className={trends.inventoryChange.direction === 'up' ? 'text-green-500' : 
                          trends.inventoryChange.direction === 'down' ? 'text-red-500' : 'text-gray-500'}>
                      {trends.inventoryChange.percent.toFixed(1)}% from last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Market charts */}
            <Tabs defaultValue="price-trends" className="mb-6">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="price-trends">Price Trends</TabsTrigger>
                <TabsTrigger value="property-types">Property Types</TabsTrigger>
                <TabsTrigger value="sales-inventory">Sales & Inventory</TabsTrigger>
              </TabsList>
              
              <TabsContent value="price-trends">
                <Card>
                  <CardHeader>
                    <CardTitle>Median Home Price Trends</CardTitle>
                    <CardDescription>
                      Monthly median price changes in {location.city}, {location.state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="monthYear" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value) => [`$${Number(value).toLocaleString()}`, "Median Price"]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="medianPriceValue"
                            stroke="#8884d8"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                            name="Median Price"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="property-types">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Type Distribution</CardTitle>
                    <CardDescription>
                      Market breakdown by property category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="h-80 w-full max-w-2xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={propertyDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {propertyDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="sales-inventory">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Sales and Inventory</CardTitle>
                    <CardDescription>
                      Properties sold vs. new listings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="monthYear" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="soldCount" name="Properties Sold" fill="#8884d8" />
                          <Bar dataKey="newListings" name="New Listings" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Market insights */}
            <Card>
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
                <CardDescription>
                  Current real estate market conditions in {location.city}, {location.state}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Market Summary
                    </h3>
                    <p className="text-muted-foreground">
                      The {location.city} real estate market is currently
                      {marketData[0]?.marketType === 'seller' ? ' a seller\'s market' : 
                       marketData[0]?.marketType === 'buyer' ? ' a buyer\'s market' : 
                       ' a balanced market'}, with median home prices 
                      {trends.priceChange.direction === 'up' ? ' rising' : 
                       trends.priceChange.direction === 'down' ? ' falling' : ' stable'} and
                      properties spending an average of {marketData[0]?.daysOnMarket || 'N/A'} days on the market.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <BarChart4 className="h-5 w-5" />
                      Price Trends
                    </h3>
                    <p className="text-muted-foreground">
                      Median home prices in this area are currently {formatPrice(marketData[0]?.medianPrice || null)},
                      which represents a {Math.abs(trends.priceChange.percent).toFixed(1)}% 
                      {trends.priceChange.direction === 'up' ? ' increase' : 
                       trends.priceChange.direction === 'down' ? ' decrease' : ' change'} from the previous month.
                      The average price per square foot is {marketData[0]?.averagePricePerSqft ? `$${marketData[0].averagePricePerSqft}` : 'N/A'}.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Inventory Analysis
                    </h3>
                    <p className="text-muted-foreground">
                      There are currently {marketData[0]?.inventory?.toLocaleString() || 'N/A'} active listings in the area, with
                      {marketData[0]?.newListings?.toLocaleString() || 'N/A'} new properties listed in the past month.
                      The market absorbed {marketData[0]?.soldCount?.toLocaleString() || 'N/A'} properties through sales.
                      The current supply-demand balance indicates a 
                      {marketData[0]?.marketType === 'seller' ? ' shortage of inventory favoring sellers.' : 
                       marketData[0]?.marketType === 'buyer' ? ' surplus of inventory favoring buyers.' : 
                       ' balanced market between buyers and sellers.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        {/* No data state */}
        {!isLoading && (!marketData || !Array.isArray(marketData) || marketData.length === 0) && !error && (
          <div className="bg-card border border-border rounded-lg p-12 text-center mb-6">
            <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Market Data Available</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We don't have market data for {location.city}, {location.state}{location.zipCode ? ` ${location.zipCode}` : ''} yet. 
              Try searching for a different location or check back later.
            </p>
            <Button onClick={() => setLocation({ city: "Austin", state: "TX", zipCode: "" })}>
              View Austin, TX Market
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}