import React, { useState, useEffect } from 'react';
import { weatherService } from '../api/weather';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import type { WeatherData } from '../types/weather';

const Weather: React.FC = () => {
  const deviceInfo = useDeviceDetection();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [citySearch, setCitySearch] = useState<string>('');

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please search for a city.');
          setLoading(false);
        },
        {
          timeout: 10000,
          enableHighAccuracy: false,
        }
      );
    } else {
      setError('Geolocation not supported. Please search for a city.');
      setLoading(false);
    }
  }, []);

  // Fetch weather data when location is available
  useEffect(() => {
    if (location) {
      fetchWeatherData();
    }
  }, [location]);

  const fetchWeatherData = async () => {
    if (!location) return;

    try {
      setLoading(true);
      setError(null);
      const data = await weatherService.getWeatherData({
        lat: location.lat,
        lon: location.lon,
        units: 'metric',
      });
      setWeatherData(data);
    } catch (err) {
      setError('Failed to fetch weather data. Please try again.');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citySearch.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const currentWeather = await weatherService.getCurrentWeatherByCity(citySearch.trim());
      
      const forecast = await weatherService.getForecast({
        lat: currentWeather.coord.lat,
        lon: currentWeather.coord.lon,
        units: 'metric',
      });

      const data = weatherService.transformWeatherData(currentWeather, forecast);
      setWeatherData(data);
      setLocation({
        lat: currentWeather.coord.lat,
        lon: currentWeather.coord.lon,
      });
      setCitySearch('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'City not found. Please try a different city.';
      setError(errorMessage);
      console.error('City search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full border-b-2 border-gray-900 mx-auto mb-4 ${
            deviceInfo.isKiosk ? 'h-16 w-16' : 
            deviceInfo.isMobile ? 'h-8 w-8' : 'h-12 w-12'
          }`}></div>
          <div className={`text-gray-600 ${
            deviceInfo.isKiosk ? 'text-xl' : 
            deviceInfo.isMobile ? 'text-sm' : 'text-base'
          }`}>
            Loading weather data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className={`w-full text-center ${
          deviceInfo.isKiosk ? 'max-w-lg' : 'max-w-md'
        }`}>
          <div className={`text-red-500 mb-4 ${
            deviceInfo.isKiosk ? 'text-2xl' : 
            deviceInfo.isMobile ? 'text-base' : 'text-lg'
          }`}>
            ⚠️ {error}
          </div>
          <form onSubmit={handleCitySearch} className="space-y-4">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Enter city name"
              className={`w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                deviceInfo.isKiosk ? 'px-6 py-4 text-lg' : 
                deviceInfo.isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3'
              }`}
            />
            <button
              type="submit"
              className={`w-full bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors ${
                deviceInfo.isKiosk ? 'py-4 px-6 text-lg' : 
                deviceInfo.isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-4'
              }`}
            >
              Search City
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-gray-600 ${
          deviceInfo.isKiosk ? 'text-xl' : 
          deviceInfo.isMobile ? 'text-sm' : 'text-base'
        }`}>
          No weather data available
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`font-light text-gray-900 mb-4 ${
            deviceInfo.isKiosk ? 'text-4xl' : 
            deviceInfo.isMobile ? 'text-2xl' : 'text-3xl'
          }`}>
            Weather Forecast
          </h1>
          <form onSubmit={handleCitySearch} className={`flex flex-col sm:flex-row gap-2 mx-auto ${
            deviceInfo.isKiosk ? 'max-w-lg' : 'max-w-md'
          }`}>
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search city..."
              className={`flex-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                deviceInfo.isKiosk ? 'px-6 py-3 text-lg' : 
                deviceInfo.isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
              }`}
            />
            <button
              type="submit"
              className={`bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors ${
                deviceInfo.isKiosk ? 'px-6 py-3 text-lg' : 
                deviceInfo.isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
              }`}
            >
              Search
            </button>
          </form>
        </div>

        {/* Current Weather */}
        <div className={`bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg mb-8 ${
          deviceInfo.isKiosk ? 'p-8' : 
          deviceInfo.isMobile ? 'p-4' : 'p-6'
        }`}>
          <div className="text-center">
            <h2 className={`font-medium text-gray-900 mb-4 ${
              deviceInfo.isKiosk ? 'text-2xl' : 
              deviceInfo.isMobile ? 'text-lg' : 'text-xl'
            }`}>
              {weatherData.current.city}, {weatherData.current.country}
            </h2>
            
            <div className={`flex flex-col sm:flex-row items-center justify-center mb-6 ${
              deviceInfo.isKiosk ? 'gap-8' : 
              deviceInfo.isMobile ? 'gap-4' : 'gap-6'
            }`}>
              <img
                src={weatherService.getWeatherIconUrl(weatherData.current.icon, '4x')}
                alt={weatherData.current.description}
                className={`${
                  deviceInfo.isKiosk ? 'w-32 h-32' : 
                  deviceInfo.isMobile ? 'w-16 h-16' : 'w-24 h-24'
                }`}
              />
              <div>
                <div className={`font-light text-gray-900 mb-2 ${
                  deviceInfo.isKiosk ? 'text-6xl' : 
                  deviceInfo.isMobile ? 'text-3xl' : 'text-5xl'
                }`}>
                  {weatherData.current.temperature}°
                </div>
                <div className={`text-gray-600 capitalize ${
                  deviceInfo.isKiosk ? 'text-lg' : 
                  deviceInfo.isMobile ? 'text-sm' : 'text-base'
                }`}>
                  {weatherData.current.description}
                </div>
                <div className={`text-gray-500 ${
                  deviceInfo.isKiosk ? 'text-base' : 
                  deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                }`}>
                  Feels like {weatherData.current.feelsLike}°
                </div>
              </div>
            </div>

            {/* Weather Details */}
            <div className={`grid gap-4 ${
              deviceInfo.isKiosk ? 'grid-cols-4' : 
              deviceInfo.isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
            }`}>
              <div className={`group relative rounded-2xl ${
                deviceInfo.isKiosk ? 'p-6' : 
                deviceInfo.isMobile ? 'p-3' : 'p-4'
              }`}>
                <div className="relative h-full rounded-2xl border border-border/50 p-2">
                  <GlowingEffect
                    spread={30}
                    glow={true}
                    disabled={false}
                    proximity={80}
                    inactiveZone={0.3}
                    borderWidth={2}
                    movementDuration={1.5}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border border-border/30 bg-card/20 p-4 shadow-sm backdrop-blur-sm group-hover:bg-card/40 transition-all duration-300">
                    <div className="w-fit rounded-lg border border-border/50 bg-muted/50 p-3 group-hover:scale-110 transition-transform duration-300">
                      <div className={`${
                        deviceInfo.isKiosk ? 'text-3xl' : 
                        deviceInfo.isMobile ? 'text-xl' : 'text-2xl'
                      }`}>💧</div>
                    </div>
                    <div className="space-y-2">
                      <h3 className={`font-semibold text-card-foreground ${
                        deviceInfo.isKiosk ? 'text-lg' : 
                        deviceInfo.isMobile ? 'text-sm' : 'text-base'
                      }`}>Humidity</h3>
                      <p className={`text-muted-foreground leading-relaxed ${
                        deviceInfo.isKiosk ? 'text-base' : 
                        deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                      }`}>{weatherData.current.humidity}%</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`group relative rounded-2xl ${
                deviceInfo.isKiosk ? 'p-6' : 
                deviceInfo.isMobile ? 'p-3' : 'p-4'
              }`}>
                <div className="relative h-full rounded-2xl border border-border/50 p-2">
                  <GlowingEffect
                    spread={30}
                    glow={true}
                    disabled={false}
                    proximity={80}
                    inactiveZone={0.3}
                    borderWidth={2}
                    movementDuration={1.5}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border border-border/30 bg-card/20 p-4 shadow-sm backdrop-blur-sm group-hover:bg-card/40 transition-all duration-300">
                    <div className="w-fit rounded-lg border border-border/50 bg-muted/50 p-3 group-hover:scale-110 transition-transform duration-300">
                      <div className={`${
                        deviceInfo.isKiosk ? 'text-3xl' : 
                        deviceInfo.isMobile ? 'text-xl' : 'text-2xl'
                      }`}>🌬️</div>
                    </div>
                    <div className="space-y-2">
                      <h3 className={`font-semibold text-card-foreground ${
                        deviceInfo.isKiosk ? 'text-lg' : 
                        deviceInfo.isMobile ? 'text-sm' : 'text-base'
                      }`}>Wind</h3>
                      <p className={`text-muted-foreground leading-relaxed ${
                        deviceInfo.isKiosk ? 'text-base' : 
                        deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                      }`}>{weatherData.current.windSpeed} m/s</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`group relative rounded-2xl ${
                deviceInfo.isKiosk ? 'p-6' : 
                deviceInfo.isMobile ? 'p-3' : 'p-4'
              }`}>
                <div className="relative h-full rounded-2xl border border-border/50 p-2">
                  <GlowingEffect
                    spread={30}
                    glow={true}
                    disabled={false}
                    proximity={80}
                    inactiveZone={0.3}
                    borderWidth={2}
                    movementDuration={1.5}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border border-border/30 bg-card/20 p-4 shadow-sm backdrop-blur-sm group-hover:bg-card/40 transition-all duration-300">
                    <div className="w-fit rounded-lg border border-border/50 bg-muted/50 p-3 group-hover:scale-110 transition-transform duration-300">
                      <div className={`${
                        deviceInfo.isKiosk ? 'text-3xl' : 
                        deviceInfo.isMobile ? 'text-xl' : 'text-2xl'
                      }`}>🔍</div>
                    </div>
                    <div className="space-y-2">
                      <h3 className={`font-semibold text-card-foreground ${
                        deviceInfo.isKiosk ? 'text-lg' : 
                        deviceInfo.isMobile ? 'text-sm' : 'text-base'
                      }`}>Visibility</h3>
                      <p className={`text-muted-foreground leading-relaxed ${
                        deviceInfo.isKiosk ? 'text-base' : 
                        deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                      }`}>{weatherData.current.visibility} km</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`group relative rounded-2xl ${
                deviceInfo.isKiosk ? 'p-6' : 
                deviceInfo.isMobile ? 'p-3' : 'p-4'
              }`}>
                <div className="relative h-full rounded-2xl border border-border/50 p-2">
                  <GlowingEffect
                    spread={30}
                    glow={true}
                    disabled={false}
                    proximity={80}
                    inactiveZone={0.3}
                    borderWidth={2}
                    movementDuration={1.5}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border border-border/30 bg-card/20 p-4 shadow-sm backdrop-blur-sm group-hover:bg-card/40 transition-all duration-300">
                    <div className="w-fit rounded-lg border border-border/50 bg-muted/50 p-3 group-hover:scale-110 transition-transform duration-300">
                      <div className={`${
                        deviceInfo.isKiosk ? 'text-3xl' : 
                        deviceInfo.isMobile ? 'text-xl' : 'text-2xl'
                      }`}>📊</div>
                    </div>
                    <div className="space-y-2">
                      <h3 className={`font-semibold text-card-foreground ${
                        deviceInfo.isKiosk ? 'text-lg' : 
                        deviceInfo.isMobile ? 'text-sm' : 'text-base'
                      }`}>Pressure</h3>
                      <p className={`text-muted-foreground leading-relaxed ${
                        deviceInfo.isKiosk ? 'text-base' : 
                        deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                      }`}>{weatherData.current.pressure} hPa</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className={`bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg ${
          deviceInfo.isKiosk ? 'p-8' : 
          deviceInfo.isMobile ? 'p-4' : 'p-6'
        }`}>
          <h3 className={`font-medium text-gray-900 mb-6 text-center ${
            deviceInfo.isKiosk ? 'text-2xl' : 
            deviceInfo.isMobile ? 'text-lg' : 'text-xl'
          }`}>
            5-Day Forecast
          </h3>
          
          <div className={`grid gap-4 ${
            deviceInfo.isKiosk ? 'grid-cols-5' : 
            deviceInfo.isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-5'
          }`}>
            {weatherData.forecast.slice(0, 5).map((day, index) => (
              <div key={index} className={`group relative rounded-2xl ${
                deviceInfo.isKiosk ? 'p-6' : 
                deviceInfo.isMobile ? 'p-3' : 'p-4'
              }`}>
                <div className="relative h-full rounded-2xl border border-border/50 p-2">
                  <GlowingEffect
                    spread={25}
                    glow={true}
                    disabled={false}
                    proximity={60}
                    inactiveZone={0.4}
                    borderWidth={2}
                    movementDuration={1.2}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border border-border/30 bg-card/20 p-4 shadow-sm backdrop-blur-sm group-hover:bg-card/40 transition-all duration-300">
                    <div className="text-center">
                      <div className={`font-medium text-card-foreground mb-2 ${
                        deviceInfo.isKiosk ? 'text-lg' : 
                        deviceInfo.isMobile ? 'text-sm' : 'text-base'
                      }`}>
                        {formatDate(day.date)}
                      </div>
                      
                      <img
                        src={weatherService.getWeatherIconUrl(day.icon, '2x')}
                        alt={day.description}
                        className={`mx-auto mb-2 ${
                          deviceInfo.isKiosk ? 'w-20 h-20' : 
                          deviceInfo.isMobile ? 'w-12 h-12' : 'w-16 h-16'
                        }`}
                      />
                      
                      <div className={`text-muted-foreground capitalize mb-2 ${
                        deviceInfo.isKiosk ? 'text-base' : 
                        deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        {day.description}
                      </div>
                      
                      <div className={`font-semibold text-card-foreground mb-2 ${
                        deviceInfo.isKiosk ? 'text-lg' : 
                        deviceInfo.isMobile ? 'text-sm' : 'text-base'
                      }`}>
                        {day.temperature.max}° / {day.temperature.min}°
                      </div>
                    </div>
                    
                    <div className={`space-y-1 text-muted-foreground ${
                      deviceInfo.isKiosk ? 'text-sm' : 
                      deviceInfo.isMobile ? 'text-xs' : 'text-xs'
                    }`}>
                      <div>💧 {day.humidity}%</div>
                      <div>🌬️ {day.windSpeed} m/s</div>
                      <div>🌧️ {day.precipitation}%</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;