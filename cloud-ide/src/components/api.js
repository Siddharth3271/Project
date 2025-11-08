import axios from "axios";
import { LANGUAGE_VERSIONS } from "../constants";

// Piston API (for code execution)
const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

export const executeCode = async (language, sourceCode) => {
  const response = await API.post("/execute", {
    language: language,
    version: LANGUAGE_VERSIONS[language],
    files: [
      {
        content: sourceCode,
      },
    ],
  });
  return response.data;
};

// === DJANGO BACKEND API ===

// --- 1. Public API Instance (for login, signup) ---
// This one does NOT have the interceptor
const publicApi = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// --- 2. Private API Instance (for authenticated requests) ---
// This is for all requests that need a token
export const privateApi = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token ONLY to the privateApi instance
privateApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- 3. Update Functions to use the correct instance ---

// Signup uses the publicApi
export const signupUser = async (userData) => {
  const response = await publicApi.post("/api/auth/signup/", userData);
  return response.data;
};

// Login uses the publicApi
export const loginUser = async (userData) => {
  const response = await publicApi.post("/api/auth/login/", userData);
  // Save tokens on successful login
  localStorage.setItem("access", response.data.access);
  localStorage.setItem("refresh", response.data.refresh);
  localStorage.setItem("username", response.data.username);
  return response.data;
};

// Logout (no API call needed, just clear storage)
export const logoutUser = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("username");
};

