"use client";

import { useState, useEffect } from "react";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import api, { isTokenExpired, handleSessionExpiration } from '@/lib/api';

// Mock user data - replace with actual authentication implementation
interface UserData {
  external_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login: string;
  role: 'admin' | 'user';
}

const mockUser: UserData = {
  external_id: "123",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  is_active: true,
  created_at: new Date().toISOString(),
  last_login: new Date().toISOString(),
  role: 'admin'
};

/**
 * Basic auth hook that returns mock user data.
 * TODO: Replace with real authentication logic
 */
export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("userData");
    const userEmail = localStorage.getItem("userEmail");

    if (!token || !userData || !userEmail) {
      router.push("/auth/login");
      return;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      handleSessionExpiration();
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Always set user_external_id on page load if available
      if (parsedUser.external_id) {
        localStorage.setItem("user_external_id", parsedUser.external_id);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      handleSessionExpiration();
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      // Call the logout API
      await api.post('/auth/logout');
    } catch (error: any) {
      // If 401, ignore and proceed to clear session
      if (error.response && error.response.status === 401) {
        console.warn('Session already expired or unauthorized.');
      } else {
      console.error("Logout error:", error);
      }
    } finally {
      // Always clear local storage and redirect
      handleSessionExpiration();
    }
  };

  // Function for sending OTP
  const sendOtp = async (email: string) => {
    try {
      const response = await api.post('/auth/login', { email });
      if (response.data.status.success) {
        const otpToken = response.data.status.token;

        if (!otpToken) {
          throw new Error("Verification token was not returned. Please try again.");
        }

        localStorage.setItem("userEmail", email);
        localStorage.setItem("otpToken", otpToken);
        return Promise.resolve();
        } else {
        throw new Error(response.data.status.message || "Failed to send OTP");
      }
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.status?.message || "Failed to send OTP"));
        }
  };

  // Function for verifying OTP
  const verifyOtp = async (otp: string, email?: string) => {
    try {
      const otpToken = localStorage.getItem("otpToken");

      if (!otpToken) {
        throw new Error("Verification token missing. Please request a new OTP.");
      }

      const response = await api.post('/auth/login/verify', {
        email: email || localStorage.getItem("userEmail"),
        otp: otp,
        token: otpToken
      });

      if (response.data.status.success) {
        localStorage.setItem("token", response.data.access.token);
        localStorage.setItem("userData", JSON.stringify(response.data.data));
        localStorage.setItem("userEmail", response.data.data.email);
        localStorage.removeItem("otpToken");
          localStorage.setItem("isAuthenticated", "true");
          
          setUser({
          external_id: response.data.data.external_id,
          first_name: response.data.data.first_name,
          last_name: response.data.data.last_name,
          email: response.data.data.email,
          is_active: response.data.data.is_active,
          created_at: response.data.data.created_at,
          last_login: response.data.data.last_login,
          role: response.data.data.role?.name === 'Admin' ? 'admin' : 'user'
          });
          
        return Promise.resolve();
        } else {
        throw new Error(response.data.status.message || "Invalid verification code");
      }
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.status?.message || "Failed to verify OTP"));
        }
  };

  // Function for login
  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
      try {
      const response = await api.post('/auth/login', credentials);
        const apiUser = response.data.data;
      
        localStorage.setItem("user_external_id", apiUser.external_id);
        localStorage.setItem("userData", JSON.stringify(apiUser));
        localStorage.setItem("userEmail", apiUser.email);
      
          setUser({
          external_id: apiUser.external_id,
          first_name: apiUser.first_name,
          last_name: apiUser.last_name,
          email: apiUser.email,
          is_active: apiUser.is_active,
          created_at: apiUser.created_at,
          last_login: apiUser.last_login,
          role: apiUser.role?.name === 'Admin' ? 'admin' : 'user',
          });
      
          setIsLoading(false);
      return Promise.resolve();
    } catch (error: any) {
          setIsLoading(false);
      return Promise.reject(new Error(error.response?.data?.status?.message || "Invalid credentials"));
        }
  };

  return {
    user,
    isLoading,
    login,
    logout,
    sendOtp,
    verifyOtp
  };
} 
