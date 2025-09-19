import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

interface BottomBarProps {
  className?: string;
}

const BottomBar: React.FC<BottomBarProps> = ({ className = '' }) => {
  const location = useLocation();
  const deviceInfo = useDeviceDetection();

  // Only show on mobile and tablet devices
  if (deviceInfo.isDesktop || deviceInfo.isKiosk) {
    return null;
  }

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Home', 
      icon: '🏠',
      activeIcon: '🏠'
    },
    { 
      path: '/dashboard/weather', 
      label: 'Weather', 
      icon: '🌤️',
      activeIcon: '🌤️'
    },
    { 
      path: '/dashboard/ar', 
      label: 'AR', 
      icon: '📹',
      activeIcon: '🥽'
    },
    { 
      path: '/dashboard/v2v', 
      label: 'Voice', 
      icon: '🎤',
      activeIcon: '🎙️'
    },
    { 
      path: '/dashboard/poi', 
      label: 'POI', 
      icon: '📍',
      activeIcon: '📍'
    },
    { 
      path: '/dashboard/profile', 
      label: 'Profile', 
      icon: '👤',
      activeIcon: '👤'
    },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 ${className}`}>
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1 transition-all duration-200 ${
                active 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className={`text-lg mb-1 transition-transform duration-200 ${
                active ? 'scale-110' : 'scale-100'
              }`}>
                {active ? item.activeIcon : item.icon}
              </div>
              <span className={`text-xs font-medium truncate ${
                deviceInfo.isMobile ? 'text-xs' : 'text-sm'
              }`}>
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white"></div>
    </div>
  );
};

export default BottomBar;
