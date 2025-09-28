import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';
import { weatherAPI } from '../services/weatherAPI';
import WeatherCard from '../components/WeatherCard';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failure: 0,
    pending: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [historyResponse, weatherResponse] = await Promise.all([
        recommendationAPI.getHistory(),
        weatherAPI.getCurrentWeather().catch(err => {
          console.warn('Weather service unavailable:', err);
          return { data: null };
        })
      ]);
      
      console.log('History response:', historyResponse);
      
      // Handle both array response and object with data property
      const historyData = Array.isArray(historyResponse.data) 
        ? historyResponse.data 
        : historyResponse.data?.data || historyResponse.data?.recommendations || [];
      
      setHistory(historyData);
      setWeather(weatherResponse.data);

      // Calculate stats
      const total = historyData.length;
      const success = historyData.filter(r => r.successStatus === 'success').length;
      const failure = historyData.filter(r => r.successStatus === 'failure').length;
      const pending = historyData.filter(r => r.successStatus === 'pending').length;
      
      setStats({ total, success, failure, pending });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={refreshData} className="refresh-btn">
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="stats-section">
          <h2>Recommendation Statistics</h2>
          <div className="stats-cards">
            <div className="stat-card total">
              <h3>{stats.total}</h3>
              <p>Total Recommendations</p>
            </div>
            <div className="stat-card success">
              <h3>{stats.success}</h3>
              <p>Successful</p>
            </div>
            <div className="stat-card failure">
              <h3>{stats.failure}</h3>
              <p>Failed</p>
            </div>
            <div className="stat-card pending">
              <h3>{stats.pending}</h3>
              <p>Pending Feedback</p>
            </div>
          </div>
        </div>
        
        {weather && (
          <div className="weather-section">
            <h2>Current Weather</h2>
            <WeatherCard weather={weather} />
          </div>
        )}
      </div>
      
      <div className="history-section">
        <div className="section-header">
          <h2>Recent Recommendations</h2>
          <span className="count-badge">{history.length} total</span>
        </div>
        
        {history.length === 0 ? (
          <div className="empty-state">
            <p>No recommendations yet. Get started by analyzing your soil!</p>
            <div className="action-links">
              <a href="/soil-analysis">Soil Analysis</a>
              <a href="/image-analysis">Image Analysis</a>
              <a href="/region-analysis">Region Analysis</a>
            </div>
          </div>
        ) : (
          <div className="history-list">
            {history.map(item => (
              <div key={item._id} className="history-item">
                <div className="history-item-header">
                  <h4>{new Date(item.createdAt || item.createAt).toLocaleDateString()}</h4>
                  <span className={`status-badge ${item.successStatus}`}>
                    {item.successStatus}
                  </span>
                </div>
                <div className="history-item-details">
                  <p><strong>Method:</strong> {item.method}</p>
                  {item.inputData && (
                    <div className="input-summary">
                      {item.method === 'soil_params' && (
                        <span>N: {item.inputData.N}, P: {item.inputData.P}, K: {item.inputData.K}</span>
                      )}
                      {item.method === 'soil_image' && (
                        <span>Soil Type: {item.inputData.soil_type}</span>
                      )}
                      {item.method === 'region' && (
                        <span>Region: {item.inputData.region}{item.inputData.district ? `, ${item.inputData.district}` : ''}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="recommended-crops">
                  {item.recommendations && item.recommendations.length > 0 ? (
                    item.recommendations.slice(0, 3).map((rec, idx) => (
                      <span key={idx} className="crop-tag">
                        {rec.crop || rec}
                        {rec.confidence && ` (${Math.round(rec.confidence * 100)}%)`}
                      </span>
                    ))
                  ) : (
                    <em>No crop recommendations</em>
                  )}
                </div>
                {item.successStatus === 'pending' && (
                  <div className="feedback-reminder">
                    <small>
                      <a href="/feedback">Provide feedback</a> for this recommendation
                    </small>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;