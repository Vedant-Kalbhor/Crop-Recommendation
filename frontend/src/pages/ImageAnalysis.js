import React, { useState, useRef } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';
import { formatFileSize } from '../utils/helpers';
import { ERROR_MESSAGES, APP_CONSTANTS } from '../utils/constants';

const ImageAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setResult(null); // Clear previous results
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await recommendationAPI.soilImage(formData);
      
      // Validate response structure
      if (response.data && Array.isArray(response.data.recommendations)) {
        setResult(response.data);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during analysis');
      console.error('Image analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Safe rendering of recommendations
  const renderRecommendations = () => {
    if (!result || !result.recommendations || !Array.isArray(result.recommendations)) {
      return null;
    }

    return result.recommendations.map((rec, index) => (
      <div key={index} className="recommendation-card">
        <div className="crop-header">
          <h5>{rec.crop || 'Unknown Crop'}</h5>
          <span className="confidence-score">
            {rec.confidence ? `${Math.round(rec.confidence * 100)}% confidence` : 'N/A'}
          </span>
        </div>
        <p className="recommendation-reason">{rec.reason || 'No reason provided'}</p>
        <div className="crop-properties">
          <span className="property-tag">Ideal for {result.soil_type || 'unknown'} soil</span>
        </div>
      </div>
    ));
  };

  return (
    <div className="page-container">
      <h1>Soil Image Analysis</h1>
      <p>Upload an image of your soil to analyze its type and get crop recommendations.</p>
      
      <div className="image-analysis-container">
        <div className="upload-section">
          <h3>Upload Soil Image</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="file-upload">
              <input
                ref={fileInputRef}
                type="file"
                id="soil-image"
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input"
              />
              <label htmlFor="soil-image" className="file-label">
                Choose Image
              </label>
              
              {selectedFile && (
                <span className="file-name">{selectedFile.name}</span>
              )}
            </div>
            
            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="Soil preview" />
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="remove-image-btn"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading || !selectedFile}
              className="analyze-btn"
            >
              {loading ? 'Analyzing...' : 'Analyze Soil Image'}
            </button>
          </form>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        {result && (
          <div className="result-section">
            <h3>Analysis Results</h3>
            
            <div className="soil-type-result">
              <h4>Detected Soil Type:</h4>
              <div className="soil-type-badge">
                {result.soil_type || 'Unknown'}
              </div>
            </div>

            <div className="recommendations">
              <h4>Recommended Crops:</h4>
              <div className="recommendations-grid">
                {renderRecommendations()}
              </div>
            </div>

            {result.soil_type && (
              <div className="soil-type-info">
                <h4>About {result.soil_type} Soil:</h4>
                <p>{getsoil_typeDescription(result.soil_type)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Updated helper function with only 4 soil types
const getsoil_typeDescription = (soil_type) => {
  const descriptions = {
    alluvial: 'Alluvial soil is highly fertile and rich in nutrients. It is ideal for crops like rice, wheat, sugarcane, and pulses.',
    clay: 'Clay soil is heavy and retains water well. It is rich in nutrients but can be difficult to work with when wet. Suitable for crops like rice and cotton.',
    black: 'Black soil, also called Regur soil, is moisture-retentive and rich in lime, calcium, and magnesium. It is ideal for cotton, soybean, and maize.',
    red: 'Red soil contains a high amount of iron oxide, giving it a reddish color. It is less fertile but suitable for crops like groundnut, pulses, and millets.'
  };

  return descriptions[soil_type.toLowerCase()] || 'This soil type has specific characteristics that make it suitable for certain crops.';
};

export default ImageAnalysis;
