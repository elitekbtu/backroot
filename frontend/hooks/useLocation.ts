import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
        timestamp: Date.now(),
      };

      setLocation(newLocation);
      console.log('📍 Location updated:', newLocation);
    } catch (error) {
      setErrorMsg('Error getting location');
      console.error('Location error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationUpdates = async () => {
    try {
      // Start watching position for real-time updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 15000, // Update every 15 seconds
          distanceInterval: 5, // Update every 5 meters
        },
        (newLocation) => {
          const updatedLocation = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy,
            timestamp: Date.now(),
          };
          setLocation(updatedLocation);
          console.log('📍 Location updated via watch:', updatedLocation);
        }
      );
    } catch (error) {
      console.error('Error starting location updates:', error);
    }
  };

  const stopLocationUpdates = () => {
    if (locationSubscription.current) {
      try {
        locationSubscription.current.remove();
      } catch (error) {
        console.log('Error removing location subscription:', error);
      }
      locationSubscription.current = null;
    }
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
  };

  useEffect(() => {
    // Get initial location
    getCurrentLocation();

    // Start periodic updates every 15 seconds
    updateInterval.current = setInterval(() => {
      getCurrentLocation();
    }, 15000);

    // Cleanup on unmount
    return () => {
      stopLocationUpdates();
    };
  }, []);

  return {
    location,
    errorMsg,
    loading,
    startLocationUpdates,
    stopLocationUpdates,
    refreshLocation: getCurrentLocation,
  };
};

