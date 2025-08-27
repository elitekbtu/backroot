import { PermissionsAndroid, Platform } from 'react-native';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationError {
  code: number;
  message: string;
}

export class LocationService {
  static async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  }

  static async getCurrentPosition(): Promise<LocationData> {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeoutMs: 15000,
        maximumAge: 10000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (error: any) {
      throw {
        code: error.code || 2,
        message: this.getErrorMessage(error.code || 2),
      };
    }
  }

  static async watchPosition(
    callback: (location: LocationData) => void,
    errorCallback: (error: LocationError) => void
  ): Promise<{ remove: () => void }> {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        }
      );
      
      return subscription;
    } catch (error: any) {
      errorCallback({
        code: error.code || 2,
        message: this.getErrorMessage(error.code || 2),
      });
      return { remove: () => {} }; // dummy return for error case
    }
  }

  static clearWatch(subscription: { remove: () => void }): void {
    if (subscription && subscription.remove) {
      subscription.remove();
    }
  }

  private static getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Location access denied. Please enable location permissions in settings.';
      case 2:
        return 'Location unavailable. Please check your device settings.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        return 'Unknown location error occurred.';
    }
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
