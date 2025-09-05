// Weather API response types for OpenWeatherMap API 2.5
export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface MainWeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  sea_level?: number;
  grnd_level?: number;
}

export interface Wind {
  speed: number;
  deg: number;
  gust?: number;
}

export interface Clouds {
  all: number;
}

export interface Rain {
  '1h'?: number;
  '3h'?: number;
}

export interface Snow {
  '1h'?: number;
  '3h'?: number;
}

export interface Sys {
  type?: number;
  id?: number;
  country: string;
  sunrise: number;
  sunset: number;
}

export interface Coord {
  lon: number;
  lat: number;
}

// Current weather response
export interface CurrentWeatherResponse {
  coord: Coord;
  weather: WeatherCondition[];
  base: string;
  main: MainWeatherData;
  visibility: number;
  wind: Wind;
  clouds: Clouds;
  rain?: Rain;
  snow?: Snow;
  dt: number;
  sys: Sys;
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

// 5-day forecast response
export interface ForecastItem {
  dt: number;
  main: MainWeatherData;
  weather: WeatherCondition[];
  clouds: Clouds;
  wind: Wind;
  visibility: number;
  pop: number;
  rain?: Rain;
  snow?: Snow;
  sys: {
    pod: string;
  };
  dt_txt: string;
}

export interface ForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastItem[];
  city: {
    id: number;
    name: string;
    coord: Coord;
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

// Simplified types for UI
export interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    description: string;
    icon: string;
    humidity: number;
    pressure: number;
    windSpeed: number;
    visibility: number;
    city: string;
    country: string;
  };
  forecast: {
    date: string;
    temperature: {
      min: number;
      max: number;
    };
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    precipitation: number;
  }[];
}

// API request parameters
export interface WeatherParams {
  lat: number;
  lon: number;
  units?: 'metric' | 'imperial' | 'kelvin';
  lang?: string;
}

export interface ForecastParams {
  lat: number;
  lon: number;
  units?: 'metric' | 'imperial' | 'kelvin';
  lang?: string;
  cnt?: number;
}
