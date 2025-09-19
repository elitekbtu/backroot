import React from 'react';
import { Link } from 'react-router-dom';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

const Home: React.FC = () => {
  const deviceInfo = useDeviceDetection();

  const quickActions = [
    { 
      path: '/dashboard/v2v', 
      icon: '🎤', 
      title: 'Voice to Voice', 
      description: 'Convert and process voice content'
    },
    { 
      path: '/dashboard/ar', 
      icon: '📹', 
      title: 'AR Features', 
      description: 'Augmented reality experiences'
    },
    { 
      path: '/dashboard/weather', 
      icon: '🌤️', 
      title: 'Weather', 
      description: 'Real-time weather data'
    },
    { 
      path: '/dashboard/settings', 
      icon: '⚙️', 
      title: 'Settings', 
      description: 'Configure your preferences'
    },
  ];

  const recentActivities = [
    { icon: '🎤', title: 'Voice Processing', time: '2 hours ago' },
    { icon: '📹', title: 'AR Session', time: 'yesterday' },
    { icon: '🌤️', title: 'Weather Check', time: '5 min ago' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`font-light text-gray-900 mb-4 ${
            deviceInfo.isKiosk ? 'text-5xl' : 
            deviceInfo.isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'
          }`}>
            Welcome to <span className="font-medium">BackRoot</span>
          </h1>
          <p className={`text-gray-500 max-w-2xl mx-auto ${
            deviceInfo.isKiosk ? 'text-xl' : 
            deviceInfo.isMobile ? 'text-base' : 'text-lg'
          }`}>
            AI-powered platform for communication and content creation
          </p>
        </div>

        {/* Quick Actions */}
        <div className={`grid gap-4 mb-12 ${
          deviceInfo.isKiosk ? 'grid-cols-2 lg:grid-cols-4' : 
          deviceInfo.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {quickActions.map((action) => (
            <Link 
              key={action.path}
              to={action.path} 
              className={`bg-white border border-gray-200 rounded-lg text-center hover:border-gray-300 transition-colors duration-200 group ${
                deviceInfo.isKiosk ? 'p-8' : 
                deviceInfo.isMobile ? 'p-4' : 'p-6'
              }`}
            >
              <div className={`mb-4 group-hover:scale-105 transition-transform duration-200 ${
                deviceInfo.isKiosk ? 'text-6xl' : 
                deviceInfo.isMobile ? 'text-3xl' : 'text-4xl'
              }`}>
                {action.icon}
              </div>
              <h3 className={`font-medium text-gray-900 mb-2 ${
                deviceInfo.isKiosk ? 'text-xl' : 
                deviceInfo.isMobile ? 'text-base' : 'text-base'
              }`}>
                {action.title}
              </h3>
              <p className={`text-gray-500 ${
                deviceInfo.isKiosk ? 'text-base' : 
                deviceInfo.isMobile ? 'text-xs' : 'text-sm'
              }`}>
                {action.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className={`bg-white border border-gray-200 rounded-lg ${
          deviceInfo.isKiosk ? 'p-8' : 
          deviceInfo.isMobile ? 'p-4' : 'p-6'
        }`}>
          <h2 className={`font-medium text-gray-900 mb-6 ${
            deviceInfo.isKiosk ? 'text-2xl' : 
            deviceInfo.isMobile ? 'text-lg' : 'text-xl'
          }`}>
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className={`flex items-center hover:bg-gray-50 rounded-lg transition-colors duration-200 ${
                deviceInfo.isKiosk ? 'p-4' : 
                deviceInfo.isMobile ? 'p-2' : 'p-3'
              }`}>
                <div className={`mr-4 ${
                  deviceInfo.isKiosk ? 'text-3xl' : 
                  deviceInfo.isMobile ? 'text-xl' : 'text-2xl'
                }`}>
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium text-gray-900 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>
                    {activity.title}
                  </h4>
                  <p className={`text-gray-500 ${
                    deviceInfo.isKiosk ? 'text-base' : 
                    deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                  }`}>
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;