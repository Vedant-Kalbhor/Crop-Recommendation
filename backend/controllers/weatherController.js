const axios = require('axios');

// Get current weather by coordinates
const getCurrentWeather = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    
    const response = await axios.get(url);
    const weatherData = response.data;
    
    // Extract relevant data
    const formattedData = {
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      rainfall: weatherData.rain ? weatherData.rain['1h'] || 0 : 0,
      description: weatherData.weather[0].description,
      location: weatherData.name,
      country: weatherData.sys.country,
      icon: weatherData.weather[0].icon,
      windSpeed: weatherData.wind.speed,
      pressure: weatherData.main.pressure,
      visibility: weatherData.visibility,
      sunrise: new Date(weatherData.sys.sunrise * 1000),
      sunset: new Date(weatherData.sys.sunset * 1000)
    };
    
    res.json(formattedData);
  } catch (error) {
    console.error('Weather API error:', error);
    
    if (error.response?.status === 401) {
      return res.status(500).json({ message: 'Invalid weather API configuration' });
    }
    
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    res.status(500).json({ message: 'Error fetching weather data' });
  }
};

// Get weather forecast
const getForecast = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    
    const response = await axios.get(url);
    const forecastData = response.data;
    
    // Process forecast data - group by day
    const dailyForecast = {};
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      
      if (!dailyForecast[date]) {
        dailyForecast[date] = {
          date: new Date(item.dt * 1000),
          temperatures: [],
          humidities: [],
          rainfalls: [],
          descriptions: new Set(),
          icons: new Set()
        };
      }
      
      dailyForecast[date].temperatures.push(item.main.temp);
      dailyForecast[date].humidities.push(item.main.humidity);
      dailyForecast[date].rainfalls.push(item.rain ? item.rain['3h'] || 0 : 0);
      dailyForecast[date].descriptions.add(item.weather[0].description);
      dailyForecast[date].icons.add(item.weather[0].icon);
    });
    
    // Format the daily forecast
    const formattedForecast = Object.values(dailyForecast).map(day => ({
      date: day.date,
      temperature: {
        min: Math.min(...day.temperatures),
        max: Math.max(...day.temperatures),
        avg: day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length
      },
      humidity: day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length,
      rainfall: day.rainfalls.reduce((a, b) => a + b, 0),
      description: Array.from(day.descriptions).join(', '),
      icon: Array.from(day.icons)[0] // Use the first icon for the day
    })).slice(0, 5); // Next 5 days
    
    res.json({
      location: forecastData.city,
      forecast: formattedForecast
    });
  } catch (error) {
    console.error('Weather forecast error:', error);
    
    if (error.response?.status === 401) {
      return res.status(500).json({ message: 'Invalid weather API configuration' });
    }
    
    res.status(500).json({ message: 'Error fetching weather forecast' });
  }
};

// Get weather by city name
const getWeatherByCity = async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({ message: 'City name is required' });
    }
    
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    
    const response = await axios.get(url);
    const weatherData = response.data;
    
    // Extract relevant data
    const formattedData = {
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      rainfall: weatherData.rain ? weatherData.rain['1h'] || 0 : 0,
      description: weatherData.weather[0].description,
      location: weatherData.name,
      country: weatherData.sys.country,
      icon: weatherData.weather[0].icon,
      coordinates: {
        lat: weatherData.coord.lat,
        lon: weatherData.coord.lon
      }
    };
    
    res.json(formattedData);
  } catch (error) {
    console.error('Weather by city error:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'City not found' });
    }
    
    res.status(500).json({ message: 'Error fetching weather data' });
  }
};

module.exports = {
  getCurrentWeather,
  getForecast,
  getWeatherByCity
};