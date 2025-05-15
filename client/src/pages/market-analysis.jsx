import React, { useState } from 'react';
import SimpleMarketInsights from '../components/SimpleMarketInsights.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function MarketAnalysisPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // For now we're only displaying data for Atlanta, GA from our mock data
  // In a real application, this would filter based on the search query
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900">Market Analysis</h1>
            <p className="mt-4 text-lg text-gray-500">
              Explore real estate market trends and insights
            </p>
          </div>
          
          {/* Search bar */}
          <div className="mt-8 max-w-md mx-auto flex">
            <Input
              type="text"
              placeholder="Search location (e.g., Atlanta, GA)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-r-none"
            />
            <Button
              type="button"
              className="rounded-l-none"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          {/* Showing static location for demo */}
          <div className="mt-8">
            <Card>
              <CardHeader className="bg-gray-100">
                <CardTitle>Atlanta, GA Market Overview</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <SimpleMarketInsights />
              </CardContent>
            </Card>
          </div>
          
          {/* Additional market data sections */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Type Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Property Type Analysis Table */}
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Median Price</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YoY Change</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Sample data for demo */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">Single Family</td>
                        <td className="px-6 py-4 whitespace-nowrap">$450,000</td>
                        <td className="px-6 py-4 whitespace-nowrap">750</td>
                        <td className="px-6 py-4 whitespace-nowrap">+7.2%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">Condo</td>
                        <td className="px-6 py-4 whitespace-nowrap">$350,000</td>
                        <td className="px-6 py-4 whitespace-nowrap">320</td>
                        <td className="px-6 py-4 whitespace-nowrap">+5.8%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">Townhouse</td>
                        <td className="px-6 py-4 whitespace-nowrap">$395,000</td>
                        <td className="px-6 py-4 whitespace-nowrap">180</td>
                        <td className="px-6 py-4 whitespace-nowrap">+6.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Rental Market</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Average Rent</span>
                    <span className="text-lg">$1,895</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">YoY Rent Change</span>
                    <span className="text-lg">+5.2%</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Occupancy Rate</span>
                    <span className="text-lg">95.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Price-to-Rent Ratio</span>
                    <span className="text-lg">18.7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Last Updated */}
          <div className="mt-8 text-right text-sm text-gray-500">
            Last Updated: May 15, 2025
          </div>
        </div>
      </div>
    </div>
  );
}