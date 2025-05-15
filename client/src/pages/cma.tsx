import React from 'react';
import CMAReportGenerator from '@/components/CMAReportGenerator';

const CMAPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900">CMA Reports</h1>
            <p className="mt-4 text-lg text-gray-500">
              Create Comparative Market Analysis reports to evaluate property values
            </p>
          </div>
          
          <div className="mt-10">
            <CMAReportGenerator />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMAPage;