import React from 'react';
import POICollectorComponent from '../components/POICollector.tsx';

const POICollector: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🏆 POI Collector
          </h1>
          <p className="text-lg text-gray-600">
            Собирайте коины, посещая интересные места в вашем городе!
          </p>
        </div>
        
        <POICollectorComponent />
      </div>
    </div>
  );
};

export default POICollector;
