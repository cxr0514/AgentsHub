import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MarketData } from '@shared/schema';

interface MarketVolatilityGaugeProps {
  data: MarketData[];
}

const MarketVolatilityGauge = ({ data }: MarketVolatilityGaugeProps) => {
  // Calculate volatility based on price changes
  const calculateVolatility = () => {
    if (data.length < 3) return { score: 0.5, category: 'Unknown' };

    // Sort data by date
    const sortedData = [...data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Calculate monthly percentage changes
    const changes: number[] = [];
    for (let i = 1; i < sortedData.length; i++) {
      const prevPrice = Number(sortedData[i-1].medianPrice);
      const currPrice = Number(sortedData[i].medianPrice);
      if (prevPrice > 0) {
        const percentChange = Math.abs((currPrice - prevPrice) / prevPrice);
        changes.push(percentChange);
      }
    }

    // Calculate standard deviation of changes as volatility measure
    if (changes.length === 0) return { score: 0.5, category: 'Unknown' };
    
    const mean = changes.reduce((sum, val) => sum + val, 0) / changes.length;
    const variance = changes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / changes.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to a 0-1 scale (normalize)
    // Consider > 10% monthly std deviation as extremely volatile (1.0)
    const normalizedScore = Math.min(stdDev / 0.1, 1);
    
    // Determine category
    let category = 'Stable';
    if (normalizedScore > 0.8) category = 'Highly Volatile';
    else if (normalizedScore > 0.6) category = 'Volatile';
    else if (normalizedScore > 0.4) category = 'Moderate';
    else if (normalizedScore > 0.2) category = 'Mostly Stable';
    
    return { score: normalizedScore, category };
  };

  const volatility = calculateVolatility();
  const dashArray = `${volatility.score * 100}, 100`;
  const progressColor = getColorForScore(volatility.score);

  // Get color based on volatility score
  function getColorForScore(score: number): string {
    if (score > 0.8) return '#EF4444'; // Red for high volatility
    if (score > 0.6) return '#F59E0B'; // Amber for moderate-high volatility
    if (score > 0.4) return '#FBBF24'; // Yellow for moderate volatility
    if (score > 0.2) return '#10B981'; // Green for low-moderate volatility
    return '#059669'; // Emerald for low volatility
  }

  // Calculate monthly volatility trend (is volatility increasing or decreasing)
  const calculateVolatilityTrend = () => {
    if (data.length < 6) return 'Insufficient data for trend analysis';
    
    // Sort data by date
    const sortedData = [...data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    // Look at older half vs newer half
    const midpoint = Math.floor(sortedData.length / 2);
    const olderHalf = sortedData.slice(0, midpoint);
    const newerHalf = sortedData.slice(midpoint);
    
    // Calculate volatility for each half
    const olderVolatility = calculateVolatilityForDataset(olderHalf);
    const newerVolatility = calculateVolatilityForDataset(newerHalf);
    
    // Compare
    const diff = newerVolatility - olderVolatility;
    if (Math.abs(diff) < 0.05) return 'Market volatility is steady';
    return diff > 0 ? 'Market volatility is increasing' : 'Market volatility is decreasing';
  };
  
  function calculateVolatilityForDataset(dataset: MarketData[]): number {
    if (dataset.length < 2) return 0;
    
    const changes: number[] = [];
    for (let i = 1; i < dataset.length; i++) {
      const prevPrice = Number(dataset[i-1].medianPrice);
      const currPrice = Number(dataset[i].medianPrice);
      if (prevPrice > 0) {
        const percentChange = Math.abs((currPrice - prevPrice) / prevPrice);
        changes.push(percentChange);
      }
    }
    
    if (changes.length === 0) return 0;
    
    const mean = changes.reduce((sum, val) => sum + val, 0) / changes.length;
    const variance = changes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / changes.length;
    return Math.sqrt(variance);
  }

  const volatilityTrend = calculateVolatilityTrend();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold">Market Volatility</h3>
            <div className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: `${progressColor}30`, color: progressColor }}>
              {volatility.category}
            </div>
          </div>
          
          <div className="flex justify-center items-center h-40">
            <div className="text-center">
              <div className="relative inline-flex justify-center items-center w-32 h-32 rounded-full">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-current text-gray-200"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-current"
                    style={{ color: progressColor }}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={dashArray}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-3xl font-semibold">
                    {(volatility.score * 100).toFixed(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Risk Score</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {volatilityTrend}
          </div>
          
          <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
            <p>
              A lower volatility score indicates a more stable market with predictable pricing patterns, 
              potentially offering lower risk for investments.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketVolatilityGauge;