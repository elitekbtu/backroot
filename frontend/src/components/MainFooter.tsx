import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MainFooter: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-600' : 'text-gray-500';
  };

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-medium mb-3 text-gray-900">
              Back<span className="font-normal">Root</span>
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              AI-powered voice and video platform for seamless communication
            </p>
          </div>
          
          {/* Quick Navigation */}
          <div>
            <h4 className="text-base font-medium mb-3 text-gray-900">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/dashboard" 
                  className={`hover:text-gray-900 text-sm ${isActive('/dashboard')}`}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/weather" 
                  className={`hover:text-gray-900 text-sm ${isActive('/dashboard/weather')}`}
                >
                  Weather
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/ar" 
                  className={`hover:text-gray-900 text-sm ${isActive('/dashboard/ar')}`}
                >
                  AR Coins
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/v2v" 
                  className={`hover:text-gray-900 text-sm ${isActive('/dashboard/v2v')}`}
                >
                  Voice AI
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="text-base font-medium mb-3 text-gray-900">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@backroot.com" className="text-gray-500 hover:text-gray-900 text-sm">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="mailto:info@backroot.com" className="text-gray-500 hover:text-gray-900 text-sm">
                  General Inquiries
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-400 text-xs">
            © 2025 BackRoot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
