import React from 'react';
import POICollectorComponent from '../components/POICollector.tsx';

const POICollector: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-4">
            POI Collector
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Collect coins by visiting interesting places in your city
          </p>
        </div>
        
        <POICollectorComponent />
      </div>
    </div>
  );
};

export default POICollector;
