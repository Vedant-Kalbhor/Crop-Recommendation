import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';
import { weatherAPI } from '../services/weatherAPI';
import { getBrowserLocation } from '../utils/helpers';
import { ERROR_MESSAGES } from '../utils/constants';

const RegionForm = () => {
  const [formData, setFormData] = useState({
    region: '',
    useCurrentLocation: false,
    coordinates: { lat: '', lng: '' }
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (formData.useCurrentLocation) {
      handleGetCurrentLocation();
    }
  }, [formData.useCurrentLocation]);

  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    setError('');
    
    try {
      const location = await getBrowserLocation();
      setFormData(prev => ({
        ...prev,
        coordinates: location
      }));
      
      // Fetch weather for current location
      const weatherResponse = await weatherAPI.getCurrentWeather(location.lat, location.lng);
      setWeather(weatherResponse.data);
      
    } catch (err) {
      setError(ERROR_MESSAGES.LOCATION_ERROR);
      setFormData(prev => ({
        ...prev,
        useCurrentLocation: false
      }));
    } finally {
      setLocationLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user types
    if (error) setError('');
  };

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.region && !formData.useCurrentLocation) {
      setError('Please enter a region or use your current location');
      return;
    }
    
    if (formData.useCurrentLocation && (!formData.coordinates.lat || !formData.coordinates.lng)) {
      setError('Unable to get your location. Please try again or enter a region manually.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const requestData = formData.useCurrentLocation 
        ? { lat: formData.coordinates.lat, lng: formData.coordinates.lng }
        : { region: formData.region };
      
      const response = await recommendationAPI.regionAnalysis(requestData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleManualWeatherFetch = async () => {
    if (!formData.region) {
      setError('Please enter a region first');
      return;
    }
    
    setLocationLoading(true);
    setError('');
    
    try {
      const response = await weatherAPI.getCurrentWeather(
        formData.coordinates.lat || null,
        formData.coordinates.lng || null,
        formData.region
      );
      setWeather(response.data);
    } catch (err) {
      setError(ERROR_MESSAGES.WEATHER_API_ERROR);
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <div className="region-form-container">
      <h2>Region-Based Crop Recommendation</h2>
      <p>Get crop suggestions based on your geographical region and current weather conditions.</p>
      
      <form onSubmit={handleSubmit} className="region-form">
        <div className="form-section">
          <h3>Location Information</h3>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="useCurrentLocation"
                checked={formData.useCurrentLocation}
                onChange={handleChange}
                disabled={locationLoading}
              />
              Use my current location
            </label>
          </div>
          
          {formData.useCurrentLocation ? (
            <div className="coordinates-display">
              <p>
                <strong>Detected Location:</strong>{' '}
                {formData.coordinates.lat && formData.coordinates.lng 
                  ? `${formData.coordinates.lat.toFixed(4)}, ${formData.coordinates.lng.toFixed(4)}`
                  : 'Getting location...'
                }
              </p>
              
              {locationLoading && (
                <div className="loading-spinner">Detecting location...</div>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="region">Region Name</label>
              <input
                type="text"
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                placeholder="Enter your region, city, or area"
                list="regions-list"
              />
              <datalist id="regions-list">
                <option value="North" />
                <option value="South" />
                <option value="East" />
                <option value="West" />
                <option value="Central" />
                <option value="Northeast" />
                <option value="Northwest" />
                <option value="Southeast" />
                <option value="Southwest" />
              </datalist>
            </div>
          )}
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lat">Latitude (optional)</label>
              <input
                type="number"
                id="lat"
                name="lat"
                value={formData.coordinates.lat}
                onChange={handleCoordinateChange}
                placeholder="e.g., 40.7128"
                step="any"
                min="-90"
                max="90"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lng">Longitude (optional)</label>
              <input
                type="number"
                id="lng"
                name="lng"
                value={formData.coordinates.lng}
                onChange={handleCoordinateChange}
                placeholder="e.g., -74.0060"
                step="any"
                min="-180"
                max="180"
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleManualWeatherFetch}
            disabled={locationLoading || (!formData.region && !formData.coordinates.lat)}
            className="secondary-button"
          >
            {locationLoading ? 'Fetching Weather...' : 'Check Current Weather'}
          </button>
        </div>
        
        {weather && (
          <div className="weather-preview">
            <h4>Current Weather Conditions</h4>
            <div className="weather-info">
              <p><strong>Temperature:</strong> {weather.temperature}°C</p>
              <p><strong>Humidity:</strong> {weather.humidity}%</p>
              <p><strong>Rainfall:</strong> {weather.rainfall}mm</p>
              <p><strong>Conditions:</strong> {weather.description}</p>
              {weather.location && (
                <p><strong>Location:</strong> {weather.location}, {weather.country}</p>
              )}
            </div>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        <button
          type="submit"
          disabled={loading || locationLoading}
          className="primary-button"
        >
          {loading ? 'Analyzing...' : 'Get Crop Recommendations'}
        </button>
      </form>
      
      {result && (
        <div className="result-section">
          <h3>Recommended Crops</h3>
          <p>Based on {result.region ? `region: ${result.region}` : 'your current location'}</p>
          
          {result.weatherData && (
            <div className="weather-summary">
              <h4>Weather Conditions Considered:</h4>
              <div className="weather-grid">
                <div className="weather-item">
                  <span className="label">Temperature:</span>
                  <span className="value">{result.weatherData.temperature}°C</span>
                </div>
                <div className="weather-item">
                  <span className="label">Humidity:</span>
                  <span className="value">{result.weatherData.humidity}%</span>
                </div>
                <div className="weather-item">
                  <span className="label">Rainfall:</span>
                  <span className="value">{result.weatherData.rainfall}mm</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="recommendations-grid">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <div className="crop-header">
                  <h4>{rec.crop}</h4>
                  <span className="confidence-badge">
                    {Math.round(rec.confidence * 100)}% match
                  </span>
                </div>
                <p className="reason">{rec.reason}</p>
                <div className="crop-details">
                  <span className="detail-item">Ideal for current conditions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionForm;