import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

const MainNavbar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const deviceInfo = useDeviceDetection();

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-600' : 'text-gray-600';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/dashboard/weather', label: 'Weather', icon: '🌤️' },
    { path: '/dashboard/ar', label: 'AR Coins', icon: '📹' },
    { path: '/dashboard/v2v', label: 'Voice AI', icon: '🎤' },
    { path: '/dashboard/poi', label: 'POI Collector', icon: '📍' },
    { path: '/dashboard/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className={`bg-white shadow-lg ${deviceInfo.isKiosk ? 'text-2xl' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center ${
          deviceInfo.isKiosk ? 'h-20' : 
          deviceInfo.isMobile ? 'h-14' : 'h-16'
        }`}>
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/dashboard" className={`font-bold text-gray-800 ${
              deviceInfo.isKiosk ? 'text-4xl' : 
              deviceInfo.isMobile ? 'text-xl' : 'text-2xl'
            }`}>
              BackRoot
            </Link>
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden lg:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={`hover:text-gray-900 px-3 py-2 rounded-md font-medium transition-colors ${
                    deviceInfo.isKiosk ? 'text-lg px-4 py-3' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-sm'
                  } ${isActive(item.path)}`}
                >
                  {deviceInfo.isKiosk && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* User Info & Actions - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            
            <Link 
              to="/dashboard/settings" 
              className={`hover:text-gray-900 px-3 py-2 rounded-md font-medium transition-colors ${
                deviceInfo.isKiosk ? 'text-lg px-4 py-3' : 
                deviceInfo.isMobile ? 'text-sm' : 'text-sm'
              } ${isActive('/dashboard/settings')}`}
            >
              {deviceInfo.isKiosk && <span className="mr-2">⚙️</span>}
              Settings
            </Link>
            <button 
              className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors ${
                deviceInfo.isKiosk ? 'text-lg px-6 py-3' : 
                deviceInfo.isMobile ? 'text-sm px-3 py-1' : 'text-sm'
              }`}
              onClick={logout}
            >
              {deviceInfo.isKiosk && <span className="mr-2">🚪</span>}
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className={`p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${
                deviceInfo.isKiosk ? 'text-2xl p-3' : 
                deviceInfo.isMobile ? 'text-lg' : 'text-xl'
              }`}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-3 rounded-md font-medium transition-colors ${
                    deviceInfo.isKiosk ? 'text-xl' : 
                    deviceInfo.isMobile ? 'text-base' : 'text-base'
                  } ${isActive(item.path)}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile User Actions */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                
                <Link
                  to="/dashboard/settings"
                  className={`block px-3 py-3 rounded-md font-medium transition-colors ${
                    deviceInfo.isKiosk ? 'text-xl' : 
                    deviceInfo.isMobile ? 'text-base' : 'text-base'
                  } ${isActive('/dashboard/settings')}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-3">⚙️</span>
                  Settings
                </Link>
                
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-md font-medium transition-colors ${
                    deviceInfo.isKiosk ? 'text-xl' : 
                    deviceInfo.isMobile ? 'text-base' : 'text-base'
                  } bg-red-600 text-white hover:bg-red-700`}
                >
                  <span className="mr-3">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default MainNavbar;