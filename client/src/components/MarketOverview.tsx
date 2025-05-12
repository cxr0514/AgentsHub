import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import PriceChart from "./PriceChart";
import DaysOnMarketChart from "./DaysOnMarketChart";
import MarketHealthChart from "./MarketHealthChart";

interface MarketOverviewProps {
  city: string;
  state: string;
}

const MarketOverview = ({ city, state }: MarketOverviewProps) => {
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

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Market Overview: Loading...</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="p-4 border-b border-gray-700">
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
              <div className="p-4">
                <div className="h-48 bg-gray-700 rounded"></div>
              </div>
              <div className="p-4 bg-gray-700 border-t border-gray-700">
                <div className="flex justify-between">
                  <div>
                    <div className="h-3 bg-gray-600 rounded w-20 mb-2"></div>
                    <div className="h-5 bg-gray-600 rounded w-24"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-3 bg-gray-600 rounded w-20 mb-2"></div>
                    <div className="h-5 bg-gray-600 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!marketData || marketData.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Market Overview: {city}, {state}</h2>
        <Card className="p-6 text-center">
          <p className="text-gray-300">No market data available for this location.</p>
        </Card>
      </div>
    );
  }

  // Sort by date (most recent first)
  const sortedData = [...marketData].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const currentData = sortedData[0];
  const priceData = sortedData.slice(0, 9).reverse();

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Market Overview: {city}, {state}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Price Trend Chart */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-medium text-white">Median Price Trend</h3>
          </div>
          <div className="p-4">
            <PriceChart data={priceData} />
            <div className="text-center mt-4 text-sm text-gray-300">
              Last {priceData.length} months (
                {new Date(priceData[0]?.year, priceData[0]?.month - 1).toLocaleString('default', { month: 'short' })}-
                {new Date(priceData[priceData.length - 1]?.year, priceData[priceData.length - 1]?.month - 1).toLocaleString('default', { month: 'short' })} 
                {priceData[priceData.length - 1]?.year}
              )
            </div>
          </div>
          <div className="p-4 bg-gray-700 border-t border-gray-700">
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-gray-300">Current Median Price</div>
                <div className="text-xl font-semibold text-white">
                  ${Number(currentData.medianPrice).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-300">YoY Change</div>
                <div className="text-green-400 font-medium">+12.4%</div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Days on Market Chart */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-medium text-white">Inventory & Days on Market</h3>
          </div>
          <div className="p-4">
            <DaysOnMarketChart days={currentData.daysOnMarket} />
          </div>
          <div className="p-4 bg-gray-700 border-t border-gray-700">
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-gray-300">Active Listings</div>
                <div className="text-xl font-semibold text-white">
                  {currentData.activeListings}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-300">Inventory</div>
                <div className="text-amber-400 font-medium">
                  {currentData.inventoryMonths} months
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Market Health Chart */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-medium text-white">Market Health</h3>
          </div>
          <div className="p-4">
            <MarketHealthChart marketType={currentData.marketType} ratio={Number(currentData.saleToListRatio)} />
          </div>
          <div className="p-4 bg-gray-700 border-t border-gray-700">
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-gray-300">Sale-to-List Ratio</div>
                <div className="text-xl font-semibold text-white">
                  {currentData.saleToListRatio}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-300">Price Reductions</div>
                <div className="text-amber-400 font-medium">
                  {currentData.priceReductions}%
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MarketOverview;
