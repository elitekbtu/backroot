// Re-export types from location API for better organization
export type {
  LocationData,
  CityInfo,
  Attraction,
  TransportationInfo,
  LocationContext,
  GeolocationError,
  LocationServiceStatus
} from '../api/location';

// Additional UI-specific types
export interface LocationPermissionState {
  status: 'granted' | 'denied' | 'prompt' | 'unknown';
  canRequest: boolean;
  message: string;
}

export interface LocationUIState {
  isRequesting: boolean;
  isWatching: boolean;
  lastUpdate: Date | null;
  error: string | null;
  showLocationInfo: boolean;
}

export interface LocationSettings {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  watchLocation: boolean;
  autoUpdateContext: boolean;
}

// Default settings
export const DEFAULT_LOCATION_SETTINGS: LocationSettings = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // 5 minutes
  watchLocation: false,
  autoUpdateContext: true
};
