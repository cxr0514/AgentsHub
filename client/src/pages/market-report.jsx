import React, { useState } from 'react';
import SimpleMarketInsights from '../components/SimpleMarketInsights.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function MarketReportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="min-h-screen bg-[#06101f]">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white">Market Analysis</h1>
            <p className="mt-4 text-lg text-gray-300">
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
              className="flex-1 rounded-r-none bg-[#0f1d31] border-[#1a2942] text-white placeholder:text-gray-400"
            />
            <Button
              type="button"
              className="rounded-l-none bg-[#FF7A00] hover:bg-[#e56e00] text-white"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          {/* Showing static location for demo */}
          <div className="mt-8">
            <Card className="bg-[#071224] border-[#0f1d31]">
              <CardHeader className="bg-[#0f1d31]">
                <CardTitle className="text-white">Atlanta, GA Market Overview</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <SimpleMarketInsights />
              </CardContent>
            </Card>
          </div>
          
          {/* Additional market data sections */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#071224] border-[#0f1d31]">
              <CardHeader>
                <CardTitle className="text-white">Property Type Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Property Type Analysis Table */}
                  <table className="min-w-full divide-y divide-[#1a2942]">
                    <thead className="bg-[#0f1d31]">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Median Price</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Inventory</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">YoY Change</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#071224] divide-y divide-[#1a2942]">
                      {/* Sample data for demo */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-200">Single Family</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-200">$450,000</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-200">750</td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-400">+7.2%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-200">Condo</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-200">$350,000</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-200">320</td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-400">+5.8%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-200">Townhouse</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-200">$395,000</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-200">180</td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-400">+6.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#071224] border-[#0f1d31]">
              <CardHeader>
                <CardTitle className="text-white">Rental Market</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-[#1a2942] pb-2">
                    <span className="font-medium text-gray-200">Average Rent</span>
                    <span className="text-lg text-white">$1,895</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#1a2942] pb-2">
                    <span className="font-medium text-gray-200">YoY Rent Change</span>
                    <span className="text-lg text-green-400">+5.2%</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#1a2942] pb-2">
                    <span className="font-medium text-gray-200">Occupancy Rate</span>
                    <span className="text-lg text-white">95.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-200">Price-to-Rent Ratio</span>
                    <span className="text-lg text-white">18.7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Last Updated */}
          <div className="mt-8 text-right text-sm text-gray-400">
            Last Updated: May 15, 2025
          </div>
        </div>
      </div>
    </div>
  );
}