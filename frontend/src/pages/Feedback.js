// frontend/src/pages/Feedback.js
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
      
      // Filter for pending recommendations from the history
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
      
      // Remove the item from the local state
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
      <div className="dashboard">
        <div className="loading">Loading pending feedbacks...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Pending Feedbacks</h1>
        <button onClick={fetchPending} className="refresh-btn">
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {pending.length === 0 ? (
        <div className="empty-state">
          <h3>No pending feedbacks!</h3>
          <p>All your recommendations have been reviewed.</p>
          <p>New recommendations will appear here for your feedback.</p>
        </div>
      ) : (
        <div className="feedback-list">
          {pending.map(item => (
            <div key={item._id} className="feedback-item">
              <div className="feedback-header">
                <h3>
                  {item.method === 'soil_params' && 'Soil Parameters Analysis'}
                  {item.method === 'soil_image' && 'Soil Image Analysis'}
                  {item.method === 'region' && 'Region Analysis'}
                </h3>
                <span className="date">
                  {new Date(item.createdAt || item.createAt).toLocaleDateString()}
                </span>
              </div>

              <div className="feedback-details">
                {item.method === 'soil_params' && item.inputData && (
                  <div className="input-details">
                    <p><strong>Soil Parameters:</strong></p>
                    <div className="params-grid">
                      <span>N: {item.inputData.N}</span>
                      <span>P: {item.inputData.P}</span>
                      <span>K: {item.inputData.K}</span>
                      <span>pH: {item.inputData.ph}</span>
                      <span>Temp: {item.inputData.temperature}°C</span>
                      <span>Humidity: {item.inputData.humidity}%</span>
                    </div>
                  </div>
                )}

                {item.method === 'soil_image' && item.inputData && (
                  <div className="input-details">
                    <p><strong>Detected Soil Type:</strong> {item.inputData.soil_type || 'Unknown'}</p>
                  </div>
                )}

                {item.method === 'region' && item.inputData && (
                  <div className="input-details">
                    <p><strong>Location:</strong> {item.inputData.region}{item.inputData.district ? `, ${item.inputData.district}` : ''}</p>
                  </div>
                )}

                <div className="recommendations">
                  <p><strong>Recommended Crops:</strong></p>
                  <div className="crops-list">
                    {item.recommendations && item.recommendations.length > 0 ? (
                      item.recommendations.map((rec, idx) => (
                        <div key={idx} className="crop-recommendation">
                          <span className="crop-name">{rec.crop || rec}</span>
                          {rec.confidence && (
                            <span className="confidence">
                              {Math.round(rec.confidence * 100)}% confidence
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
                </div>
              </div>

              <div className="feedback-actions">
                <p><strong>Was this recommendation useful?</strong></p>
                <div className="action-buttons">
                  <button
                    className="btn-success"
                    disabled={updatingId === item._id}
                    onClick={() => submitFeedback(item._id, true)}
                  >
                    {updatingId === item._id ? 'Updating...' : '✅ Yes, Useful'}
                  </button>
                  <button
                    className="btn-danger"
                    disabled={updatingId === item._id}
                    onClick={() => submitFeedback(item._id, false)}
                  >
                    {updatingId === item._id ? 'Updating...' : '❌ Not Useful'}
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