import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { MarketData } from '@shared/schema';

interface PriceHistoryChartProps {
  data: MarketData[];
  height?: number;
}

const PriceHistoryChart = ({ data, height = 300 }: PriceHistoryChartProps) => {
  // Sort data by date (chronologically)
  const sortedData = [...data].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Format data for the chart
  const chartData = sortedData.map(item => ({
    date: `${getMonthName(item.month)} ${item.year}`,
    medianPrice: Number(item.medianPrice) / 1000, // Convert to thousands for cleaner display
    pricePerSqFt: Number(item.averagePricePerSqft)
  }));

  // Helper function to get month name
  function getMonthName(monthNum: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1] || '';
  }

  // Calculate price change percentage
  const calculatePriceChange = () => {
    if (chartData.length < 2) return { value: 0, percentage: 0 };
    
    const firstPrice = chartData[0].medianPrice;
    const lastPrice = chartData[chartData.length - 1].medianPrice;
    const change = lastPrice - firstPrice;
    const percentage = (change / firstPrice) * 100;
    
    return {
      value: change,
      percentage: percentage
    };
  };

  const priceChange = calculatePriceChange();

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold">Price History</h3>
          <p className="text-sm text-muted-foreground">Median price trends over time</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Overall Change</div>
          <div className={`font-medium ${priceChange.percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {priceChange.percentage >= 0 ? '+' : ''}
            {priceChange.percentage.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ height: `${height}px`, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
            />
            <YAxis 
              yAxisId="left"
              label={{ 
                value: 'Median Price (thousands)',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' },
                fontSize: 12
              }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              label={{ 
                value: 'Price per Sq Ft',
                angle: -90,
                position: 'insideRight',
                style: { textAnchor: 'middle' },
                fontSize: 12
              }}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'medianPrice') return [`$${value}k`, 'Median Price'];
                if (name === 'pricePerSqFt') return [`$${value}`, 'Price/SqFt'];
                return [value, name];
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="medianPrice" 
              name="Median Price" 
              stroke="#FF7A00" 
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="pricePerSqFt" 
              name="Price per Sq Ft" 
              stroke="#071224" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceHistoryChart;