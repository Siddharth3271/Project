import axios from "axios";
import { LANGUAGE_VERSIONS } from "../constants";


// === CODE EXECUTION API (Local Docker Piston) ===
export const executeCode = async (language, sourceCode, stdin) => {
  try {
    // We removed the http://127.0.0.1:2000 part!
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: language,
        version: "*", 
        files: [{ content: sourceCode }],
        stdin: stdin || "",
      }),
    });

    if (!response.ok) {
      throw new Error(`Local server responded with status: ${response.status}`);
    }

    const data = await response.json();

    return {
      run: {
        output: data.run.output || "",
        stderr: data.run.stderr ? data.run.stderr : null
      }
    };
  } catch (error) {
    console.error("Local Docker API Error:", error);
    throw new Error("Local execution server failed.");
  }
};
const backendURL="https://cloud-ide-backend-o772.onrender.com"

// === DJANGO BACKEND API ===

// --- 1. Public API Instance (for login, signup, password reset) ---
export const publicApi = axios.create({
  baseURL: backendURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- 2. Private API Instance (for authenticated requests) ---
// This is for all requests that need a token
export const privateApi = axios.create({
  baseURL: backendURL,
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