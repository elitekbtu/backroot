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
                  to="/dashboard" 
                  className={`hover:text-white ${isActive('/dashboard')}`}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/weather" 
                  className={`hover:text-white ${isActive('/dashboard/weather')}`}
                >
                  Weather
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@backroot.com" className="text-gray-300 hover:text-white">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="mailto:info@backroot.com" className="text-gray-300 hover:text-white">
                  General Inquiries
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
