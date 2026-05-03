import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from './api-config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp && Date.now() >= payload.exp * 1000;
  } catch (e) {
    return true; // If token is not a valid JWT, consider it expired
  }
};

// Function to handle session expiration
export const handleSessionExpiration = () => {
  // Clear all auth-related data
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('otpToken');
  localStorage.removeItem('isAuthenticated');

  // Dispatch a custom event to show the session expired modal
  window.dispatchEvent(new Event('session-expired'));
};

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  // Check if token exists and is not expired
  if (token) {
    if (isTokenExpired(token)) {
      handleSessionExpiration();
      return Promise.reject('Token expired');
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleSessionExpiration();
    }
    return Promise.reject(error);
  }
);

// Types
export interface CreateClientRequest {
  first_name: string;
  last_name: string;
  email: string;
  created_by: string;
  updated_by: string;
  deleted_by: string;
}

export interface CreateClientResponse {
  status: {
    success: boolean;
    message: string;
  };
  data: {
    first_name: string;
    last_name: string;
    email: string;
    created_by: string;
    updated_by: string;
    deleted_by: string;
    external_id: string;
    updated_at: string;
    last_login: string | null;
    id: number;
    is_active: boolean;
    created_at: string;
    deleted_at: string | null;
  };
}

export interface ApiError {
  status: {
    success: boolean;
    message: string;
  };
}

// Client API functions
export const clientApi = {
  createClient: async (clientData: any) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");
    const response = await axios.post(
      `${API_BASE_URL}/clients`,
      clientData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },
};


export default api; 
