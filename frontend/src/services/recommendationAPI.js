// frontend/src/services/recommendationAPI.js
import api, { mlApi } from './authAPI';

export const recommendationAPI = {
  // Get user's recommendation history
  getHistory: () => api.get('/recommendations/history'),

  // Soil parameters analysis
  soilParams: (data) => api.post('/recommendations/soil-params', data),

  // Soil image analysis
  soilImage: (formData) =>
    api.post('/recommendations/soil-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Region analysis
  regionAnalysis: (data) => api.post('/recommendations/region', data),

  // ML API direct calls (for dropdowns)
  getAvailableStates: () => mlApi.get('/available/states'),
  getAvailableDistricts: (state) =>
    mlApi.get(`/available/districts?state=${encodeURIComponent(state)}`),

  // Update feedback - FIXED: Proper parameter structure
  updateFeedback: (id, data) =>
    api.put(`/recommendations/${id}/feedback`, data),
};

export default recommendationAPI;