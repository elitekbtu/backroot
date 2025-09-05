import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MainFooter: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-400' : 'text-gray-300';
  };

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">BackRoot</h3>
            <p className="text-gray-300 mb-4">
              Your AI-powered voice and video platform for seamless communication and content creation.
            </p>
          </div>
          
          {/* Quick Navigation */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/home" 
                  className={`hover:text-white ${isActive('/home')}`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/v2v" 
                  className={`hover:text-white ${isActive('/v2v')}`}
                >
                  V2V
                </Link>
              </li>
              <li>
                <Link 
                  to="/ar" 
                  className={`hover:text-white ${isActive('/ar')}`}
                >
                  AR
                </Link>
              </li>
              <li>
                <Link 
                  to="/weather" 
                  className={`hover:text-white ${isActive('/weather')}`}
                >
                  Weather
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Settings & Account */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/settings" 
                  className={`hover:text-white ${isActive('/settings')}`}
                >
                  Settings
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Profile
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Help
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700">
          <p className="text-center text-gray-300">
            © 2024 BackRoot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
