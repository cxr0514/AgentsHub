import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import MarketOverview from "@/components/MarketOverview";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import MarketVolatilityGauge from "@/components/MarketVolatilityGauge";

// Form schema
const locationFormSchema = z.object({
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  zipCode: z.string().optional(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

const MarketAnalysis = () => {
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
  
  const { data: marketData, isLoading } = useQuery({
    queryKey: ['/api/market-data', selectedLocation?.city, selectedLocation?.state, selectedLocation?.zipCode],
    queryFn: async () => {
      if (!selectedLocation) return [];
      
      const response = await fetch(`/api/market-data?city=${selectedLocation.city}&state=${selectedLocation.state}${selectedLocation.zipCode ? `&zipCode=${selectedLocation.zipCode}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return await response.json();
    },
    enabled: !!selectedLocation
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
      
      <div className="text-white bg-[#071224] -mx-4 -my-6 p-10 rounded-md min-h-screen">
        <h1 className="text-4xl font-bold mb-4">AI-Powered Market Analysis</h1>
        <p className="text-lg text-gray-300 mb-10">
          Leverage advanced AI algorithms to analyze real estate markets, predict trends, and get personalized
          recommendations.
        </p>
        
        <Card className="bg-[#0F1D32] rounded-lg shadow-md p-8 mb-10 border border-gray-700">
          <CardContent className="p-0">
            <h2 className="text-2xl font-semibold text-white mb-4">Location Selection</h2>
            <p className="text-gray-300 mb-6">Select a location to analyze the real estate market</p>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-0 md:grid md:grid-cols-4 md:gap-4 items-end">
                <div>
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} className="border-gray-600 bg-[#172334] text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">State</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-600 bg-[#172334] text-white">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#172334] text-white border-gray-600">
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
                </div>
                
                <div>
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">ZIP Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter ZIP code" {...field} className="border-gray-600 bg-[#172334] text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#FF7A00] hover:bg-[#E86A00] text-white"
                  >
                    Analyze Market
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {selectedLocation && !isLoading && sortedData.length > 0 && (
          <div className="space-y-8">
            <MarketOverview 
              city={selectedLocation.city} 
              state={selectedLocation.state} 
              zipCode={selectedLocation.zipCode} 
            />
            
            {/* Enhanced market analysis with new sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-2">
                <Card className="bg-[#0F1D32] text-white border border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Price History Analysis</CardTitle>
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
              <Card className="bg-[#0F1D32] text-white border border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Median Price Trend (in thousands)</CardTitle>
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
            </div>
          </div>
        )}
        
        {selectedLocation && isLoading && (
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card className="animate-pulse bg-[#0F1D32] border border-gray-700">
              <CardHeader>
                <div className="h-6 bg-gray-700 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-60 bg-gray-700 rounded w-full"></div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {selectedLocation && !isLoading && sortedData.length === 0 && (
          <Card className="p-6 text-center mb-6 bg-[#0F1D32] text-white border border-gray-700">
            <p className="text-gray-300">No market data available for this location.</p>
          </Card>
        )}
      </div>
    </>
  );
};

export default MarketAnalysis;