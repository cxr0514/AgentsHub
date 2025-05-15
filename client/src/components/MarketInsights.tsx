import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { markets } from '@/data';

const MarketInsights: React.FC = () => {
  // Get market data from our mock data
  const marketData = markets;
  
  const priceHistoryData = marketData.currentTrends.priceHistory;
  
  // Prepare data for YoY change bar chart for neighborhoods
  const neighborhoodYoYData = marketData.neighborhoodBreakdown.map(neighborhood => ({
    name: neighborhood.name,
    priceChangeYOY: neighborhood.priceChangeYOY,
  }));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Median Price Trend Line Chart */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Median Price Trend - {marketData.location}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={priceHistoryData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Median Price']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#8884d8" 
                name="Median Price"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Year-over-Year Price Change by Neighborhood Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>YoY Price Change by Neighborhood</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={neighborhoodYoYData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value}%`, 'YoY Change']} />
              <Legend />
              <Bar 
                dataKey="priceChangeYOY" 
                fill="#82ca9d" 
                name="YoY Price Change (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Key Market Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Market Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Avg. Days on Market</p>
              <p className="text-2xl font-bold">{marketData.currentTrends.avgDaysOnMarket} days</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Listings</p>
              <p className="text-2xl font-bold">{marketData.currentTrends.totalListings}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Inventory YoY</p>
              <p className="text-2xl font-bold">+{marketData.currentTrends.inventoryYOY}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Price Change YoY</p>
              <p className="text-2xl font-bold">+{marketData.currentTrends.priceChangeYOY}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketInsights;