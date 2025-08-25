import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';
import { weatherAPI } from '../services/weatherAPI';
import CropCard from '../components/CropCard';
import WeatherCard from '../components/WeatherCard';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
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
      const [historyResponse, weatherResponse] = await Promise.all([
        recommendationAPI.getHistory(),
        weatherAPI.getCurrentWeather()
      ]);
      
      setHistory(historyResponse.data);
      setWeather(weatherResponse.data);
      
      // Calculate stats
      const total = historyResponse.data.length;
      const success = historyResponse.data.filter(r => r.successStatus === 'success').length;
      const failure = historyResponse.data.filter(r => r.successStatus === 'failure').length;
      const pending = historyResponse.data.filter(r => r.successStatus === 'pending').length;
      
      setStats({ total, success, failure, pending });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
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
        <h2>Recent Recommendations</h2>
        {history.length === 0 ? (
          <p>No recommendations yet. Get started by analyzing your soil!</p>
        ) : (
          <div className="history-list">
            {history.map(item => (
              <div key={item._id} className="history-item">
                <h4>{new Date(item.createdAt).toLocaleDateString()}</h4>
                <p>Method: {item.method}</p>
                <p>Status: {item.successStatus}</p>
                <div className="recommended-crops">
                  {item.recommendations.slice(0, 3).map((rec, idx) => (
                    <span key={idx} className="crop-tag">{rec.crop}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;