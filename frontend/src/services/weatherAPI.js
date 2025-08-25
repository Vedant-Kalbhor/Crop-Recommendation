import api from './authAPI';

export const weatherAPI = {
  getCurrentWeather: (lat, lng) => {
    return api.get(`/weather/current?lat=${lat}&lng=${lng}`);
  },

  getForecast: (lat, lng) => {
    return api.get(`/weather/forecast?lat=${lat}&lng=${lng}`);
  }
};