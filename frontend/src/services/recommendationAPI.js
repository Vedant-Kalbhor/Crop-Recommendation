import api from './authAPI';

export const recommendationAPI = {
  getHistory: () => {
    return api.get('/recommendations/history');
  },

  soilParams: (data) => {
    return api.post('/recommendations/soil-params', data);
  },

  soilImage: (formData) => {
    return api.post('/recommendations/soil-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  regionAnalysis: (location) => {
    return api.post('/recommendations/region', location);
  },

  updateFeedback: (id, feedback) => {
    return api.put(`/recommendations/${id}/feedback`, feedback);
  }
};