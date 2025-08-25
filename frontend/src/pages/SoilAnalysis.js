import React from 'react';
import SoilParamsForm from '../components/SoilParamsForm';

const SoilAnalysis = () => {
  return (
    <div className="page-container">
      <h1>Soil Parameters Analysis</h1>
      <p>Enter your soil parameters to get crop recommendations based on our machine learning model.</p>
      
      <SoilParamsForm />
    </div>
  );
};

export default SoilAnalysis;