import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/authAPI';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.setToken(token);
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const getCurrentUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Get current user error:', error);
      localStorage.removeItem('token');
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      const response = await authAPI.register(userData);
      const { token, ...user } = response.data;
      
      localStorage.setItem('token', token);
      authAPI.setToken(token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const login = async (credentials) => {
    try {
      setError('');
      const response = await authAPI.login(credentials);
      const { token, ...user } = response.data;
      
      localStorage.setItem('token', token);
      authAPI.setToken(token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    authAPI.setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    error,
    loading,
    register,
    login,
    logout,
    updateProfile,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};