import React from "react";
import RegionForm from "../components/RegionForm";  

const RegionAnalysis = () => {
  return (
    <div className="page-container">
      <h2>Region-Based Crop Recommendation</h2>
      <p>Get crop recommendations based on your region using actual agricultural data.</p>

      
      <RegionForm />
    </div>
  );
};

export default RegionAnalysis;
