import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { loginAsAdmin, loginAsEmployee } from "../services/api";
import { toast } from "react-toastify";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("admin");
  const [form, setForm] = useState({ id: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let res;
      console.log(`Attempting to log in as ${role} with username: ${form.id}`);
      
      if (role === "admin") {
        res = await loginAsAdmin(form.id, form.password);
        console.log("Admin login response:", res.data);
        
        // Verify the response contains necessary data
        if (!res.data.token) {
          throw new Error("Server response missing token");
        }
        
        if (!res.data._id) {
          console.warn("Server response missing _id, using any available ID");
        }
        
  // Get role from server response, ensuring proper case sensitivity
  const userRole = res.data.role;
  
  if (!userRole) {
    console.error("Server response missing role:", res.data);
    throw new Error("Server response missing role");
  }

  console.log("Login successful, token:", res.data.token.substring(0, 10) + "...");
  console.log("Full server response:", res.data);
  console.log("User data:", { id: res.data._id, role: userRole });
  toast.info(`Logged in as ${userRole}`);
        
        // Store the token in localStorage
        localStorage.setItem('token', res.data.token);
        
        // Create a user object with all necessary data
        const userData = { 
          id: res.data._id || res.data.id || '', // Use _id from server response
          _id: res.data._id || res.data.id || '', // Also store as _id for compatibility
          name: res.data.username,
          username: res.data.username, // For consistency
          token: res.data.token,
          role: userRole // Use backend role string (e.g. 'Admin', 'Manager', 'Worker')
        };
        
        // Store the complete user object in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Store username separately for components that need it
        localStorage.setItem('username', res.data.username);
        
        // Update the auth context
        login(userData);
        
        // Only Admins go to admin dashboard, everyone else goes to employee portal
        if (userRole.toLowerCase() === 'admin') {
          console.log("Admin user - navigating to admin dashboard...");
          toast.success(`Login successful! Redirecting to admin dashboard...`);
          setTimeout(() => {
            setLoading(false);
            navigate('/admin', { replace: true });
          }, 100);
        } else {
          console.log(`${userRole} user - navigating to employee portal...`);
          toast.success(`Login successful! Redirecting to employee portal...`);
          setTimeout(() => {
            setLoading(false);
            navigate('/employee', { replace: true });
          }, 100);
        }
      } else {
        res = await loginAsEmployee(form.id, form.password);
        console.log("Employee login response:", res.data);
        
        // Verify the response contains necessary data
        if (!res.data.token) {
          throw new Error("Server response missing token");
        }
        
        if (!res.data._id) {
          console.warn("Server response missing _id, using any available ID");
        }

        // Get role from server response
        const employeeRole = res.data.role;
        if (!employeeRole) {
          console.error("Server response missing role:", res.data);
          throw new Error("Server response missing role");
        }

        console.log("Employee logged in with role:", employeeRole);
        console.log("Full employee login response:", res.data);
        toast.info(`Logged in as ${employeeRole}`);
        
        // Store the token in localStorage
        localStorage.setItem('token', res.data.token);
        
        // Create a user object with all necessary data
        const userData = { 
          id: res.data._id || res.data.id || '',
          _id: res.data._id || res.data.id || '',
          name: res.data.username,
          username: res.data.username,
          token: res.data.token,
          role: employeeRole
        };
        
        console.log("Setting user data in localStorage:", userData);
        
        // Store the complete user object in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update the auth context
        console.log("Updating auth context with:", userData);
        login(userData);
        
        // Navigate based on role
        console.log("Checking navigation for role:", employeeRole);
        
        // All employee logins go to employee portal
        // (Workers, Supervisors, and Managers all use the employee interface)
        console.log("Navigating to employee portal at /employee...");
        toast.success(`Login successful! Redirecting to employee portal...`);
        
        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          setLoading(false);
          navigate('/employee', { replace: true });
        }, 100);
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error details:", err.response?.data);
      toast.error(err.response?.data?.message || "Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">Sadhna Construction</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
          
          <div className="mt-4">
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Register as Worker
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    role === "admin" 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                  onClick={() => setRole("admin")}
                >
                  Admin Login
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    role === "employee" 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                  onClick={() => setRole("employee")}
                >
                  Employee Login
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  {role === "admin" ? "Admin Username" : "Employee Username"}
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    type="text"
                    placeholder={role === "admin" ? "Enter admin username" : "Enter employee ID"}
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 sm:px-10">
            <p className="text-xs text-center text-gray-500">
              © {new Date().getFullYear()} Sadhna Construction. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 