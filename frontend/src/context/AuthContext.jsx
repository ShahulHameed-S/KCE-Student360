import React, { createContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { studentSubmissionService } from "../services/studentSubmissionService";

console.log("MODE:", import.meta.env.MODE);
console.log("PROD:", import.meta.env.PROD);
console.log("API URL:", import.meta.env.VITE_API_BASE_URL);

export const AuthContext = createContext();

const MOCK_USERS = [
  { email: "faculty@student360.com", password: "Password123!", name: "Dr. Ramanujam", role: "faculty" },
  { email: "mentor@student360.com", password: "Password123!", name: "Dr. Monisha R", role: "mentor" },
  { email: "student@student360.com", password: "Password123!", name: "Shahul", role: "student", studentId: "1", registerNo: "22AD001" },
  { email: "admin@student360.com", password: "Password123!", name: "Admin Officer", role: "admin" }
];

const getErrorMessage = (error) => {
  if (!error) return "Login failed";

  if (typeof error === "string") return error;

  // Explicit check for 401 Unauthorized to show "Invalid credentials"
  if (error.response && error.response.status === 401) {
    return "Invalid credentials";
  }

  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  if (error.response?.data?.detail?.error?.message) {
    return error.response.data.detail.error.message;
  }

  if (error.response?.data?.detail) {
    if (typeof error.response.data.detail === "string") {
      return error.response.data.detail;
    }

    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail
        .map((item) => item.msg || JSON.stringify(item))
        .join(", ");
    }

    return JSON.stringify(error.response.data.detail);
  }

  if (error.message) return error.message;

  return "Login failed. Please check your credentials.";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    const verifySession = async () => {
      const savedUser = localStorage.getItem("currentUser") || localStorage.getItem("user");
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      
      if (token && savedUser) {
        try {
          // Verify with backend
          const fetchedUser = await authService.getMe();
          localStorage.setItem("currentUser", JSON.stringify(fetchedUser));
          setUser(fetchedUser);

          if (fetchedUser.role === "student") {
            const regNo = fetchedUser.registerNo || fetchedUser.register_no;
            if (regNo) {
              await studentSubmissionService.syncSubmissionsWithBackend(regNo);
            }
          }
        } catch (err) {
          if (err.code === "ERR_NETWORK" || !err.response) {
            console.warn("Backend server is not running. Please start FastAPI backend.");
            setBackendError("Backend server is not running. Please start FastAPI backend.");
            // Network fallback: use local storage data
            setUser(JSON.parse(savedUser));
          } else {
            // Token invalid/expired: logout
            console.warn("Session invalid, clearing credentials.");
            localStorage.clear();
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setBackendError("");
    
    console.log("Login endpoint: /auth/login");
    console.log("Login identifier:", email);
    
    try {
      // 1. Attempt login (authService.login handles mock fallback internally for local dev)
      const response = await authService.login(email, password);
      console.log("Login response:", response);
      
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);
      localStorage.setItem("currentUser", JSON.stringify(response.user));
      
      // Also write legacy keys for absolute compatibility with any components reading them
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.access_token);

      setUser(response.user);
      if (response.user.role === "student") {
        const regNo = response.user.registerNo || response.user.register_no;
        if (regNo) {
          await studentSubmissionService.syncSubmissionsWithBackend(regNo);
        }
      }
      setLoading(false);
      return response.user;
    } catch (error) {
      console.log("Login error response:", error.response?.data || error.message || error);
      setLoading(false);
      
      // Set backendError warning banner if it's a network error
      if (error.code === "ERR_NETWORK" || !error.response) {
        setBackendError("Backend server is not running. Please start FastAPI backend.");
      }
      
      // Extract error message safely
      const detailMsg = getErrorMessage(error);
      throw new Error(detailMsg);
    }
  };

  const logout = async () => {
    await authService.logout();
    
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const merged = {
        ...prev,
        ...updates,
        profileImage:
          updates.profileImage ||
          updates.profile_image ||
          prev?.profileImage ||
          prev?.profile_image ||
          null,
        profile_image:
          updates.profile_image ||
          updates.profileImage ||
          prev?.profile_image ||
          prev?.profileImage ||
          null,
        profileImageUpdatedAt: updates.profileImageUpdatedAt || Date.now(),
      };

      localStorage.setItem("currentUser", JSON.stringify(merged));
      localStorage.setItem("user", JSON.stringify(merged));

      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, updateUser, backendError }}>
      {children}
    </AuthContext.Provider>
  );
};
