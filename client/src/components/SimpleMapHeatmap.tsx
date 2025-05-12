import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Home, TrendingUp, LayoutGrid } from 'lucide-react';

// Define the types of heatmap data
type HeatmapType = 'price' | 'value' | 'trend' | 'inventory';

interface SimpleMapHeatmapProps {
  height?: string;
}

const SimpleMapHeatmap = ({
  height = '600px'
}: SimpleMapHeatmapProps) => {
  const [heatmapType, setHeatmapType] = useState<HeatmapType>('price');
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <Tabs 
          defaultValue="price" 
          value={heatmapType}
          onValueChange={(value) => setHeatmapType(value as HeatmapType)}
        >
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="price" className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Price
            </TabsTrigger>
            <TabsTrigger value="value" className="flex items-center">
              <Home className="h-4 w-4 mr-2" />
              Value
            </TabsTrigger>
            <TabsTrigger value="trend" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trend
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-2 flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#41b6c4] mr-1"></span>
              <span>Low</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#fbb03b] mr-1"></span>
              <span>Medium</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#dc3713] mr-1"></span>
              <span>High</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#a50026] mr-1"></span>
              <span>Very High</span>
            </div>
          </div>
        </Tabs>
      </div>
      
      <div 
        className="relative w-full rounded-md overflow-hidden border border-border" 
        style={{ height }}
      >
        <div className="absolute w-full h-full bg-gray-100 flex items-center justify-center flex-col text-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-[#FF7A00]" />
            <h3 className="text-xl font-bold mb-2 text-[#071224]">Map Visualization Feature</h3>
            <p className="text-gray-500 mb-4">
              The interactive map heatmap feature is currently in development. This feature will display real-time market data and property statistics for geographic areas.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-semibold text-sm mb-1">Price Heatmap</h4>
                <p className="text-xs text-gray-500">Visual representation of property price distribution</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-semibold text-sm mb-1">Value Insights</h4>
                <p className="text-xs text-gray-500">Price per square foot analysis by area</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-semibold text-sm mb-1">Market Trends</h4>
                <p className="text-xs text-gray-500">Year-over-year appreciation visualization</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-semibold text-sm mb-1">Inventory Levels</h4>
                <p className="text-xs text-gray-500">Available property density visualization</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Button className="bg-[#071224] hover:bg-[#0f1d31] text-white">
                <MapPin className="h-4 w-4 mr-2" />
                <span>Explore Sample Properties</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMapHeatmap;