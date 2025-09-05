import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Welcome to <span className="text-blue-600">BackRoot</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Your AI-powered voice and video platform for seamless communication and content creation
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/register" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
          >
            Get Started
          </Link>
          <Link 
            to="/login" 
            className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
          >
            Learn More
          </Link>
        </div>
        
        {/* Features Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🎤</div>
            <h3 className="text-xl font-semibold mb-2">Voice Processing</h3>
            <p className="text-gray-600">Advanced AI-powered voice recognition and synthesis</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📹</div>
            <h3 className="text-xl font-semibold mb-2">Video Generation</h3>
            <p className="text-gray-600">Create stunning videos with AI assistance</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🌤️</div>
            <h3 className="text-xl font-semibold mb-2">Weather Integration</h3>
            <p className="text-gray-600">Real-time weather data and forecasts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;