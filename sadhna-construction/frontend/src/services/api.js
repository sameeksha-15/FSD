import axios from "axios";
import { toast } from "react-toastify";

// Use environment variable or fallback to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the auth token in all requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log(`API Request to: ${config.url}`);
    if (token) {
      console.log(`Token found for request to ${config.url}`);
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.log(`No token found for request to ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
API.interceptors.response.use(
  (response) => {
    console.log(`Successful response from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`Error response:`, error);
    console.error(`Error status: ${error.response?.status}`);
    console.error(`Error data:`, error.response?.data);
    console.error(`Request URL: ${error.config?.url}`);

    if (error.response && error.response.status === 401) {
      // Unauthorized - clear token and redirect to login
      console.error("Authentication error - clearing token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
      toast.error("Session expired. Please log in again.");
    }
    return Promise.reject(error);
  }
);

// Generate payslip PDF download
export const generatePayslip = async (employeeId, month, year) => {
  try {
    // Get auth token
    const token = localStorage.getItem("token");
    
    // For PDF downloads, we need to use a different approach
    // Create a temporary hidden iframe to handle the download
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    
    // Use the iframe document to create a form
    const form = iframe.contentDocument.createElement("form");
    form.method = "GET";
    form.action = `http://localhost:5000/api/payroll/generate/${employeeId}?month=${month}&year=${year}`;
    
    // Create a custom xhr to add the auth header
    const xhr = new XMLHttpRequest();
    xhr.open("GET", form.action, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.responseType = "blob";
    
    xhr.onload = function() {
      if (this.status === 200) {
        // Create a link to download the PDF
        const blob = new Blob([this.response], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "payslip.pdf";
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error("Failed to generate payslip");
      }
      
      // Remove iframe
      document.body.removeChild(iframe);
    };
    
    xhr.onerror = function() {
      toast.error("Failed to generate payslip");
      document.body.removeChild(iframe);
    };
    
    xhr.send();
    return true;
  } catch (error) {
    console.error("Error generating payslip:", error);
    toast.error("Failed to generate payslip");
    return false;
  }
};

export const loginAsAdmin = async (username, password) => {
  console.log("Attempting admin login for:", username);
  try {
    const response = await API.post("/api/auth/login", { username, password, role: "Admin" });
    console.log("Admin login successful:", { ...response.data.user, password: undefined });
    return response;
  } catch (error) {
    console.error("Admin login failed:", error.response?.data || error.message);
    throw error;
  }
};

export const loginAsEmployee = async (username, password) => {
  console.log("Attempting employee login for:", username);
  try {
    const response = await API.post("/api/auth/login", { username, password, role: "Worker" });
    console.log("Employee login successful:", { ...response.data.user, password: undefined });
    return response;
  } catch (error) {
    console.error("Employee login failed:", error.response?.data || error.message);
    throw error;
  }
};

export const fetchUserProfile = () => 
  API.get("/api/users/profile");

export const applyForLeave = (leaveData) =>
  API.post("/api/leaves/apply", leaveData);

export const fetchMyLeaves = () =>
  API.get("/api/leaves/my-leaves");

export const fetchMyAttendance = () => 
  API.get("/api/attendance/my-attendance");

export const fetchMyPayInfo = () => 
  API.get("/api/payroll/my-pay");

export const fetchEmployeeProfile = () => 
  API.get("/api/employees/profile");

// Test function to validate authentication
export const testAuthentication = async () => {
  try {
    console.log("Testing authentication...");
    const response = await API.get("/api/test");
    console.log("Authentication test success:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Authentication test failed:", error);
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

export default API; 