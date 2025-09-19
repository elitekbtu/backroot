import React from 'react';
import { Link } from 'react-router-dom';

const GuestFooter: React.FC = () => {
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
          
          {/* Quick Links */}
          <div>
            <h4 className="text-base font-medium mb-3 text-gray-900">Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-900 text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/weather" className="text-gray-500 hover:text-gray-900 text-sm">
                  Weather
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-500 hover:text-gray-900 text-sm">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-500 hover:text-gray-900 text-sm">
                  Register
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Social Links */}
          <div>
            <h4 className="text-base font-medium mb-3 text-gray-900">Follow</h4>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">
                <span className="sr-only">Instagram</span>
                📷
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">
                <span className="sr-only">LinkedIn</span>
                💼
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">
                <span className="sr-only">Facebook</span>
                📘
              </a>
            </div>
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

export default GuestFooter;