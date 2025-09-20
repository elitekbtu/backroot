import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, X, HelpCircle } from 'lucide-react';
import type { LocationContext, LocationPermissionState } from '../../types/location';

interface LocationCardProps {
  locationContext: LocationContext | null;
  locationPermission: LocationPermissionState;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  locationContext,
  locationPermission
}) => {
  return (
    <motion.div 
      className="group relative rounded-2xl border border-border/20 p-4 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300"
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-center space-x-3">
        <motion.div
          className="p-2 rounded-full bg-muted/50"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          {locationPermission.status === 'granted' ? (
            <MapPin className="w-5 h-5 text-green-500" />
          ) : locationPermission.status === 'denied' ? (
            <X className="w-5 h-5 text-red-500" />
          ) : (
            <HelpCircle className="w-5 h-5 text-yellow-500" />
          )}
        </motion.div>
        <div className="flex-1">
          <div className={`font-medium text-sm ${
            locationPermission.status === 'granted' ? 'text-green-600' :
            locationPermission.status === 'denied' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {locationContext ? locationContext.city.name : 'Location Unknown'}
          </div>
          <div className="text-xs text-muted-foreground">
            {locationContext ? locationContext.city.country : locationPermission.message}
          </div>
        </div>
      </div>
    </motion.div>
  );
};