import { useRef, useEffect } from "react";
import { MarketData } from "@shared/schema";

interface PriceChartProps {
  data: MarketData[];
}

const PriceChart = ({ data }: PriceChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;
    
    // Clear previous bars
    const container = containerRef.current;
    container.innerHTML = '';
    
    // Find max price for scaling
    const prices = data.map(item => Number(item.medianPrice));
    const maxPrice = Math.max(...prices);
    
    // Create bars for each month
    data.forEach((item, index) => {
      const percentage = (Number(item.medianPrice) / maxPrice) * 100;
      const left = `${(index / (data.length - 1)) * 92 + 4}%`;
      
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.style.left = left;
      bar.style.height = `${percentage}%`;
      bar.title = `${getMonthName(item.month)}: $${Number(item.medianPrice).toLocaleString()}`;
      
      container.appendChild(bar);
    });
  }, [data]);
  
  const getMonthName = (month: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[month - 1];
  };
  
  if (!data || data.length === 0) {
    return (
      <div className="chart-container flex justify-center items-center">
        <p className="text-text-secondary">No data available</p>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="chart-container"></div>
  );
};

export default PriceChart;
