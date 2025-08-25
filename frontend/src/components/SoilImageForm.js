import React, { useState, useRef } from 'react';
import { recommendationAPI } from '../services/recommendationAPI';
import { formatFileSize, validateImageFile } from '../utils/helpers';
import { ERROR_MESSAGES, APP_CONSTANTS } from '../utils/constants';

const SoilImageForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validationError = validateImageFile(
      file, 
      APP_CONSTANTS.FILE_UPLOAD.ALLOWED_IMAGE_TYPES, 
      APP_CONSTANTS.FILE_UPLOAD.MAX_FILE_SIZE
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setResult(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    const validationError = validateImageFile(
      file, 
      APP_CONSTANTS.FILE_UPLOAD.ALLOWED_IMAGE_TYPES, 
      APP_CONSTANTS.FILE_UPLOAD.MAX_FILE_SIZE
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setResult(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await recommendationAPI.soilImage(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      setResult(response.data);
      setUploadProgress(100);
      
      // Clear file after successful upload
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);

    } catch (err) {
      setError(err.response?.data?.message || ERROR_MESSAGES.SERVER_ERROR);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const validateImageFile = (file, allowedTypes, maxSize) => {
    if (!file.type.startsWith('image/')) {
      return ERROR_MESSAGES.INVALID_FILE_TYPE;
    }

    if (!allowedTypes.includes(file.type)) {
      return `Please upload a valid image format (${allowedTypes.join(', ')})`;
    }

    if (file.size > maxSize) {
      return ERROR_MESSAGES.FILE_TOO_LARGE;
    }

    return null;
  };

  return (
    <div className="soil-image-form-container">
      <h2>Soil Image Analysis</h2>
      <p>Upload an image of your soil to analyze its type and get crop recommendations.</p>

      <div className="upload-section">
        <div
          className={`drop-zone ${previewUrl ? 'has-image' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
          />
          
          {previewUrl ? (
            <div className="image-preview">
              <img src={previewUrl} alt="Soil preview" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="remove-image-btn"
                title="Remove image"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="drop-zone-content">
              <div className="upload-icon">📁</div>
              <p>Click to browse or drag and drop an image here</p>
              <p className="upload-hint">
                Supported formats: JPG, PNG, JPEG<br />
                Max size: {formatFileSize(APP_CONSTANTS.FILE_UPLOAD.MAX_FILE_SIZE)}
              </p>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="file-info">
            <h4>Selected File:</h4>
            <div className="file-details">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">{formatFileSize(selectedFile.size)}</span>
            </div>
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">Uploading: {uploadProgress}%</span>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedFile || loading}
          className="analyze-button"
        >
          {loading ? 'Analyzing Soil...' : 'Analyze Soil Image'}
        </button>
      </div>

      {result && (
        <div className="result-section">
          <h3>Analysis Results</h3>
          
          <div className="soil-type-result">
            <h4>Detected Soil Type:</h4>
            <div className="soil-type-badge">
              {result.soilType}
            </div>
          </div>

          <div className="recommendations">
            <h4>Recommended Crops:</h4>
            <div className="recommendations-grid">
              {result.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="crop-header">
                    <h5>{rec.crop}</h5>
                    <span className="confidence-score">
                      {Math.round(rec.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="recommendation-reason">{rec.reason}</p>
                  <div className="crop-properties">
                    <span className="property-tag">Ideal for {result.soilType} soil</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="soil-type-info">
            <h4>About {result.soilType} Soil:</h4>
            <p>
              {getSoilTypeDescription(result.soilType)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get soil type description
const getSoilTypeDescription = (soilType) => {
  const descriptions = {
    clay: 'Clay soil is heavy and retains water well. It is rich in nutrients but can be difficult to work with when wet. Improves with organic matter.',
    sandy: 'Sandy soil drains quickly and is easy to work with. It warms up fast in spring but requires frequent watering and fertilization.',
    loamy: 'Loamy soil is ideal for most plants. It has good drainage, retains moisture well, and is rich in nutrients. Considered the best soil type for gardening.',
    silty: 'Silty soil is smooth and retains moisture well. It is fertile but can become compacted easily. Benefits from organic matter to improve structure.',
    peaty: 'Peaty soil is acidic and retains a lot of moisture. It is rich in organic matter but may require drainage improvement and lime to reduce acidity.',
    chalky: 'Chalky soil is alkaline and free-draining. It is low in nutrients and may require regular fertilization. Suitable for plants that prefer alkaline conditions.'
  };

  return descriptions[soilType] || 'This soil type has specific characteristics that make it suitable for certain crops.';
};

export default SoilImageForm;