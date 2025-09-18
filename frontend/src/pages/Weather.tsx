import React, { useState, useEffect } from 'react';
import { weatherService } from '../api/weather';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
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
          setError('Unable to get your location. Please search for a city instead.');
          setLoading(false);
        },
        {
          timeout: 10000, // 10 second timeout
          enableHighAccuracy: false, // Use less accurate but faster location
        }
      );
    } else {
      setError('Geolocation is not supported by this browser. Please search for a city instead.');
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
      
      // Get forecast for the same coordinates
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
      setCitySearch(''); // Clear search input on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'City not found. Please try a different city name.';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading weather data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <div className="text-gray-600 text-sm mb-6">
            Try searching for a city like "London", "New York", or "Tokyo"
          </div>
          <form onSubmit={handleCitySearch} className="space-y-4">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Enter city name (e.g., London, New York)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">No weather data available</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 p-4 ${deviceInfo.isKiosk ? 'text-2xl' : ''}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className={`font-bold text-white mb-4 ${
            deviceInfo.isKiosk 
              ? 'text-5xl sm:text-6xl' 
              : deviceInfo.isMobile
              ? 'text-xl sm:text-2xl'
              : 'text-2xl sm:text-3xl lg:text-4xl'
          }`}>
            Weather Forecast
          </h1>
          <form onSubmit={handleCitySearch} className={`flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md mx-auto ${
            deviceInfo.isKiosk ? 'max-w-2xl' : 'max-w-md'
          }`}>
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search for a city..."
              className={`flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-white ${
                deviceInfo.isKiosk ? 'px-6 py-4 text-xl' : 
                deviceInfo.isMobile ? 'px-3 py-2 text-sm' : 'px-3 sm:px-4 py-2 text-sm sm:text-base'
              }`}
            />
            <button
              type="submit"
              className={`bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors ${
                deviceInfo.isKiosk ? 'px-8 py-4 text-xl' : 
                deviceInfo.isMobile ? 'px-3 py-2 text-sm' : 'px-4 sm:px-6 py-2 text-sm sm:text-base'
              }`}
            >
              Search
            </button>
          </form>
        </div>

        {/* Current Weather */}
        <div className={`bg-white rounded-2xl shadow-2xl mb-6 sm:mb-8 ${
          deviceInfo.isKiosk ? 'p-8 sm:p-12' : 
          deviceInfo.isMobile ? 'p-4 sm:p-6' : 'p-6 sm:p-8'
        }`}>
          <div className="text-center">
            <h2 className={`font-bold text-gray-800 mb-2 ${
              deviceInfo.isKiosk ? 'text-3xl sm:text-4xl' : 
              deviceInfo.isMobile ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
            }`}>
              {weatherData.current.city}, {weatherData.current.country}
            </h2>
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6 ${
              deviceInfo.isKiosk ? 'gap-8' : 'gap-4 sm:gap-6'
            }`}>
              <img
                src={weatherService.getWeatherIconUrl(weatherData.current.icon, '4x')}
                alt={weatherData.current.description}
                className={`${
                  deviceInfo.isKiosk ? 'w-32 h-32 sm:w-40 sm:h-40' : 
                  deviceInfo.isMobile ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-20 h-20 sm:w-24 sm:h-24'
                }`}
              />
              <div>
                <div className={`font-bold text-gray-800 ${
                  deviceInfo.isKiosk ? 'text-8xl sm:text-9xl' : 
                  deviceInfo.isMobile ? 'text-3xl sm:text-4xl' : 'text-5xl sm:text-6xl'
                }`}>
                  {weatherData.current.temperature}°
                </div>
                <div className={`text-gray-600 capitalize ${
                  deviceInfo.isKiosk ? 'text-2xl sm:text-3xl' : 
                  deviceInfo.isMobile ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'
                }`}>
                  {weatherData.current.description}
                </div>
                <div className={`text-gray-500 ${
                  deviceInfo.isKiosk ? 'text-xl sm:text-2xl' : 
                  deviceInfo.isMobile ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'
                }`}>
                  Feels like {weatherData.current.feelsLike}°
                </div>
              </div>
            </div>

            {/* Weather Details */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 ${
              deviceInfo.isKiosk ? 'gap-6' : 'gap-3 sm:gap-4'
            }`}>
              <div className={`bg-gray-50 rounded-lg text-center ${
                deviceInfo.isKiosk ? 'p-6 sm:p-8' : 
                deviceInfo.isMobile ? 'p-2 sm:p-3' : 'p-3 sm:p-4'
              }`}>
                <div className={`mb-1 ${
                  deviceInfo.isKiosk ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                }`}>💧</div>
                <div className={`text-gray-600 ${
                  deviceInfo.isKiosk ? 'text-lg sm:text-xl' : 'text-xs sm:text-sm'
                }`}>Humidity</div>
                <div className={`font-semibold ${
                  deviceInfo.isKiosk ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'
                }`}>{weatherData.current.humidity}%</div>
              </div>
              <div className={`bg-gray-50 rounded-lg text-center ${
                deviceInfo.isKiosk ? 'p-6 sm:p-8' : 
                deviceInfo.isMobile ? 'p-2 sm:p-3' : 'p-3 sm:p-4'
              }`}>
                <div className={`mb-1 ${
                  deviceInfo.isKiosk ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                }`}>🌬️</div>
                <div className={`text-gray-600 ${
                  deviceInfo.isKiosk ? 'text-lg sm:text-xl' : 'text-xs sm:text-sm'
                }`}>Wind Speed</div>
                <div className={`font-semibold ${
                  deviceInfo.isKiosk ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'
                }`}>{weatherData.current.windSpeed} m/s</div>
              </div>
              <div className={`bg-gray-50 rounded-lg text-center ${
                deviceInfo.isKiosk ? 'p-6 sm:p-8' : 
                deviceInfo.isMobile ? 'p-2 sm:p-3' : 'p-3 sm:p-4'
              }`}>
                <div className={`mb-1 ${
                  deviceInfo.isKiosk ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                }`}>🔍</div>
                <div className={`text-gray-600 ${
                  deviceInfo.isKiosk ? 'text-lg sm:text-xl' : 'text-xs sm:text-sm'
                }`}>Visibility</div>
                <div className={`font-semibold ${
                  deviceInfo.isKiosk ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'
                }`}>{weatherData.current.visibility} km</div>
              </div>
              <div className={`bg-gray-50 rounded-lg text-center ${
                deviceInfo.isKiosk ? 'p-6 sm:p-8' : 
                deviceInfo.isMobile ? 'p-2 sm:p-3' : 'p-3 sm:p-4'
              }`}>
                <div className={`mb-1 ${
                  deviceInfo.isKiosk ? 'text-4xl sm:text-5xl' : 
                  deviceInfo.isMobile ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
                }`}>📊</div>
                <div className={`text-gray-600 ${
                  deviceInfo.isKiosk ? 'text-lg sm:text-xl' : 
                  deviceInfo.isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                }`}>Pressure</div>
                <div className={`font-semibold ${
                  deviceInfo.isKiosk ? 'text-2xl sm:text-3xl' : 
                  deviceInfo.isMobile ? 'text-sm' : 'text-base sm:text-lg'
                }`}>{weatherData.current.pressure} hPa</div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className={`bg-white rounded-2xl shadow-2xl ${
          deviceInfo.isKiosk ? 'p-8 sm:p-12' : 
          deviceInfo.isMobile ? 'p-4 sm:p-6' : 'p-6 sm:p-8'
        }`}>
          <h3 className={`font-bold text-gray-800 mb-4 sm:mb-6 text-center ${
            deviceInfo.isKiosk ? 'text-3xl sm:text-4xl' : 
            deviceInfo.isMobile ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
          }`}>
            5-Day Forecast
          </h3>
          <div className={`grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 ${
            deviceInfo.isKiosk ? 'gap-6' : 'gap-3 sm:gap-4'
          }`}>
            {weatherData.forecast.slice(0, 5).map((day, index) => (
              <div key={index} className={`bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors ${
                deviceInfo.isKiosk ? 'p-6 sm:p-8' : 
                deviceInfo.isMobile ? 'p-2 sm:p-3' : 'p-3 sm:p-4'
              }`}>
                <div className={`font-semibold text-gray-800 mb-2 ${
                  deviceInfo.isKiosk ? 'text-xl sm:text-2xl' : 
                  deviceInfo.isMobile ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
                }`}>
                  {formatDate(day.date)}
                </div>
                <img
                  src={weatherService.getWeatherIconUrl(day.icon, '2x')}
                  alt={day.description}
                  className={`mx-auto mb-2 ${
                    deviceInfo.isKiosk ? 'w-20 h-20 sm:w-24 sm:h-24' : 
                    deviceInfo.isMobile ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-12 h-12 sm:w-16 sm:h-16'
                  }`}
                />
                <div className={`text-gray-600 capitalize mb-2 ${
                  deviceInfo.isKiosk ? 'text-lg sm:text-xl' : 
                  deviceInfo.isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                }`}>
                  {day.description}
                </div>
                <div className={`font-bold text-gray-800 mb-1 ${
                  deviceInfo.isKiosk ? 'text-2xl sm:text-3xl' : 
                  deviceInfo.isMobile ? 'text-sm' : 'text-base sm:text-lg'
                }`}>
                  {day.temperature.max}° / {day.temperature.min}°
                </div>
                <div className={`text-gray-500 space-y-1 ${
                  deviceInfo.isKiosk ? 'text-base sm:text-lg' : 
                  deviceInfo.isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                }`}>
                  <div>💧 {day.humidity}%</div>
                  <div>🌬️ {day.windSpeed} m/s</div>
                  <div>🌧️ {day.precipitation}%</div>
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
