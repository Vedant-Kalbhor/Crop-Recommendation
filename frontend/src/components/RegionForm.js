import React, { useState, useEffect } from "react";
import { recommendationAPI } from "../services/recommendationAPI";

const RegionForm = () => {
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    recommendationAPI.getAvailableStates()
      .then((res) => setStates(res.data.states || []))
      .catch((err) => console.error("Error fetching states", err));
  }, []);

  const handleStateChange = async (e) => {
    const selected = e.target.value;
    setRegion(selected);
    setDistrict("");
    setResult(null);

    if (selected) {
      try {
        const res = await recommendationAPI.getAvailableDistricts(selected);
        setDistricts(res.data.districts || []);
      } catch (err) {
        console.error("Error fetching districts", err);
        setDistricts([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!region) {
      setError("Please select a state");
      return;
    }

    setLoading(true);
    try {
      const res = await recommendationAPI.regionAnalysis({ region, district });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="region-form-container">
      {/* <h2>Region-Based Crop Recommendation</h2> */}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>State</label>
          <select value={region} onChange={handleStateChange}>
            <option value="">Select a state</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {districts.length > 0 && (
          <div className="form-group">
            <label>District</label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">Select a district</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Get Recommendations"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {result && result.recommendations && (
        <div className="result-section">
          <h3>
            Recommended Crops for {result.region}
            {result.district ? ` - ${result.district}` : ""}
          </h3>
          <div className="recommendations-grid">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="recommendation-card">
                <h4>{rec.crop}</h4>
                <p>{Math.round(rec.confidence * 100)}% confidence</p>
                <p>{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionForm;
