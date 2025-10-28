import axios from "axios";
import { LANGUAGE_VERSIONS } from "../constants";
const API=axios.create({
    baseURL:"https://emkc.org/api/v2/piston"
})

export const executeCode=async(language,sourceCode)=>{
    const response=await API.post("/execute",{
    "language": language,
    "version": LANGUAGE_VERSIONS[language],
    "files": [
        {
        "content": sourceCode
        }
    ],})
    return response.data
}

// === DJANGO BACKEND API ===
const BACKEND_API = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token if logged in
BACKEND_API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Signup
export const signupUser = async (userData) => {
  const response = await BACKEND_API.post("/api/auth/signup/", userData);
  return response.data;
};

// Login
export const loginUser = async (userData) => {
  const response = await BACKEND_API.post("/api/auth/login/", userData);
  localStorage.setItem("access", response.data.access);
  localStorage.setItem("refresh", response.data.refresh);
  localStorage.setItem("username", response.data.username);
  return response.data;
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("username");
};