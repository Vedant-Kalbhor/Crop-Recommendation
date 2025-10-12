import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';
import '../styles/Dashboard.css';

const Feedback = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recommendationAPI.getHistory();
      
      console.log('Feedback page - history response:', response);
      
      const allRecommendations = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || response.data?.recommendations || [];
      
      const pendingRecommendations = allRecommendations.filter(
        item => item.successStatus === 'pending'
      );
      
      setPending(pendingRecommendations);
    } catch (error) {
      console.error('Error fetching pending feedbacks:', error);
      setError('Failed to load pending feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (id, isUseful) => {
    try {
      setUpdatingId(id);
      setError(null);
      setSuccessMessage(null);

      const feedbackData = {
        successStatus: isUseful ? 'success' : 'failure',
        feedback: isUseful ? 'User found this recommendation useful' : 'User did not find this recommendation useful'
      };

      console.log('Submitting feedback for:', id, feedbackData);

      await recommendationAPI.updateFeedback(id, feedbackData);
      
      setSuccessMessage(`Feedback submitted successfully!`);
      
      setPending(prev => prev.filter(item => item._id !== id));
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="dashboard enhanced-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading pending feedbacks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard enhanced-page">
      <div className="dashboard-header animate-slide-down">
        <div className="header-content">
          <div className="header-icon">💬</div>
          <div>
            <h1 className="gradient-text">Pending Feedbacks</h1>
            <p className="subtitle">Help us improve by providing your feedback</p>
          </div>
        </div>
        <button onClick={fetchPending} className="refresh-btn btn-modern">
          <span className="btn-icon">🔄</span>
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message modern-alert animate-shake">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message modern-alert animate-fade-in">
          <span className="alert-icon">✅</span>
          {successMessage}
        </div>
      )}

      {pending.length === 0 ? (
        <div className="empty-state modern-empty card-modern animate-fade-in">
          <div className="empty-icon">🎉</div>
          <h3>No pending feedbacks!</h3>
          <p>All your recommendations have been reviewed.</p>
          <p>New recommendations will appear here for your feedback.</p>
        </div>
      ) : (
        <div className="feedback-list">
          {pending.map((item, index) => (
            <div key={item._id} className="feedback-item modern-card card-hover animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="feedback-header">
                <div className="header-left">
                  <span className="method-icon">
                    {item.method === 'soil_params' && '🔬'}
                    {item.method === 'soil_image' && '📸'}
                    {item.method === 'region' && '🗺️'}
                  </span>
                  <h3>
                    {item.method === 'soil_params' && 'Soil Parameters Analysis'}
                    {item.method === 'soil_image' && 'Soil Image Analysis'}
                    {item.method === 'region' && 'Region Analysis'}
                  </h3>
                </div>
                <span className="date">
                  <span className="date-icon">📅</span>
                  {new Date(item.createdAt || item.createAt).toLocaleDateString()}
                </span>
              </div>

              <div className="feedback-details">
                {item.method === 'soil_params' && item.inputData && (
                  <div className="input-details">
                    <p className="detail-label">
                      <span className="label-icon">📊</span>
                      <strong>Soil Parameters:</strong>
                    </p>
                    <div className="params-grid">
                      <span className="param-chip">N: {item.inputData.N}</span>
                      <span className="param-chip">P: {item.inputData.P}</span>
                      <span className="param-chip">K: {item.inputData.K}</span>
                      <span className="param-chip">pH: {item.inputData.ph}</span>
                      <span className="param-chip">🌡️ {item.inputData.temperature}°C</span>
                      <span className="param-chip">💧 {item.inputData.humidity}%</span>
                    </div>
                  </div>
                )}

                {item.method === 'soil_image' && item.inputData && (
                  <div className="input-details">
                    <p className="detail-label">
                      <span className="label-icon">🏞️</span>
                      <strong>Detected Soil Type:</strong> 
                      <span className="soil-type-value">{item.inputData.soil_type || 'Unknown'}</span>
                    </p>
                  </div>
                )}

                {item.method === 'region' && item.inputData && (
                  <div className="input-details">
                    <p className="detail-label">
                      <span className="label-icon">📍</span>
                      <strong>Location:</strong> 
                      <span className="location-value">{item.inputData.region}{item.inputData.district ? `, ${item.inputData.district}` : ''}</span>
                    </p>
                  </div>
                )}

                {/* <div className="recommendations">
                  <p className="detail-label">
                    <span className="label-icon">🌾</span>
                    <strong>Recommended Crops:</strong>
                  </p>
                  <div className="crops-list">
                    {item.recommendations && item.recommendations.length > 0 ? (
                      item.recommendations.map((rec, idx) => (
                        <div key={idx} className="crop-recommendation">
                          <span className="crop-name">{rec.crop || rec}</span>
                          {rec.confidence && (
                            <span className="confidence">
                              <span className="confidence-icon">📊</span>
                              {Math.round(rec.confidence * 100)}%
                            </span>
                          )}
                          {rec.reason && (
                            <span className="reason">{rec.reason}</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="no-crops">No specific crop recommendations</p>
                    )}
                  </div>
                </div> */}
              </div>

              <div className="feedback-actions">
                <p className="action-question">
                  <span className="question-icon">❓</span>
                  <strong>Was this recommendation useful?</strong>
                </p>
                <div className="action-buttons">
                  <button
                    className="btn-success btn-feedback"
                    disabled={updatingId === item._id}
                    onClick={() => submitFeedback(item._id, true)}
                  >
                    {updatingId === item._id ? (
                      <>
                        <span className="btn-spinner"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">✅</span>
                        Yes, Useful
                      </>
                    )}
                  </button>
                  <button
                    className="btn-danger btn-feedback"
                    disabled={updatingId === item._id}
                    onClick={() => submitFeedback(item._id, false)}
                  >
                    {updatingId === item._id ? (
                      <>
                        <span className="btn-spinner"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">❌</span>
                        Not Useful
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feedback;