import React, { useEffect, useState } from 'react';
import WeatherCard from '../components/WeatherCard';
import { weatherAPI } from '../services/weatherAPI';

const WeatherPage = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (lat, lng) => {
      try {
        setLoading(true);
        const [resWeather, resForecast] = await Promise.all([
          weatherAPI.getCurrentWeather(lat, lng),
          weatherAPI.getForecast(lat, lng)
        ]);
        
        setWeather(resWeather.data);
        setForecast(resForecast.data.forecast || resForecast.data);
        setError(null);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Failed to fetch weather data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const getLocationAndFetch = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            fetchWeather(latitude, longitude);
          },
          (err) => {
            console.warn('Geolocation denied, using default location');
            setError('Geolocation permission denied. Using default location (Mumbai).');
            fetchWeather(19.0760, 72.8777); //Fallback coordinates
          },
          { timeout: 10000 }
        );
      } else {
        setError('Geolocation not supported. Using default location.');
        fetchWeather(19.0760, 72.8777);
      }
    };

    getLocationAndFetch();
  }, []);

  if (loading) {
    return (
      <div className="weather-page">
        <h2>Weather Information</h2>
        <div className="loading">Loading weather data...</div>
      </div>
    );
  }

  return (
    <div className="weather-page">
      <h2>Weather Information</h2>
      {error && <div className="error-message">{error}</div>}
      
      {weather && (
        <>
          <WeatherCard weather={weather} />
          
          {forecast && forecast.length > 0 && (
            <div className="forecast">
              <h3>5-Day Forecast</h3>
              <div className="forecast-cards">
                {forecast.map((day, index) => (
                  <div key={index} className="forecast-card">
                    <p>{new Date(day.date).toLocaleDateString()}</p>
                    <img
                      src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                      alt={day.description}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/50x50?text=Weather';
                      }}
                    />
                    <p className="capitalize">{day.description}</p>
                    <p>Min: {day.temperature?.min?.toFixed(1) || day.temperature?.toFixed(1)}°C</p>
                    <p>Max: {day.temperature?.max?.toFixed(1) || day.temperature?.toFixed(1)}°C</p>
                    <p>Rainfall: {day.rainfall?.toFixed(1) || 0} mm</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeatherPage;