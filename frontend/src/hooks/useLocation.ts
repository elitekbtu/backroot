import { useState, useCallback } from 'react';
import { locationService } from '../api/location';
import type { 
  LocationContext, 
  GeolocationError,
  LocationPermissionState,
  LocationUIState,
  LocationSettings
} from '../types/location';

export const useLocation = (locationSettings: LocationSettings) => {
  const [locationContext, setLocationContext] = useState<LocationContext | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>({
    status: 'unknown',
    canRequest: true,
    message: 'Checking location permission...'
  });
  const [locationUI, setLocationUI] = useState<LocationUIState>({
    isRequesting: false,
    isWatching: false,
    lastUpdate: null,
    error: null,
    showLocationInfo: false
  });

  const requestLocationPermission = useCallback(async () => {
    setLocationUI(prev => ({ ...prev, isRequesting: true, error: null }));
    
    try {
      const location = await locationService.getCurrentLocation({
        enableHighAccuracy: locationSettings.enableHighAccuracy,
        timeout: locationSettings.timeout,
        maximumAge: locationSettings.maximumAge
      });
      
      setLocationPermission({
        status: 'granted',
        canRequest: false,
        message: 'Location access granted'
      });
      
      // Get full location context
      const context = await locationService.getLocationContext(location);
      setLocationContext(context);
      
      setLocationUI(prev => ({
        ...prev,
        isRequesting: false,
        lastUpdate: new Date(),
        error: null
      }));
      
      return { success: true, context };
    } catch (error) {
      const geolocationError = error as GeolocationError;
      console.error('Location request failed:', geolocationError);
      
      let permissionStatus: LocationPermissionState['status'] = 'denied';
      let message = 'Location access denied';
      
      switch (geolocationError.type) {
        case 'permission_denied':
          permissionStatus = 'denied';
          message = 'Location access denied. Please enable location permissions in your browser settings.';
          break;
        case 'position_unavailable':
          permissionStatus = 'denied';
          message = 'Location unavailable. Please check your GPS settings.';
          break;
        case 'timeout':
          permissionStatus = 'denied';
          message = 'Location request timed out. Please try again.';
          break;
        default:
          permissionStatus = 'denied';
          message = 'Failed to get location. Please try again.';
      }
      
      setLocationPermission({
        status: permissionStatus,
        canRequest: true,
        message
      });
      
      setLocationUI(prev => ({
        ...prev,
        isRequesting: false,
        error: message
      }));
      
      // Create fallback location context for AI
      try {
        const fallbackContext = await locationService.getLocationContext({
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          timestamp: Date.now()
        });
        setLocationContext(fallbackContext);
        return { success: false, context: fallbackContext };
      } catch (fallbackError) {
        console.warn('Failed to create fallback location context:', fallbackError);
        return { success: false, context: null };
      }
    }
  }, [locationSettings]);

  const startLocationWatching = useCallback(() => {
    if (locationUI.isWatching) return;
    
    setLocationUI(prev => ({ ...prev, isWatching: true, error: null }));
    
    const watchId = locationService.watchLocation(
      async (location) => {
        setLocationUI(prev => ({
          ...prev,
          lastUpdate: new Date(),
          error: null
        }));
        
        if (locationSettings.autoUpdateContext) {
          try {
            const context = await locationService.getLocationContext(location);
            setLocationContext(context);
            return context;
          } catch (error) {
            console.error('Failed to update location context:', error);
            return null;
          }
        }
        return null;
      },
      (error) => {
        console.error('Location watch error:', error);
        setLocationUI(prev => ({
          ...prev,
          isWatching: false,
          error: error.message
        }));
      },
      {
        enableHighAccuracy: locationSettings.enableHighAccuracy,
        timeout: locationSettings.timeout,
        maximumAge: locationSettings.maximumAge
      }
    );
    
    if (watchId === -1) {
      setLocationUI(prev => ({
        ...prev,
        isWatching: false,
        error: 'Location watching not supported'
      }));
    }
  }, [locationSettings, locationUI.isWatching]);

  const stopLocationWatching = useCallback(() => {
    locationService.stopWatchingLocation();
    setLocationUI(prev => ({ ...prev, isWatching: false }));
  }, []);

  return {
    locationContext,
    locationPermission,
    locationUI,
    requestLocationPermission,
    startLocationWatching,
    stopLocationWatching,
    setLocationContext
  };
};