import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Sample market data for visualizations
const marketData = {
  location: "Atlanta, GA",
  currentTrends: {
    avgDaysOnMarket: 18,
    totalListings: 3254,
    priceChangeYOY: 7.8,
    inventoryYOY: 4.2,
    priceHistory: [
      { date: "Jan 2024", price: 385000 },
      { date: "Feb 2024", price: 392000 },
      { date: "Mar 2024", price: 398000 },
      { date: "Apr 2024", price: 405000 },
      { date: "May 2024", price: 412000 },
      { date: "Jun 2024", price: 420000 },
      { date: "Jul 2024", price: 425000 },
      { date: "Aug 2024", price: 430000 },
      { date: "Sep 2024", price: 432000 },
      { date: "Oct 2024", price: 435000 },
      { date: "Nov 2024", price: 438000 },
      { date: "Dec 2024", price: 442000 },
      { date: "Jan 2025", price: 448000 },
      { date: "Feb 2025", price: 455000 },
      { date: "Mar 2025", price: 462000 },
      { date: "Apr 2025", price: 469000 },
      { date: "May 2025", price: 475000 }
    ]
  },
  neighborhoodBreakdown: [
    { name: "Midtown", priceChangeYOY: 9.2, avgPrice: 545000 },
    { name: "Buckhead", priceChangeYOY: 8.5, avgPrice: 695000 },
    { name: "Inman Park", priceChangeYOY: 7.8, avgPrice: 625000 },
    { name: "Virginia Highland", priceChangeYOY: 7.2, avgPrice: 575000 },
    { name: "Grant Park", priceChangeYOY: 6.9, avgPrice: 518000 },
    { name: "Old Fourth Ward", priceChangeYOY: 8.3, avgPrice: 498000 },
    { name: "Decatur", priceChangeYOY: 6.5, avgPrice: 485000 }
  ]
};

// Simple market insights component with charts
const SimpleMarketInsights = () => {
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

export default SimpleMarketInsights;