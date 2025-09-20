import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";

const MainNavbar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-black' : 'text-gray-600';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/dashboard/weather', label: 'Weather' },
    { path: '/dashboard/ar', label: 'AR Coins' },
    { path: '/dashboard/v2v', label: 'Voice AI' },
    { path: '/dashboard/poi', label: 'POI Collector' },
  ];

  const profileItems = [
    { path: '/dashboard/profile', label: 'Profile' },
    { path: '/dashboard/settings', label: 'Settings' },
  ];

  return (
    <div className="flex justify-center w-full py-6 px-4">
      <div className="flex items-center justify-between px-6 py-3 bg-transparent w-full max-w-4xl relative z-10">
        <div className="flex items-center">
          <Link to="/dashboard" className="font-medium text-black text-xl">
            Back<span className="font-normal">Root</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <Link 
                to={item.path} 
                className={`text-sm font-medium transition-colors ${
                  isActive(item.path) ? 'text-black' : 'text-black hover:text-gray-600'
                }`}
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Desktop Profile Dropdown */}
        <div className="hidden md:flex items-center space-x-4">
          <motion.div
            className="relative group"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <button className="flex items-center space-x-2 text-sm text-black hover:text-gray-600 transition-colors font-medium">
              <span>Profile</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                {profileItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                      isActive(item.path) ? 'text-black bg-gray-100' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={logout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <motion.button 
          className="md:hidden flex items-center" 
          onClick={toggleMobileMenu} 
          whileTap={{ scale: 0.9 }}
        >
          <Menu className="h-6 w-6 text-black" />
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={toggleMobileMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-gray-900" />
            </motion.button>
            <div className="flex flex-col space-y-6">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Link 
                    to={item.path} 
                    className={`text-base font-medium ${
                      isActive(item.path) ? 'text-black' : 'text-gray-900'
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {/* Profile Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-6 border-t border-gray-200"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Profile</h3>
                  {profileItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block text-base font-medium ${
                        isActive(item.path) ? 'text-black' : 'text-gray-900'
                      }`}
                      onClick={toggleMobileMenu}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      logout();
                      toggleMobileMenu();
                    }}
                    className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainNavbar;
