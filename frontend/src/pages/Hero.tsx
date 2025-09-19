import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Заголовок */}
        <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
          Back<span className="font-normal">Root</span>
        </h1>
        
        {/* Подзаголовок */}
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          AI-powered voice and video platform for seamless communication
        </p>
        
        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link 
            to="/register" 
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded text-base font-medium transition-colors duration-200"
          >
            Get Started
          </Link>
          <Link 
            to="/login" 
            className="text-gray-900 hover:text-gray-700 border border-gray-300 px-8 py-3 rounded text-base font-medium transition-colors duration-200"
          >
            Learn More
          </Link>
        </div>
        
        {/* Особенности */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5">
            <div className="text-2xl mb-3">🎤</div>
            <h3 className="text-lg font-medium mb-2">Voice Processing</h3>
            <p className="text-gray-500 text-sm">Advanced AI voice recognition and synthesis</p>
          </div>
          <div className="p-5">
            <div className="text-2xl mb-3">📹</div>
            <h3 className="text-lg font-medium mb-2">Video Generation</h3>
            <p className="text-gray-500 text-sm">Create videos with AI assistance</p>
          </div>
          <div className="p-5">
            <div className="text-2xl mb-3">🌤️</div>
            <h3 className="text-lg font-medium mb-2">Weather Integration</h3>
            <p className="text-gray-500 text-sm">Real-time weather data and forecasts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;