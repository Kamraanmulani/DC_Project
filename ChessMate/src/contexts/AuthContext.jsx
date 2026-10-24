import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'SIGNUP_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
    case 'SIGNUP_SUCCESS':
      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
      // Store token in localStorage
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null
      };
    case 'LOGIN_ERROR':
    case 'SIGNUP_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      // Remove token from axios headers
      delete axios.defaults.headers.common['Authorization'];
      // Remove from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null
      };
    case 'LOAD_USER':
      // Set token in axios headers if exists
      if (action.payload.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
      }
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        dispatch({
          type: 'LOAD_USER',
          payload: {
            token,
            user: JSON.parse(user)
          }
        });
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      dispatch({ type: 'LOAD_USER', payload: { token: null, user: null } });
    }
  }, []);

  // Signup function
  const signup = useCallback(async (userData) => {
    try {
      dispatch({ type: 'SIGNUP_START' });
      
      const response = await axios.post('/auth/signup', userData);
      
      dispatch({
        type: 'SIGNUP_SUCCESS',
        payload: response.data.data
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.details || 'Signup failed';
      dispatch({
        type: 'SIGNUP_ERROR',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await axios.post('/auth/login', credentials);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response.data.data
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Get current user function
  const getCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get('/auth/me');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get user data';
      return { success: false, error: errorMessage };
    }
  }, []);

  const value = {
    ...state,
    signup,
    login,
    logout,
    clearError,
    getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};