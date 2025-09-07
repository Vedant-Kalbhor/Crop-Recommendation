import api, { mlApi } from './authAPI';

export const recommendationAPI = {
  getHistory: () => api.get('/recommendations/history'),

  soilParams: (data) => mlApi.post('/predict/soil-params', data),

  soilImage: (formData) =>
    api.post('/recommendations/soil-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  regionAnalysis: ({ region, district }) =>
    mlApi.post('/predict/region', { region, district }),

  getAvailableStates: () => mlApi.get('/available/states'),

  getAvailableDistricts: (state) =>
    mlApi.get(`/available/districts?state=${encodeURIComponent(state)}`),

  updateFeedback: (id, feedback) =>
    api.put(`/recommendations/${id}/feedback`, feedback),
};

export default recommendationAPI;
