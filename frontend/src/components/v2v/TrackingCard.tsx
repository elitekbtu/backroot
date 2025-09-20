import React from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import type { LocationUIState } from '../../types/location';

interface TrackingCardProps {
  locationUI: LocationUIState;
}

export const TrackingCard: React.FC<TrackingCardProps> = ({ locationUI }) => {
  return (
    <motion.div 
      className="group relative rounded-2xl border border-border/20 p-4 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300"
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-center space-x-3">
        <motion.div
          className="p-2 rounded-full bg-muted/50"
          animate={{ scale: locationUI.isWatching ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 2, repeat: locationUI.isWatching ? Infinity : 0 }}
        >
          {locationUI.isWatching ? (
            <Eye className="w-5 h-5 text-blue-500" />
          ) : (
            <EyeOff className="w-5 h-5 text-muted-foreground" />
          )}
        </motion.div>
        <div className="flex-1">
          <div className="font-medium text-sm text-foreground">
            {locationUI.isWatching ? 'Tracking Active' : 'Tracking Disabled'}
          </div>
          <div className="text-xs text-muted-foreground">
            {locationUI.lastUpdate ? 
              `Updated: ${locationUI.lastUpdate.toLocaleTimeString()}` : 
              'No Data'
            }
          </div>
        </div>
      </div>
    </motion.div>
  );
};