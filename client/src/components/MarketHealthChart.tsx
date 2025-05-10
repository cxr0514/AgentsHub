interface MarketHealthChartProps {
  marketType: string;
  ratio: number;
}

const MarketHealthChart = ({ marketType, ratio }: MarketHealthChartProps) => {
  // Normalize the ratio to a percentage for the chart (100% would be most seller's market)
  // Assume ratio of 95-105 ranges from strong buyer to strong seller
  const percentage = Math.min(100, Math.max(0, ((ratio - 95) / 10) * 100));
  
  // Determine the market label based on the market type or ratio
  const marketLabel = getMarketLabel(marketType, ratio);
  const colorClass = getColorClass(marketType, ratio);
  
  return (
    <div className="flex justify-center items-center h-48">
      <div className="w-full">
        <div className="text-center mb-4">
          <span className={`inline-block px-3 py-1 bg-${colorClass} text-white text-sm font-medium rounded-full`}>
            {marketLabel}
          </span>
        </div>
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full bg-${colorClass}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-text-secondary">
          <span>Buyer's Market</span>
          <span>Neutral</span>
          <span>Seller's Market</span>
        </div>
      </div>
    </div>
  );
};

function getMarketLabel(marketType: string, ratio: number): string {
  if (marketType) {
    switch (marketType.toLowerCase()) {
      case 'buyer':
        return "Buyer's Market";
      case 'seller':
        return "Seller's Market";
      case 'neutral':
        return "Neutral Market";
      default:
        break;
    }
  }
  
  // Fallback to using ratio if market type not provided
  if (ratio < 97) return "Buyer's Market";
  if (ratio > 103) return "Seller's Market";
  return "Neutral Market";
}

function getColorClass(marketType: string, ratio: number): string {
  if (marketType) {
    switch (marketType.toLowerCase()) {
      case 'buyer':
        return "accent";
      case 'seller':
        return "warning";
      case 'neutral':
        return "success";
      default:
        break;
    }
  }
  
  // Fallback to using ratio
  if (ratio < 97) return "accent";
  if (ratio > 103) return "warning";
  return "success";
}

export default MarketHealthChart;
