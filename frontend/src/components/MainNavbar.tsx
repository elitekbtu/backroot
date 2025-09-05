import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MainNavbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-600' : 'text-gray-600';
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/home" className="text-2xl font-bold text-gray-800">
              BackRoot
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                to="/home" 
                className={`hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${isActive('/home')}`}
              >
                Home
              </Link>
              <Link 
                to="/v2v" 
                className={`hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${isActive('/v2v')}`}
              >
                V2V
              </Link>
              <Link 
                to="/ar" 
                className={`hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${isActive('/ar')}`}
              >
                AR
              </Link>
              <Link 
                to="/weather" 
                className={`hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${isActive('/weather')}`}
              >
                Weather
              </Link>
            </div>
          </div>
          
          {/* Settings Button */}
          <div className="flex items-center space-x-4">
            <Link 
              to="/settings" 
              className={`hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${isActive('/settings')}`}
            >
              Settings
            </Link>
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              onClick={() => {
                // Add logout logic here
                console.log('Logout clicked');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavbar;