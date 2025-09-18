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
      description: 'Convert and process voice content',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      path: '/dashboard/ar', 
      icon: '📹', 
      title: 'AR Features', 
      description: 'Augmented reality experiences',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      path: '/dashboard/weather', 
      icon: '🌤️', 
      title: 'Weather', 
      description: 'Real-time weather data',
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      path: '/dashboard/settings', 
      icon: '⚙️', 
      title: 'Settings', 
      description: 'Configure your preferences',
      color: 'from-gray-500 to-gray-600'
    },
  ];

  const recentActivities = [
    { icon: '🎤', title: 'Voice Processing', time: 'Last processed 2 hours ago' },
    { icon: '📹', title: 'AR Session', time: 'Last used yesterday' },
    { icon: '🌤️', title: 'Weather Check', time: 'Updated 5 minutes ago' },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${deviceInfo.isKiosk ? 'text-2xl' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className={`font-bold text-gray-900 mb-4 sm:mb-6 ${
            deviceInfo.isKiosk 
              ? 'text-6xl sm:text-8xl' 
              : deviceInfo.isMobile
              ? 'text-2xl sm:text-3xl'
              : 'text-3xl sm:text-4xl lg:text-6xl'
          }`}>
            Welcome to <span className="text-blue-600">BackRoot</span>
          </h1>
          <p className={`text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto ${
            deviceInfo.isKiosk 
              ? 'text-2xl sm:text-3xl' 
              : deviceInfo.isMobile
              ? 'text-base sm:text-lg'
              : 'text-lg sm:text-xl lg:text-2xl'
          }`}>
            Your AI-powered voice and video platform for seamless communication and content creation
          </p>
        </div>

        {/* Quick Actions */}
        <div className={`grid gap-4 sm:gap-6 mb-8 sm:mb-12 lg:mb-16 ${
          deviceInfo.isKiosk 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
            : deviceInfo.isMobile
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {quickActions.map((action) => (
            <Link 
              key={action.path}
              to={action.path} 
              className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-center group ${
                deviceInfo.isKiosk 
                  ? 'p-8 sm:p-10' 
                  : deviceInfo.isMobile
                  ? 'p-4 sm:p-6'
                  : 'p-4 sm:p-6'
              }`}
            >
              <div className={`mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200 ${
                deviceInfo.isKiosk ? 'text-8xl sm:text-10xl' : 
                deviceInfo.isMobile ? 'text-4xl sm:text-5xl' : 'text-4xl sm:text-6xl'
              }`}>
                {action.icon}
              </div>
              <h3 className={`font-semibold mb-2 sm:mb-3 ${
                deviceInfo.isKiosk 
                  ? 'text-2xl sm:text-3xl' 
                  : deviceInfo.isMobile
                  ? 'text-base sm:text-lg'
                  : 'text-lg sm:text-xl'
              }`}>
                {action.title}
              </h3>
              <p className={`text-gray-600 ${
                deviceInfo.isKiosk 
                  ? 'text-lg sm:text-xl' 
                  : deviceInfo.isMobile
                  ? 'text-xs sm:text-sm'
                  : 'text-sm sm:text-base'
              }`}>
                {action.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className={`bg-white rounded-lg shadow-md ${
          deviceInfo.isKiosk ? 'p-8 sm:p-12' : 
          deviceInfo.isMobile ? 'p-4 sm:p-6' : 'p-6 sm:p-8'
        }`}>
          <h2 className={`font-bold text-gray-900 mb-4 sm:mb-6 ${
            deviceInfo.isKiosk ? 'text-3xl sm:text-4xl' : 
            deviceInfo.isMobile ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
          }`}>
            Recent Activity
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className={`flex items-center bg-gray-50 rounded-lg ${
                deviceInfo.isKiosk ? 'p-6 sm:p-8' : 
                deviceInfo.isMobile ? 'p-3 sm:p-4' : 'p-4 sm:p-6'
              }`}>
                <div className={`mr-4 sm:mr-6 ${
                  deviceInfo.isKiosk ? 'text-4xl sm:text-5xl' : 
                  deviceInfo.isMobile ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
                }`}>
                  {activity.icon}
                </div>
                <div>
                  <h4 className={`font-semibold ${
                    deviceInfo.isKiosk ? 'text-xl sm:text-2xl' : 
                    deviceInfo.isMobile ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
                  }`}>
                    {activity.title}
                  </h4>
                  <p className={`text-gray-600 ${
                    deviceInfo.isKiosk ? 'text-lg sm:text-xl' : 
                    deviceInfo.isMobile ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
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
