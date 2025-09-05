import React, { useState, useEffect } from 'react';
import { weatherService } from '../api/weather';
import type { WeatherData } from '../types/weather';

const Weather: React.FC = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Weather Forecast</h1>
          <form onSubmit={handleCitySearch} className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search for a city..."
              className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Current Weather */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {weatherData.current.city}, {weatherData.current.country}
            </h2>
            <div className="flex items-center justify-center gap-4 mb-6">
              <img
                src={weatherService.getWeatherIconUrl(weatherData.current.icon, '4x')}
                alt={weatherData.current.description}
                className="w-24 h-24"
              />
              <div>
                <div className="text-6xl font-bold text-gray-800">
                  {weatherData.current.temperature}°
                </div>
                <div className="text-xl text-gray-600 capitalize">
                  {weatherData.current.description}
                </div>
                <div className="text-lg text-gray-500">
                  Feels like {weatherData.current.feelsLike}°
                </div>
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-1">💧</div>
                <div className="text-sm text-gray-600">Humidity</div>
                <div className="text-lg font-semibold">{weatherData.current.humidity}%</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-1">🌬️</div>
                <div className="text-sm text-gray-600">Wind Speed</div>
                <div className="text-lg font-semibold">{weatherData.current.windSpeed} m/s</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-1">🔍</div>
                <div className="text-sm text-gray-600">Visibility</div>
                <div className="text-lg font-semibold">{weatherData.current.visibility} km</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-1">📊</div>
                <div className="text-sm text-gray-600">Pressure</div>
                <div className="text-lg font-semibold">{weatherData.current.pressure} hPa</div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">5-Day Forecast</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weatherData.forecast.slice(0, 5).map((day, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors">
                <div className="text-lg font-semibold text-gray-800 mb-2">
                  {formatDate(day.date)}
                </div>
                <img
                  src={weatherService.getWeatherIconUrl(day.icon, '2x')}
                  alt={day.description}
                  className="w-16 h-16 mx-auto mb-2"
                />
                <div className="text-sm text-gray-600 capitalize mb-2">
                  {day.description}
                </div>
                <div className="text-lg font-bold text-gray-800 mb-1">
                  {day.temperature.max}° / {day.temperature.min}°
                </div>
                <div className="text-xs text-gray-500 space-y-1">
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
