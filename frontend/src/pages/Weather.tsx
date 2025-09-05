import React, { useState } from 'react';
import { weather } from '../api/index';

const Weather: React.FC = () => {
  const [weatherData, setWeatherData] = useState<any>(null);

  const fetchWeather = async () => {
    try {
      const data = await weather();
      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  return (
    <div className="weather-page">
      <h1>Weather Information</h1>
      <button onClick={fetchWeather} className="btn-primary">
        Fetch Weather
      </button>
      {weatherData && (
        <div className="weather-data">
          <pre>{JSON.stringify(weatherData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Weather;