import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await authAPI.getProfile();
          setUser(userData.data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      console.log('AuthContext login response:', response);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true };
      } else {
        setError(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('AuthContext login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      console.log('AuthContext register response:', response);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true };
      } else {
        setError(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('AuthContext register error:', error);
      const message = error.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setError(null);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return { success: true };
      } else {
        setError(response.message || 'Profile update failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      setError(message);
      return { success: false, message };
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = React.useMemo(() => ({
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    isAuthenticated: !!user,
  }), [user, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 