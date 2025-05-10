interface DaysOnMarketChartProps {
  days: number;
}

const DaysOnMarketChart = ({ days }: DaysOnMarketChartProps) => {
  // Calculate the stroke-dasharray value based on the days (30 days is considered average)
  const percentage = Math.min(100, Math.max(0, (days / 60) * 100));
  const dashArray = `${percentage}, 100`;
  
  return (
    <div className="flex justify-center items-center h-48">
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
              className="stroke-current text-accent"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={dashArray}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute text-center">
            <div className="text-3xl font-semibold">{days}</div>
            <div className="text-sm text-text-secondary">days</div>
          </div>
        </div>
        <div className="mt-2 text-sm text-text-secondary">Median Days on Market</div>
      </div>
    </div>
  );
};

export default DaysOnMarketChart;
