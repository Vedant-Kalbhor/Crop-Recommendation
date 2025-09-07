import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import SoilAnalysis from './pages/SoilAnalysis';
import ImageAnalysis from './pages/ImageAnalysis';
import RegionAnalysis from './pages/RegionAnalysis';  // ✅ correct
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/soil-analysis"
                element={
                  <PrivateRoute>
                    <SoilAnalysis />
                  </PrivateRoute>
                }
              />
              <Route
                path="/image-analysis"
                element={
                  <PrivateRoute>
                    <ImageAnalysis />
                  </PrivateRoute>
                }
              />
              <Route
                path="/region-analysis"
                element={
                  <PrivateRoute>
                    <RegionAnalysis /> {/* ✅ page */}
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
