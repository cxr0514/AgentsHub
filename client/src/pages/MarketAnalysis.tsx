import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import MarketOverview from "@/components/MarketOverview";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import MarketVolatilityGauge from "@/components/MarketVolatilityGauge";

const MarketAnalysis = () => {
  const [location, setLocation] = useState<string>("San Francisco, CA");
  
  const locationParts = location.split(", ");
  const city = locationParts[0];
  const state = locationParts.length > 1 ? locationParts[1] : "";
  
  const { data: marketData, isLoading } = useQuery({
    queryKey: ['/api/market-data', { city, state }],
    queryFn: async () => {
      const response = await fetch(`/api/market-data?city=${city}&state=${state}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return await response.json();
    }
  });

  // Sort by date (most recent first for display, reverse for charts)
  const sortedData = marketData ? [...marketData].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  }) : [];

  // Format data for charts
  const priceChartData = sortedData.map(item => ({
    name: `${new Date(item.year, item.month - 1).toLocaleString('default', { month: 'short' })}`,
    price: Number(item.medianPrice) / 1000, // display in thousands
    sqft: Number(item.averagePricePerSqft)
  }));

  const inventoryChartData = sortedData.map(item => ({
    name: `${new Date(item.year, item.month - 1).toLocaleString('default', { month: 'short' })}`,
    inventory: Number(item.inventoryMonths),
    listings: item.activeListings
  }));

  return (
    <>
      <Helmet>
        <title>Market Analysis | RealComp - Real Estate Comparison Tool</title>
        <meta name="description" content="Analyze real estate market trends, inventory levels, and pricing data to make informed property decisions." />
      </Helmet>
      
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Market Analysis</h1>
          <p className="text-text-secondary">
            Analyze real estate market trends and metrics
          </p>
        </div>
        
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Location</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="San Francisco, CA">San Francisco, CA</SelectItem>
                  <SelectItem value="New York, NY">New York, NY</SelectItem>
                  <SelectItem value="Los Angeles, CA">Los Angeles, CA</SelectItem>
                  <SelectItem value="Chicago, IL">Chicago, IL</SelectItem>
                  <SelectItem value="Austin, TX">Austin, TX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <MarketOverview city={city} state={state} />
        
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-60 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          </div>
        ) : sortedData.length > 0 ? (
          <div className="space-y-8">
            {/* Enhanced market analysis with new sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Price History Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PriceHistoryChart data={sortedData} height={300} />
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-1">
                <MarketVolatilityGauge data={sortedData} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Median Price Trend (in thousands)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={priceChartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'price') return [`$${value}k`, 'Median Price'];
                            return [value, name];
                          }} 
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          name="Median Price" 
                          stroke="#FF7A00" 
                          fill="rgba(255, 122, 0, 0.1)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Price per Sq Ft Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={priceChartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'sqft') return [`$${value}`, 'Price per Sq Ft'];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="sqft" 
                          name="Price per Sq Ft" 
                          stroke="#071224" 
                          fill="rgba(7, 18, 36, 0.1)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Levels & Active Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={inventoryChartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          yAxisId="left" 
                          dataKey="inventory" 
                          name="Inventory (months)" 
                          fill="#FF7A00" 
                        />
                        <Bar 
                          yAxisId="right" 
                          dataKey="listings" 
                          name="Active Listings" 
                          fill="#071224" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="p-6 text-center mb-6">
            <p className="text-text-secondary">No market data available for this location.</p>
          </Card>
        )}
      </div>
    </>
  );
};

export default MarketAnalysis;
