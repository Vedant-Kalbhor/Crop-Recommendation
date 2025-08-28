import React, { useState } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';

const SoilParamsForm = () => {
  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: ''
  });
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]); // Local state
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecommendations([]); // Clear previous recommendations
    
    try {
      const response = await recommendationAPI.soilParams(formData);
      setRecommendations(response.data.recommendations || []); // Ensure it's an array
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="soil-params-form">
      <h3>Soil Parameters Analysis</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="N">Nitrogen (N)</label>
            <input
              type="number"
              id="N"
              name="N"
              value={formData.N}
              onChange={handleChange}
              required
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="P">Phosphorus (P)</label>
            <input
              type="number"
              id="P"
              name="P"
              value={formData.P}
              onChange={handleChange}
              required
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="K">Potassium (K)</label>
            <input
              type="number"
              id="K"
              name="K"
              value={formData.K}
              onChange={handleChange}
              required
              step="0.1"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="temperature">Temperature (°C)</label>
            <input
              type="number"
              id="temperature"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              required
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="humidity">Humidity (%)</label>
            <input
              type="number"
              id="humidity"
              name="humidity"
              value={formData.humidity}
              onChange={handleChange}
              required
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ph">pH Level</label>
            <input
              type="number"
              id="ph"
              name="ph"
              value={formData.ph}
              onChange={handleChange}
              required
              step="0.1"
              min="0"
              max="14"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rainfall">Rainfall (mm)</label>
            <input
              type="number"
              id="rainfall"
              name="rainfall"
              value={formData.rainfall}
              onChange={handleChange}
              required
              step="0.1"
            />
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Get Recommendations'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {/* FIX: Add null check before mapping */}
      {recommendations && recommendations.length > 0 && (
        <div className="recommendations">
          <h4>Recommended Crops:</h4>
          <div className="crops-list">
            {recommendations.map((rec, index) => (
              <div key={index} className="crop-card">
                <h5>{rec.crop}</h5>
                <p>Confidence: {(rec.confidence * 100).toFixed(1)}%</p>
                <p>{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show empty state if no recommendations yet */}
      {!loading && !error && recommendations.length === 0 && (
        <div className="no-recommendations">
          <p>Enter soil parameters above to get crop recommendations.</p>
        </div>
      )}
    </div>
  );
};

export default SoilParamsForm;