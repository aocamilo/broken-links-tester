import axios from "axios";

export const customInstance = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a response interceptor
customInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);
