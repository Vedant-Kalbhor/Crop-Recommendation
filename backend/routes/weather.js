const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

// Get current weather by coordinates
router.get('/current', auth, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    
    const response = await axios.get(url);
    const weatherData = response.data;
    
    
    const formattedData = {
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      rainfall: weatherData.rain ? weatherData.rain['1h'] || 0 : 0,
      description: weatherData.weather[0].description,
      location: weatherData.name,
      country: weatherData.sys.country,
      icon: weatherData.weather[0].icon
    };
    
    res.json(formattedData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ message: 'Error fetching weather data' });
  }
});


router.get('/forecast', auth, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    
    const response = await axios.get(url);
    const forecastData = response.data;
    
    // Process forecast data
    const formattedForecast = forecastData.list.slice(0, 5).map(item => ({
      date: new Date(item.dt * 1000),
      temperature: item.main.temp,
      humidity: item.main.humidity,
      rainfall: item.rain ? item.rain['3h'] || 0 : 0,
      description: item.weather[0].description,
      icon: item.weather[0].icon
    }));
    
    res.json(formattedForecast);
  } catch (error) {
    console.error('Weather forecast error:', error);
    res.status(500).json({ message: 'Error fetching weather forecast' });
  }
});

module.exports = router;