import React, { useState } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';

const CropCard = ({ recommendation, onFeedbackUpdate }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState(recommendation.successStatus || 'pending');
  const [updating, setUpdating] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return;
    
    setUpdating(true);
    try {
      await recommendationAPI.updateFeedback(recommendation._id, {
        successStatus: status,
        feedback
      });
      
      setShowFeedback(false);
      if (onFeedbackUpdate) {
        onFeedbackUpdate();
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'failure': return 'failure';
      default: return 'pending';
    }
  };

  return (
    <div className="crop-card">
      <div className="card-header">
        <h4>Recommendation</h4>
        <span className={`status ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
      
      <div className="recommended-crops">
        <h5>Top Recommendations:</h5>
        {recommendation.recommendations.map((rec, index) => (
          <div key={index} className="crop-item">
            <span className="crop-name">{rec.crop}</span>
            <span className="confidence">{(rec.confidence * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      
      <div className="method-info">
        <p>Method: {recommendation.method.replace('_', ' ')}</p>
        <p>Date: {new Date(recommendation.createdAt).toLocaleDateString()}</p>
      </div>
      
      {recommendation.feedback && (
        <div className="feedback">
          <p><strong>Your feedback:</strong> {recommendation.feedback}</p>
        </div>
      )}
      
      {status === 'pending' && (
        <button 
          className="feedback-btn"
          onClick={() => setShowFeedback(!showFeedback)}
        >
          {showFeedback ? 'Cancel' : 'Provide Feedback'}
        </button>
      )}
      
      {showFeedback && (
        <div className="feedback-form">
          <div className="form-group">
            <label>Was this recommendation successful?</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="success">Yes</option>
              <option value="failure">No</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Additional feedback:</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience with this recommendation..."
              rows="3"
            />
          </div>
          
          <button 
            onClick={handleFeedbackSubmit}
            disabled={updating || !feedback.trim()}
          >
            {updating ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CropCard;