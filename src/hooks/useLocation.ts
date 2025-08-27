import { useState, useEffect, useRef } from 'react';
import { LocationService, LocationData, LocationError } from '../services/LocationService';

export interface UseLocationResult {
  location: LocationData | null;
  error: string | null;
  loading: boolean;
  requestLocation: () => Promise<void>;
  startWatching: () => void;
  stopWatching: () => void;
}

export const useLocation = (): UseLocationResult => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef<{ remove: () => void } | null>(null);

  const requestLocation = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Request permission first
      const hasPermission = await LocationService.requestLocationPermission();
      if (!hasPermission) {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      // Get current position
      const currentLocation = await LocationService.getCurrentPosition();
      setLocation(currentLocation);
    } catch (err) {
      const locationError = err as LocationError;
      setError(locationError.message);
    } finally {
      setLoading(false);
    }
  };

  const startWatching = async (): Promise<void> => {
    if (watchIdRef.current !== null) {
      return; // Already watching
    }

    const subscription = await LocationService.watchPosition(
      (newLocation) => {
        setLocation(newLocation);
        setError(null);
      },
      (err) => {
        setError(err.message);
      }
    );

    watchIdRef.current = subscription;
  };

  const stopWatching = (): void => {
    if (watchIdRef.current !== null) {
      LocationService.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Auto-request location on mount
  useEffect(() => {
    requestLocation();

    // Cleanup on unmount
    return () => {
      stopWatching();
    };
  }, []);

  return {
    location,
    error,
    loading,
    requestLocation,
    startWatching,
    stopWatching,
  };
};
