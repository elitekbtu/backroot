import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">BackRoot</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your AI-powered voice and video platform for seamless communication and content creation
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Link 
            to="/v2v" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-center"
          >
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="text-xl font-semibold mb-2">Voice to Voice</h3>
            <p className="text-gray-600">Convert and process voice content</p>
          </Link>
          
          <Link 
            to="/ar" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-center"
          >
            <div className="text-4xl mb-4">📹</div>
            <h3 className="text-xl font-semibold mb-2">AR Features</h3>
            <p className="text-gray-600">Augmented reality experiences</p>
          </Link>
          
          <Link 
            to="/weather" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-center"
          >
            <div className="text-4xl mb-4">🌤️</div>
            <h3 className="text-xl font-semibold mb-2">Weather</h3>
            <p className="text-gray-600">Real-time weather data</p>
          </Link>
          
          <Link 
            to="/settings" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-center"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold mb-2">Settings</h3>
            <p className="text-gray-600">Configure your preferences</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mr-4">🎤</div>
              <div>
                <h4 className="font-semibold">Voice Processing</h4>
                <p className="text-gray-600">Last processed 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mr-4">📹</div>
              <div>
                <h4 className="font-semibold">AR Session</h4>
                <p className="text-gray-600">Last used yesterday</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mr-4">🌤️</div>
              <div>
                <h4 className="font-semibold">Weather Check</h4>
                <p className="text-gray-600">Updated 5 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
