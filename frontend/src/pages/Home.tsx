import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { BackRootFeatures } from '@/components/ui/backroot-features';
import { Mic, Camera, Cloud, Settings } from 'lucide-react';

const Home: React.FC = () => {
  const deviceInfo = useDeviceDetection();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 120,
        damping: 20,
      },
    },
  };

  const quickActions = [
    { 
      path: '/dashboard/v2v', 
      icon: <Mic className="w-6 h-6" />, 
      title: 'Voice to Voice', 
      description: 'Convert and process voice content'
    },
    { 
      path: '/dashboard/ar', 
      icon: <Camera className="w-6 h-6" />, 
      title: 'AR Features', 
      description: 'Augmented reality experiences'
    },
    { 
      path: '/dashboard/weather', 
      icon: <Cloud className="w-6 h-6" />, 
      title: 'Weather', 
      description: 'Real-time weather data'
    },
    { 
      path: '/dashboard/settings', 
      icon: <Settings className="w-6 h-6" />, 
      title: 'Settings', 
      description: 'Configure your preferences'
    },
  ];

  return (
    <motion.div 
      className="min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          variants={itemVariants}
        >
          <motion.h1 
            className={`font-light text-gray-900 mb-4 ${
              deviceInfo.isKiosk ? 'text-5xl' : 
              deviceInfo.isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'
            }`}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 15,
              delay: 0.1 
            }}
          >
            Welcome to <motion.span 
              className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.3 
              }}
            >
              BackRoot
            </motion.span>
          </motion.h1>
          <motion.p 
            className={`text-gray-500 max-w-2xl mx-auto ${
              deviceInfo.isKiosk ? 'text-xl' : 
              deviceInfo.isMobile ? 'text-base' : 'text-lg'
            }`}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 15,
              delay: 0.4 
            }}
          >
            AI-powered platform for communication and content creation
          </motion.p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className={`grid gap-4 mb-12 ${
            deviceInfo.isKiosk ? 'grid-cols-2 lg:grid-cols-4' : 
            deviceInfo.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}
          variants={containerVariants}
        >
          {quickActions.map((action) => (
            <motion.div 
              key={action.path} 
              className="group relative"
              variants={cardVariants}
              whileHover={{ 
                y: -10,
                scale: 1.02,
                transition: { 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20 
                }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative h-full rounded-lg border border-gray-200 p-2">
                <GlowingEffect
                  spread={25}
                  glow={true}
                  disabled={false}
                  proximity={60}
                  inactiveZone={0.4}
                  borderWidth={2}
                  movementDuration={1.2}
                />
                <Link 
                  to={action.path} 
                  className={`relative flex h-full flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg text-center hover:bg-white/90 transition-all duration-300 ${
                    deviceInfo.isKiosk ? 'p-6' : 
                    deviceInfo.isMobile ? 'p-4' : 'p-6'
                  }`}
                >
                  <motion.div 
                    className={`mb-4 group-hover:scale-110 transition-transform duration-300 ${
                      deviceInfo.isKiosk ? 'text-6xl' : 
                      deviceInfo.isMobile ? 'text-3xl' : 'text-4xl'
                    }`}
                    whileHover={{ 
                      rotate: [0, -10, 10, -10, 0],
                      transition: { duration: 0.5 }
                    }}
                  >
                    {action.icon}
                  </motion.div>
                  <motion.h3 
                    className={`font-medium text-gray-900 mb-2 ${
                      deviceInfo.isKiosk ? 'text-xl' : 
                      deviceInfo.isMobile ? 'text-base' : 'text-base'
                    }`}
                    whileHover={{ color: "#3b82f6" }}
                    transition={{ duration: 0.2 }}
                  >
                    {action.title}
                  </motion.h3>
                  <motion.p 
                    className={`text-gray-500 ${
                      deviceInfo.isKiosk ? 'text-base' : 
                      deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                    }`}
                    whileHover={{ color: "#6b7280" }}
                    transition={{ duration: 0.2 }}
                  >
                    {action.description}
                  </motion.p>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 100, 
          damping: 20,
          delay: 0.8 
        }}
      >
        <BackRootFeatures />
      </motion.div>
    </motion.div>
  );
};

export default Home;