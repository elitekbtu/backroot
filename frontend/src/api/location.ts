import { apiClient } from './client';

// Types for location services
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface CityInfo {
  name: string;
  country: string;
  countryCode: string;
  state?: string;
  region?: string;
  timezone: string;
  population?: number;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface Attraction {
  id: string;
  name: string;
  description: string;
  category: 'landmark' | 'museum' | 'park' | 'restaurant' | 'shopping' | 'entertainment' | 'religious' | 'historical' | 'nature' | 'other';
  rating?: number;
  address?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  openingHours?: string;
  priceRange?: 'free' | 'low' | 'medium' | 'high';
  website?: string;
  imageUrl?: string;
}

export interface TransportationInfo {
  type: 'metro' | 'bus' | 'taxi' | 'walking' | 'car' | 'bike' | 'other';
  name: string;
  description: string;
  estimatedTime: string;
  estimatedCost?: string;
  route?: string;
}

export interface LocationContext {
  city: CityInfo;
  attractions: Attraction[];
  transportation: TransportationInfo[];
  weather?: {
    temperature: number;
    description: string;
    icon: string;
  };
  localTime: string;
  timezone: string;
}

export interface GeolocationError {
  code: number;
  message: string;
  type: 'permission_denied' | 'position_unavailable' | 'timeout' | 'unknown';
}

export interface LocationServiceStatus {
  geolocationSupported: boolean;
  permissionGranted: boolean;
  lastKnownLocation?: LocationData;
  error?: GeolocationError;
}

class LocationService {
  private watchId: number | null = null;
  private lastLocation: LocationData | null = null;
  private permissionStatus: PermissionState = 'prompt';

  constructor() {
    this.checkGeolocationSupport();
    this.checkPermissionStatus();
  }

  /**
   * Check if geolocation is supported by the browser
   */
  private checkGeolocationSupport(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Check current permission status for geolocation
   */
  private async checkPermissionStatus(): Promise<void> {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        this.permissionStatus = permission.state;
        permission.onchange = () => {
          this.permissionStatus = permission.state;
        };
      } catch (error) {
        console.warn('Could not check geolocation permission:', error);
      }
    }
  }

  /**
   * Get current location with high accuracy
   */
  async getCurrentLocation(options: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  } = {}): Promise<LocationData> {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options
    };

    return new Promise((resolve, reject) => {
      if (!this.checkGeolocationSupport()) {
        reject({
          code: 0,
          message: 'Geolocation is not supported by this browser',
          type: 'unknown' as const
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          this.lastLocation = locationData;
          resolve(locationData);
        },
        (error) => {
          const geolocationError: GeolocationError = {
            code: error.code,
            message: error.message,
            type: this.mapErrorCodeToType(error.code)
          };
          reject(geolocationError);
        },
        defaultOptions
      );
    });
  }

  /**
   * Watch location changes
   */
  watchLocation(
    onLocationUpdate: (location: LocationData) => void,
    onError: (error: GeolocationError) => void,
    options: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
    } = {}
  ): number {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
      ...options
    };

    if (!this.checkGeolocationSupport()) {
      onError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
        type: 'unknown'
      });
      return -1;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        this.lastLocation = locationData;
        onLocationUpdate(locationData);
      },
      (error) => {
        const geolocationError: GeolocationError = {
          code: error.code,
          message: error.message,
          type: this.mapErrorCodeToType(error.code)
        };
        onError(geolocationError);
      },
      defaultOptions
    );

    return this.watchId;
  }

  /**
   * Stop watching location
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get city information from coordinates using reverse geocoding
   */
  async getCityFromCoordinates(lat: number, lon: number): Promise<CityInfo> {
    try {
      // Use a free reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        name: data.city || data.locality || data.principalSubdivision || 'Unknown City',
        country: data.countryName || 'Unknown Country',
        countryCode: data.countryCode || 'XX',
        state: data.principalSubdivision,
        region: data.principalSubdivision,
        timezone: data.localityInfo?.administrative?.[0]?.timezone || 'UTC',
        coordinates: {
          lat: parseFloat(data.latitude) || lat,
          lon: parseFloat(data.longitude) || lon
        }
      };
    } catch (error) {
      console.error('Failed to get city from coordinates:', error);
      // Fallback to a default city
      return {
        name: 'Unknown City',
        country: 'Unknown Country',
        countryCode: 'XX',
        timezone: 'UTC',
        coordinates: {
          lat: lat,
          lon: lon
        }
      };
    }
  }

  /**
   * Get attractions and places of interest for a city
   */
  async getCityAttractions(cityName: string, countryCode?: string): Promise<Attraction[]> {
    try {
      // This would typically call your backend API
      // For now, we'll return a mock response
      const params = new URLSearchParams();
      params.append('city', cityName);
      if (countryCode) {
        params.append('country_code', countryCode);
      }
      const response = await apiClient.get<Attraction[]>(`/location/attractions?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to get city attractions:', error);
      // Return mock data as fallback
      return this.getMockAttractions(cityName);
    }
  }

  /**
   * Get transportation information for a city
   */
  async getTransportationInfo(cityName: string): Promise<TransportationInfo[]> {
    try {
      const params = new URLSearchParams();
      params.append('city', cityName);
      const response = await apiClient.get<TransportationInfo[]>(`/location/transportation?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to get transportation info:', error);
      return this.getMockTransportation(cityName);
    }
  }

  /**
   * Get complete location context for AI
   */
  async getLocationContext(location?: LocationData): Promise<LocationContext> {
    try {
      let currentLocation = location;
      
      if (!currentLocation) {
        currentLocation = await this.getCurrentLocation();
      }

      const city = await this.getCityFromCoordinates(
        currentLocation.latitude,
        currentLocation.longitude
      );

      const [attractions, transportation] = await Promise.all([
        this.getCityAttractions(city.name, city.countryCode),
        this.getTransportationInfo(city.name)
      ]);

      // Get local time
      const now = new Date();
      const localTime = now.toLocaleString('en-US', {
        timeZone: city.timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      return {
        city,
        attractions,
        transportation,
        localTime,
        timezone: city.timezone
      };
    } catch (error) {
      console.error('Failed to get location context:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getServiceStatus(): LocationServiceStatus {
    return {
      geolocationSupported: this.checkGeolocationSupport(),
      permissionGranted: this.permissionStatus === 'granted',
      lastKnownLocation: this.lastLocation || undefined,
      error: this.permissionStatus === 'denied' ? {
        code: 1,
        message: 'Geolocation permission denied',
        type: 'permission_denied'
      } : undefined
    };
  }

  /**
   * Map geolocation error codes to our error types
   */
  private mapErrorCodeToType(code: number): GeolocationError['type'] {
    switch (code) {
      case 1:
        return 'permission_denied';
      case 2:
        return 'position_unavailable';
      case 3:
        return 'timeout';
      default:
        return 'unknown';
    }
  }

  /**
   * Mock attractions data for fallback
   */
  private getMockAttractions(cityName: string): Attraction[] {
    const commonAttractions: Attraction[] = [
      {
        id: '1',
        name: 'City Center',
        description: 'The heart of the city with shops, restaurants, and cultural sites',
        category: 'landmark',
        rating: 4.5,
        priceRange: 'free'
      },
      {
        id: '2',
        name: 'Local Museum',
        description: 'Explore the history and culture of the region',
        category: 'museum',
        rating: 4.2,
        priceRange: 'low'
      },
      {
        id: '3',
        name: 'Central Park',
        description: 'A beautiful green space perfect for relaxation',
        category: 'park',
        rating: 4.3,
        priceRange: 'free'
      }
    ];

    return commonAttractions.map(attraction => ({
      ...attraction,
      name: `${cityName} ${attraction.name}`
    }));
  }

  /**
   * Mock transportation data for fallback
   */
  private getMockTransportation(_cityName: string): TransportationInfo[] {
    return [
      {
        type: 'metro',
        name: 'Metro System',
        description: 'Fast and efficient underground transportation',
        estimatedTime: '5-15 minutes',
        estimatedCost: '$2-5'
      },
      {
        type: 'bus',
        name: 'City Bus',
        description: 'Comprehensive bus network covering the entire city',
        estimatedTime: '10-30 minutes',
        estimatedCost: '$1-3'
      },
      {
        type: 'taxi',
        name: 'Taxi Service',
        description: 'Convenient door-to-door service',
        estimatedTime: '5-20 minutes',
        estimatedCost: '$10-25'
      },
      {
        type: 'walking',
        name: 'Walking',
        description: 'Explore the city on foot',
        estimatedTime: '10-45 minutes',
        estimatedCost: 'Free'
      }
    ];
  }
}

// Export singleton instance
export const locationService = new LocationService();
export default locationService;
