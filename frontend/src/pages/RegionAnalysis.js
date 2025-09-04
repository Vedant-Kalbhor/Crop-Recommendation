// import React, { useState, useEffect } from 'react';
// import { recommendationAPI } from '../services/recommendationAPI';
// import { weatherAPI } from '../services/weatherAPI';

// const RegionAnalysis = () => {
//   const [location, setLocation] = useState({
//     region: '',
//     lat: '',
//     lng: ''
//   });
//   const [useCurrentLocation, setUseCurrentLocation] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [weather, setWeather] = useState(null);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (useCurrentLocation) {
//       getCurrentLocation();
//     }
//   }, [useCurrentLocation]);

//   const getCurrentLocation = () => {
//     if (!navigator.geolocation) {
//       setError('Geolocation is not supported by your browser');
//       return;
//     }

//     setLoading(true);
    
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const { latitude, longitude } = position.coords;
//         setLocation(prev => ({
//           ...prev,
//           lat: latitude,
//           lng: longitude
//         }));
        
//         try {
//           // Get weather data for current location
//           const weatherResponse = await weatherAPI.getCurrentWeather(latitude, longitude);
//           setWeather(weatherResponse.data);
          
//           // Try to get region name from weather data
//           if (weatherResponse.data.location) {
//             setLocation(prev => ({
//               ...prev,
//               region: weatherResponse.data.location
//             }));
//           }
//         } catch (err) {
//           console.error('Error fetching weather data:', err);
//         } finally {
//           setLoading(false);
//         }
//       },
//       (error) => {
//         setError('Unable to retrieve your location');
//         setLoading(false);
//       }
//     );
//   };

//   const handleChange = (e) => {
//     setLocation({
//       ...location,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!location.region && !(location.lat && location.lng)) {
//       setError('Please enter a region or use your current location');
//       return;
//     }
    
//     setLoading(true);
//     setError('');
    
//     try {
//       const response = await recommendationAPI.regionAnalysis(location);
//       setResult(response.data);
//     } catch (err) {
//       setError(err.response?.data?.message || 'An error occurred during analysis');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="page-container">
//       <h1>Region-Based Analysis</h1>
//       <p>Get crop recommendations based on your region and current weather conditions.</p>
      
//       <div className="region-analysis-container">
//         <div className="input-section">
//           <form onSubmit={handleSubmit}>
//             <div className="location-options">
//               <label className="checkbox-label">
//                 <input
//                   type="checkbox"
//                   checked={useCurrentLocation}
//                   onChange={(e) => setUseCurrentLocation(e.target.checked)}
//                 />
//                 Use my current location
//               </label>
//             </div>
            
//             {!useCurrentLocation && (
//               <div className="form-group">
//                 <label htmlFor="region">Region Name(Direction Wise)</label>
//                 <input
//                   type="text"
//                   id="region"
//                   name="region"
//                   value={location.region}
//                   onChange={handleChange}
//                   placeholder="Enter your region or city"
//                 />
//               </div>
//             )}
            
//             {(useCurrentLocation && location.lat && location.lng) && (
//               <div className="coordinates">
//                 <p>Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
//                 {weather && (
//                   <div className="weather-preview">
//                     <p>Current weather: {weather.temperature}°C, {weather.description}</p>
//                   </div>
//                 )}
//               </div>
//             )}
            
//             <button type="submit" disabled={loading}>
//               {loading ? 'Analyzing...' : 'Get Recommendations'}
//             </button>
//           </form>
          
//           {error && <div className="error-message">{error}</div>}
//         </div>
        
//         {result && (
//           <div className="result-section">
//             <h3>Region-Based Recommendations</h3>
            
//             {result.weatherData && (
//               <div className="weather-info">
//                 <h4>Weather Conditions:</h4>
//                 <p>Temperature: {result.weatherData.temperature}°C</p>
//                 <p>Humidity: {result.weatherData.humidity}%</p>
//                 <p>Rainfall: {result.weatherData.rainfall}mm</p>
//               </div>
//             )}
            
//             <div className="recommendations">
//               <h4>Recommended Crops for {result.region}:</h4>
//               <div className="recommendations-grid">
//                 {result.recommendations.map((rec, index) => (
//                   <div key={index} className="recommendation-card">
//                     <h5>{rec.crop}</h5>
//                     <p>Confidence: {(rec.confidence * 100).toFixed(1)}%</p>
//                     <p>{rec.reason}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default RegionAnalysis;

import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';
import { weatherAPI } from '../services/weatherAPI';

const RegionAnalysis = () => {
  const [location, setLocation] = useState({
    region: '',
    lat: '',
    lng: ''
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);

  useEffect(() => {
    if (useCurrentLocation) {
      getCurrentLocation();
    }
  }, [useCurrentLocation]);

  useEffect(() => {
    // Fetch available states on component mount
    fetchAvailableStates();
  }, []);

  const fetchAvailableStates = async () => {
    try {
      const response = await recommendationAPI.getAvailableStates();
      setAvailableStates(response.data.states || []);
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchDistrictsForState = async (state) => {
    try {
      const response = await recommendationAPI.getAvailableDistricts(state);
      setAvailableDistricts(response.data.districts || []);
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude
        }));
        
        try {
          // Get weather data for current location
          const weatherResponse = await weatherAPI.getCurrentWeather(latitude, longitude);
          setWeather(weatherResponse.data);
        } catch (err) {
          console.error('Error fetching weather data:', err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setError('Unable to retrieve your location');
        setLoading(false);
      }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocation({
      ...location,
      [name]: value
    });

    // If state is selected, fetch its districts
    if (name === 'region' && value) {
      fetchDistrictsForState(value);
    }
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setLocation({
      ...location,
      region: state,
      district: ''
    });
    fetchDistrictsForState(state);
  };

  // Add this method to your RegionAnalysis component
const handleCoordinateAnalysis = async () => {
  setLoading(true);
  setError('');
  
  try {
    const response = await recommendationAPI.regionAnalysis({
      lat: location.lat,
      lng: location.lng
    });
    
    if (response.data.error && response.data.geocoded_info) {
      // Show geocoding results but no crop data
      setResult({
        geocoded_info: response.data.geocoded_info,
        error: response.data.error,
        suggestions: response.data.available_states
      });
    } else {
      setResult(response.data);
    }
  } catch (err) {
    setError(err.response?.data?.detail || 'An error occurred during analysis');
  } finally {
    setLoading(false);
  }
};

// Update the result display section
{result && (
  <div className="result-section">
    {result.error ? (
      <>
        <h3>Location Analysis</h3>
        <div className="error-message">{result.error}</div>
        
        {result.geocoded_info && (
          <div className="geocoding-info">
            <h4>Detected Location:</h4>
            <p>State: {result.geocoded_info.state || 'Unknown'}</p>
            <p>District: {result.geocoded_info.district || 'Unknown'}</p>
            <p>Country: {result.geocoded_info.country || 'Unknown'}</p>
          </div>
        )}
        
        {result.suggestions && (
          <div className="suggestions">
            <h4>Available States:</h4>
            <ul>
              {result.suggestions.map((state, index) => (
                <li key={index}>{state}</li>
              ))}
            </ul>
          </div>
        )}
      </>
    ) : (
      <>
        <h3>Region-Based Recommendations for {result.region_name}</h3>
        
        {result.weather_data && (
          <div className="weather-info">
            <h4>Weather Conditions:</h4>
            <p>Temperature: {result.weather_data.temperature}°C</p>
            <p>Humidity: {result.weather_data.humidity}%</p>
            <p>Rainfall: {result.weather_data.rainfall}mm</p>
          </div>
        )}
        
        <div className="region-stats">
          <h4>Region Statistics:</h4>
          <p>Total Cultivation Area: {result.total_area.toFixed(2)} hectares</p>
          <p>Total Production: {result.total_production.toFixed(2)} tonnes</p>
        </div>
        
        <div className="recommendations">
          <h4>Recommended Crops:</h4>
          <div className="recommendations-grid">
            {result.top_crops.map((crop, index) => (
              <div key={index} className="recommendation-card">
                <h5>{crop.Crop}</h5>
                <p>Average Yield: {crop.Yield.toFixed(2)} tonnes/hectare</p>
                <p>Cultivation Area: {crop.Area.toFixed(2)} hectares</p>
                <p>Production: {crop.Production.toFixed(2)} tonnes</p>
              </div>
            ))}
          </div>
        </div>
      </>
    )}
  </div>
)}

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location.region && !(location.lat && location.lng)) {
      setError('Please enter a region or use your current location');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await recommendationAPI.regionAnalysis(location);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Region-Based Analysis</h1>
      <p>Get crop recommendations based on your region using actual agricultural data.</p>
      
      <div className="region-analysis-container">
        <div className="input-section">
          <form onSubmit={handleSubmit}>
            <div className="location-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useCurrentLocation}
                  onChange={(e) => setUseCurrentLocation(e.target.checked)}
                />
                Use my current location
              </label>
            </div>
            
            {!useCurrentLocation && (
              <>
                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <select
                    id="state"
                    name="state"
                    value={location.region}
                    onChange={handleStateChange}
                  >
                    <option value="">Select a state</option>
                    {availableStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                
                {availableDistricts.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="district">District (Optional)</label>
                    <select
                      id="district"
                      name="district"
                      value={location.district || ''}
                      onChange={(e) => setLocation({...location, region: e.target.value})}
                    >
                      <option value="">Select a district</option>
                      {availableDistricts.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="region">Or enter region name manually</label>
                  <input
                    type="text"
                    id="region"
                    name="region"
                    value={location.region}
                    onChange={handleChange}
                    placeholder="Enter state or district name"
                    list="state-suggestions"
                  />
                  <datalist id="state-suggestions">
                    {availableStates.map(state => (
                      <option key={state} value={state} />
                    ))}
                    {availableDistricts.map(district => (
                      <option key={district} value={district} />
                    ))}
                  </datalist>
                </div>
              </>
            )}
            
            {(useCurrentLocation && location.lat && location.lng) && (
              <div className="coordinates">
                <p>Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                {weather && (
                  <div className="weather-preview">
                    <p>Current weather: {weather.temperature}°C, {weather.description}</p>
                  </div>
                )}
              </div>
            )}
            
            <button type="submit" disabled={loading}>
              {loading ? 'Analyzing...' : 'Get Recommendations'}
            </button>
          </form>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        {result && (
          <div className="result-section">
            <h3>Region-Based Recommendations for {result.region_name}</h3>
            
            {result.weather_data && (
              <div className="weather-info">
                <h4>Weather Conditions:</h4>
                <p>Temperature: {result.weather_data.temperature}°C</p>
                <p>Humidity: {result.weather_data.humidity}%</p>
                <p>Rainfall: {result.weather_data.rainfall}mm</p>
              </div>
            )}
            
            <div className="region-stats">
              <h4>Region Statistics:</h4>
              <p>Total Cultivation Area: {result.total_area.toFixed(2)} hectares</p>
              <p>Total Production: {result.total_production.toFixed(2)} tonnes</p>
            </div>
            
            <div className="recommendations">
              <h4>Recommended Crops:</h4>
              <div className="recommendations-grid">
                {result.top_crops.map((crop, index) => (
                  <div key={index} className="recommendation-card">
                    <h5>{crop.Crop}</h5>
                    <p>Average Yield: {crop.Yield.toFixed(2)} tonnes/hectare</p>
                    <p>Cultivation Area: {crop.Area.toFixed(2)} hectares</p>
                    <p>Production: {crop.Production.toFixed(2)} tonnes</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionAnalysis;