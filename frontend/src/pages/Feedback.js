// frontend/src/pages/Feedback.js
import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';
import '../styles/Dashboard.css'; // reuse styles or create new

const Feedback = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      // We fetch history filtered by status=pending. The backend /history supports query params.
      const resp = await recommendationAPI.getHistory({ status: 'pending', limit: 100 });
      const list = Array.isArray(resp.data) ? resp.data : (resp.data?.data || []);
      setPending(list);
    } catch (err) {
      console.error('Error fetching pending feedbacks:', err);
      setError('Failed to load pending feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (id, success) => {
    try {
      setUpdatingId(id);
      await recommendationAPI.updateFeedback(id, { successStatus: success ? 'success' : 'failure', feedback: success ? 'Useful' : 'Not useful' });
      // Refresh pending list
      await fetchPending();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="loading">Loading pending feedbacks...</div>;

  return (
    <div className="dashboard">
      <h1>Pending Feedbacks</h1>
      {error && <div className="error">{error}</div>}
      {pending.length === 0 ? (
        <p>No pending feedbacks. Great job!</p>
      ) : (
        <div className="history-list">
          {pending.map(item => (
            <div key={item._id} className="history-item">
              <h4>{new Date(item.createdAt || item.createAt).toLocaleString()}</h4>
              <p>Method: {item.method}</p>
              <div className="recommended-crops">
                {(item.recommendations && item.recommendations.length > 0) ? (
                  item.recommendations.map((rec, idx) => <span key={idx} className="crop-tag">{rec.crop || rec}</span>)
                ) : <em>No crop recommendations</em>}
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  disabled={updatingId === item._id}
                  onClick={() => submitFeedback(item._id, true)}
                  style={{ marginRight: 8 }}
                >
                  ✅ Useful
                </button>
                <button
                  disabled={updatingId === item._id}
                  onClick={() => submitFeedback(item._1d, false)}
                >
                  ❌ Not useful
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feedback;
