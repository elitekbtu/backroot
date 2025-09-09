import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainNavbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-600' : 'text-gray-600';
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/dashboard" className="text-2xl font-bold text-gray-800">
              BackRoot
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                to="/dashboard" 
                className={`hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard')}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/dashboard/weather" 
                className={`hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard/weather')}`}
              >
                Weather
              </Link>
              <Link 
                to="/dashboard/ar" 
                className={`hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard/ar')}`}
              >
                AR Coins
              </Link>
              <Link 
                to="/dashboard/profile" 
                className={`hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard/profile')}`}
              >
                Profile
              </Link>
            </div>
          </div>
          
          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {/* User greeting */}
            {user && (
              <span className="text-gray-600 text-sm">
                Welcome, {user.first_name || user.username}!
              </span>
            )}
            
            <Link 
              to="/dashboard/settings" 
              className={`hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard/settings')}`}
            >
              Settings
            </Link>
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              onClick={logout}
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