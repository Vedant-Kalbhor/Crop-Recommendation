import React from 'react';

const WeatherCard = ({ weather }) => {
  if (!weather) return null;

  return (
    <div className="weather-card">
      <div className="weather-header">
        <h3>Current Weather</h3>
        <img 
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
          alt={weather.description}
        />
      </div>
      <div className="weather-details">
        <div className="weather-item">
          <span className="label">Temperature:</span>
          <span className="value">{weather.temperature}°C</span>
        </div>
        <div className="weather-item">
          <span className="label">Humidity:</span>
          <span className="value">{weather.humidity}%</span>
        </div>
        <div className="weather-item">
          <span className="label">Rainfall:</span>
          <span className="value">{weather.rainfall} mm</span>
        </div>
        <div className="weather-item">
          <span className="label">Condition:</span>
          <span className="value capitalize">{weather.description}</span>
        </div>
        <div className="weather-item">
          <span className="label">Location:</span>
          <span className="value">{weather.location}, {weather.country}</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;