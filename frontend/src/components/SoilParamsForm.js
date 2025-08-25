import React, { useState } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';

const SoilParamsForm = () => {
  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    temperature: '',
    humidity: '',
    rainfall: '',
    ph: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
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
    
    try {
      const response = await recommendationAPI.soilParams(formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Soil Parameters Analysis</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="N">Nitrogen (N)</label>
            <input
              type="number"
              id="N"
              name="N"
              value={formData.N}
              onChange={handleChange}
              min="0"
              max="140"
              step="0.1"
              required
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
              min="0"
              max="145"
              step="0.1"
              required
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
              min="0"
              max="205"
              step="0.1"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="temperature">Temperature (°C)</label>
            <input
              type="number"
              id="temperature"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              min="0"
              max="50"
              step="0.1"
              required
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
              min="0"
              max="100"
              step="0.1"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="rainfall">Rainfall (mm)</label>
            <input
              type="number"
              id="rainfall"
              name="rainfall"
              value={formData.rainfall}
              onChange={handleChange}
              min="0"
              max="300"
              step="0.1"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="ph">pH Value</label>
            <input
              type="number"
              id="ph"
              name="ph"
              value={formData.ph}
              onChange={handleChange}
              min="0"
              max="14"
              step="0.1"
              required
            />
          </div>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Get Recommendation'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {result && (
        <div className="result-container">
          <h3>Recommendation Results</h3>
          <div className="recommendations-grid">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <h4>{rec.crop}</h4>
                <p>Confidence: {(rec.confidence * 100).toFixed(1)}%</p>
                <p>{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SoilParamsForm;