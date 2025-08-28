import api, { mlApi } from './authAPI';

export const recommendationAPI = {
  getHistory: () => {
    return api.get('/recommendations/history'); // Uses main API (with auth)
  },

  soilParams: (data) => {
    return mlApi.post('/predict/soil-params', data); // Uses ML API (no auth)
  },

  soilImage: (formData) => {
    return mlApi.post('/predict/soil-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }); // Uses ML API (no auth)
  },

  regionAnalysis: (location) => {
    return mlApi.post('/predict/region', location); // Uses ML API (no auth)
  },

  updateFeedback: (id, feedback) => {
    return api.put(`/recommendations/${id}/feedback`, feedback); // Uses main API (with auth)
  }
};

export default recommendationAPI;