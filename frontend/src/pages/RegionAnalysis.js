import React from "react";
import RegionForm from "../components/RegionForm";  // ✅ import the component

const RegionAnalysis = () => {
  return (
    <div className="page-container">
      <h2>Region-Based Crop Recommendation</h2>
      <p>Get crop recommendations based on your region using actual agricultural data.</p>

      {/* ✅ Use the new dropdown-based form */}
      <RegionForm />
    </div>
  );
};

export default RegionAnalysis;
