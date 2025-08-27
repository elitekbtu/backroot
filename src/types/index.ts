export interface Achievement {
  id: number;
  name: string;
  icon: string;
  points: number;
  latitude: number;
  longitude: number;
  distance?: number;
  collected?: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationError {
  code: number;
  message: string;
}






