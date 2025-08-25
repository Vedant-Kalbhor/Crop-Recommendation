import React, { useState } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';

const ImageAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
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
      // Create form data
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await recommendationAPI.soilImage(formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Soil Image Analysis</h1>
      <p>Upload an image of your soil to get crop recommendations based on soil type.</p>
      
      <div className="image-analysis-container">
        <div className="upload-section">
          <h3>Upload Soil Image</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="file-upload">
              <input
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
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading || !selectedFile}
              className="analyze-btn"
            >
              {loading ? 'Analyzing...' : 'Analyze Soil'}
            </button>
          </form>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        {result && (
          <div className="result-section">
            <h3>Analysis Results</h3>
            <div className="soil-type">
              <strong>Detected Soil Type:</strong> {result.soilType}
            </div>
            
            <div className="recommendations">
              <h4>Recommended Crops:</h4>
              <div className="recommendations-grid">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <h5>{rec.crop}</h5>
                    <p>Confidence: {(rec.confidence * 100).toFixed(1)}%</p>
                    <p>{rec.reason}</p>
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

export default ImageAnalysis;