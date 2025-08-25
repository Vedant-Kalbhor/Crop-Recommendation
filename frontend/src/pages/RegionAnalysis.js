import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';
import { weatherAPI } from '../services/weatherAPI';

const RegionAnalysis = () => {
  const [location, setLocation] = useState({
    region: '',
    lat: '',
    lng: ''
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (useCurrentLocation) {
      getCurrentLocation();
    }
  }, [useCurrentLocation]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude
        }));
        
        try {
          // Get weather data for current location
          const weatherResponse = await weatherAPI.getCurrentWeather(latitude, longitude);
          setWeather(weatherResponse.data);
          
          // Try to get region name from weather data
          if (weatherResponse.data.location) {
            setLocation(prev => ({
              ...prev,
              region: weatherResponse.data.location
            }));
          }
        } catch (err) {
          console.error('Error fetching weather data:', err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setError('Unable to retrieve your location');
        setLoading(false);
      }
    );
  };

  const handleChange = (e) => {
    setLocation({
      ...location,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location.region && !(location.lat && location.lng)) {
      setError('Please enter a region or use your current location');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await recommendationAPI.regionAnalysis(location);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Region-Based Analysis</h1>
      <p>Get crop recommendations based on your region and current weather conditions.</p>
      
      <div className="region-analysis-container">
        <div className="input-section">
          <form onSubmit={handleSubmit}>
            <div className="location-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useCurrentLocation}
                  onChange={(e) => setUseCurrentLocation(e.target.checked)}
                />
                Use my current location
              </label>
            </div>
            
            {!useCurrentLocation && (
              <div className="form-group">
                <label htmlFor="region">Region Name</label>
                <input
                  type="text"
                  id="region"
                  name="region"
                  value={location.region}
                  onChange={handleChange}
                  placeholder="Enter your region or city"
                />
              </div>
            )}
            
            {(useCurrentLocation && location.lat && location.lng) && (
              <div className="coordinates">
                <p>Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                {weather && (
                  <div className="weather-preview">
                    <p>Current weather: {weather.temperature}°C, {weather.description}</p>
                  </div>
                )}
              </div>
            )}
            
            <button type="submit" disabled={loading}>
              {loading ? 'Analyzing...' : 'Get Recommendations'}
            </button>
          </form>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        {result && (
          <div className="result-section">
            <h3>Region-Based Recommendations</h3>
            
            {result.weatherData && (
              <div className="weather-info">
                <h4>Weather Conditions:</h4>
                <p>Temperature: {result.weatherData.temperature}°C</p>
                <p>Humidity: {result.weatherData.humidity}%</p>
                <p>Rainfall: {result.weatherData.rainfall}mm</p>
              </div>
            )}
            
            <div className="recommendations">
              <h4>Recommended Crops for {result.region}:</h4>
              <div className="recommendations-grid">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <h5>{rec.crop}</h5>
                    <p>Confidence: {(rec.confidence * 100).toFixed(1)}%</p>
                    <p>{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionAnalysis;