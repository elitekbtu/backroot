import React from 'react';
import { Link } from 'react-router-dom';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { BackRootFeatures } from '@/components/ui/backroot-features';

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

  return (
    <div className="min-h-screen">
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
            <div key={action.path} className="group relative">
              <div className="relative h-full rounded-lg border border-gray-200 p-2">
                <GlowingEffect
                  spread={25}
                  glow={true}
                  disabled={false}
                  proximity={60}
                  inactiveZone={0.4}
                  borderWidth={2}
                  movementDuration={1.2}
                />
                <Link 
                  to={action.path} 
                  className={`relative flex h-full flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg text-center hover:bg-white/90 transition-colors duration-200 ${
                    deviceInfo.isKiosk ? 'p-6' : 
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <BackRootFeatures />
    </div>
  );
};

export default Home;