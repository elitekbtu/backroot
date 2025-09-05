import type {
  CurrentWeatherResponse,
  ForecastResponse,
  WeatherData,
  WeatherParams,
  ForecastParams,
} from '../types/weather';

const API_KEY = 'bbaa0df6b1acbcf11a8c13cbadc2ee1c';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

class WeatherService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = API_KEY, baseUrl: string = API_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add API key and other parameters
    url.searchParams.append('appid', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404) {
          throw new Error('City not found. Please check the spelling and try again.');
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please contact support.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        } else {
          throw new Error(errorData.message || `Weather service error: ${response.status}`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Weather API request failed:', error);
      throw error;
    }
  }

  /**
   * Get current weather data for a specific location
   */
  async getCurrentWeather(params: WeatherParams): Promise<CurrentWeatherResponse> {
    const { lat, lon, units = 'metric', lang = 'en' } = params;
    
    return this.makeRequest<CurrentWeatherResponse>('/weather', {
      lat,
      lon,
      units,
      lang,
    });
  }

  /**
   * Get 5-day weather forecast for a specific location
   */
  async getForecast(params: ForecastParams): Promise<ForecastResponse> {
    const { lat, lon, units = 'metric', lang = 'en', cnt = 40 } = params;
    
    return this.makeRequest<ForecastResponse>('/forecast', {
      lat,
      lon,
      units,
      lang,
      cnt,
    });
  }

  /**
   * Get weather data by city name
   */
  async getCurrentWeatherByCity(city: string, units: 'metric' | 'imperial' | 'kelvin' = 'metric'): Promise<CurrentWeatherResponse> {
    return this.makeRequest<CurrentWeatherResponse>('/weather', {
      q: city,
      units,
    });
  }

  /**
   * Get combined current weather and forecast data
   */
  async getWeatherData(params: WeatherParams): Promise<WeatherData> {
    try {
      const [currentWeather, forecast] = await Promise.all([
        this.getCurrentWeather(params),
        this.getForecast(params),
      ]);

      return this.transformWeatherData(currentWeather, forecast);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      throw error;
    }
  }

  /**
   * Transform API response to simplified format for UI
   */
  transformWeatherData(
    current: CurrentWeatherResponse,
    forecast: ForecastResponse
  ): WeatherData {
    // Transform current weather
    const currentData = {
      temperature: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      humidity: current.main.humidity,
      pressure: current.main.pressure,
      windSpeed: current.wind.speed,
      visibility: current.visibility / 1000, // Convert to km
      city: current.name,
      country: current.sys.country,
    };

    // Transform forecast data (group by day and take daily max/min)
    const dailyForecast = this.groupForecastByDay(forecast.list);

    return {
      current: currentData,
      forecast: dailyForecast,
    };
  }

  /**
   * Group forecast items by day and calculate daily min/max temperatures
   */
  private groupForecastByDay(forecastItems: any[]) {
    const dailyData = new Map<string, any>();

    forecastItems.forEach((item) => {
      const date = new Date(item.dt * 1000).toDateString();
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date: date,
          temperatures: [],
          descriptions: [],
          icons: [],
          humidities: [],
          windSpeeds: [],
          precipitations: [],
        });
      }

      const dayData = dailyData.get(date);
      dayData.temperatures.push(item.main.temp);
      dayData.descriptions.push(item.weather[0].description);
      dayData.icons.push(item.weather[0].icon);
      dayData.humidities.push(item.main.humidity);
      dayData.windSpeeds.push(item.wind.speed);
      dayData.precipitations.push(item.pop || 0);
    });

    // Convert to array and calculate daily values
    return Array.from(dailyData.values()).map((dayData) => ({
      date: dayData.date,
      temperature: {
        min: Math.round(Math.min(...dayData.temperatures)),
        max: Math.round(Math.max(...dayData.temperatures)),
      },
      description: dayData.descriptions[Math.floor(dayData.descriptions.length / 2)], // Use middle of day description
      icon: dayData.icons[Math.floor(dayData.icons.length / 2)], // Use middle of day icon
      humidity: Math.round(dayData.humidities.reduce((a: number, b: number) => a + b, 0) / dayData.humidities.length),
      windSpeed: Math.round(dayData.windSpeeds.reduce((a: number, b: number) => a + b, 0) / dayData.windSpeeds.length),
      precipitation: Math.round(dayData.precipitations.reduce((a: number, b: number) => a + b, 0) / dayData.precipitations.length * 100),
    }));
  }

  /**
   * Get weather icon URL
   */
  getWeatherIconUrl(iconCode: string, size: '1x' | '2x' | '4x' = '2x'): string {
    return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
  }
}

// Create and export a singleton instance
export const weatherService = new WeatherService();
export default weatherService;
