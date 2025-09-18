import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

const GuestNavbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const deviceInfo = useDeviceDetection();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className={`bg-white shadow-lg ${deviceInfo.isKiosk ? 'text-2xl' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center ${
          deviceInfo.isKiosk ? 'h-20' : 
          deviceInfo.isMobile ? 'h-14' : 'h-16'
        }`}>
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className={`font-bold text-gray-800 ${
              deviceInfo.isKiosk ? 'text-4xl' : 
              deviceInfo.isMobile ? 'text-xl' : 'text-2xl'
            }`}>
              BackRoot
            </Link>
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                to="/" 
                className={`text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium transition-colors ${
                  deviceInfo.isKiosk ? 'text-lg px-4 py-3' : 
                  deviceInfo.isMobile ? 'text-sm' : 'text-sm'
                }`}
              >
                {deviceInfo.isKiosk && <span className="mr-2">🏠</span>}
                Home
              </Link>
            </div>
          </div>
          
          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/login" 
              className={`text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium transition-colors ${
                deviceInfo.isKiosk ? 'text-lg px-4 py-3' : 
                deviceInfo.isMobile ? 'text-sm' : 'text-sm'
              }`}
            >
              {deviceInfo.isKiosk && <span className="mr-2">🔑</span>}
              Login
            </Link>
            <Link 
              to="/register" 
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors ${
                deviceInfo.isKiosk ? 'text-lg px-6 py-3' : 
                deviceInfo.isMobile ? 'text-sm px-3 py-1' : 'text-sm'
              }`}
            >
              {deviceInfo.isKiosk && <span className="mr-2">📝</span>}
              Register
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
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
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className={`block px-3 py-3 rounded-md font-medium transition-colors text-gray-600 hover:text-gray-900 ${
                  deviceInfo.isKiosk ? 'text-xl' : 
                  deviceInfo.isMobile ? 'text-base' : 'text-base'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-3">🏠</span>
                Home
              </Link>
              
              {/* Mobile Auth Actions */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <Link
                  to="/login"
                  className={`block px-3 py-3 rounded-md font-medium transition-colors text-gray-600 hover:text-gray-900 ${
                    deviceInfo.isKiosk ? 'text-xl' : 
                    deviceInfo.isMobile ? 'text-base' : 'text-base'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-3">🔑</span>
                  Login
                </Link>
                
                <Link
                  to="/register"
                  className={`block px-3 py-3 rounded-md font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 ${
                    deviceInfo.isKiosk ? 'text-xl' : 
                    deviceInfo.isMobile ? 'text-base' : 'text-base'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-3">📝</span>
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default GuestNavbar;