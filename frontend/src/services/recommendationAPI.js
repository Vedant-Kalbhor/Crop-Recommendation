import api, { mlApi } from './authAPI';

export const recommendationAPI = {
  getHistory: () => {
    return api.get('/recommendations/history'); 
  },

  soilParams: (data) => {
    return mlApi.post('/predict/soil-params', data);
  },

  soilImage: async (formData) => {
    try {
      const response = await api.post('/recommendations/soil-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      console.error('Soil image upload error:', error);
      throw error;
    }
  },   // ✅ added missing comma

  regionAnalysis: (location) => {
    return mlApi.post('/predict/region', location);
  },

  updateFeedback: (id, feedback) => {
    return api.put(`/recommendations/${id}/feedback`, feedback);
  }
};

export default recommendationAPI;
