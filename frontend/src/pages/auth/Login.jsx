import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/icons/logo.png";
import { loginUser, googleAuth } from "../../services/authService";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "../../components/layout/Navbar";

const Login = () => {
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" }); // {type: 'error' | 'success', message: ''}
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (status.message) setStatus({ type: "", message: "" });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.password) errors.password = "Password is required";
    return errors;
  };

  const handleAuthSuccess = (res) => {
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    localStorage.setItem("userRole", res.user.role);
    localStorage.setItem("userEmail", res.user.email);

    const routes = {
      admin: "/admin/dashboard",
      teacher: "/teacher/dashboard",
      student: "/student/dashboard",
    };
    navigate(routes[res.user.role] || "/student/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const res = await loginUser(formData);
      if (res.success) {
        handleAuthSuccess(res);
      }
    } catch (err) {
      // Handles 401, 403 (Teacher Approval), and 500 errors
      setStatus({ 
        type: "error", 
        message: err.response?.data?.message || err.message || "Invalid credentials" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setGoogleLoading(true);
      setStatus({ type: "", message: "" });
      const res = await googleAuth({
        token: credentialResponse.credential,
        role: "student",
      });
      if (res.success) handleAuthSuccess(res);
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Google login failed" });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-dark-400 pt-20">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-3">
            <img src={Logo} alt="logo" className="w-12 h-12 object-contain" />
          </div>

          <h2 className="text-center text-3xl font-black text-white mb-1">Welcome Back</h2>
          <p className="text-center text-sm text-gray-400 mb-8">Sign in to continue learning</p>

          <div className="bg-dark-200 border border-dark-100 rounded-xl p-8 space-y-6">
            {/* Custom Status Message Box */}
            {status.message && (
              <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                status.type === "error" 
                  ? "bg-red-500/10 border-red-500/20 text-red-400" 
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}>
                {status.type === "error" ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-dark-300 border rounded-lg text-white placeholder-gray-500 transition outline-none ${
                    fieldErrors.email ? "border-red-500 focus:ring-1-red-500" : "border-dark-100 focus:border-brand-primary"
                  }`}
                />
                {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-300">Password</label>
                  <Link to="/forgot-password" size={18} className="text-xs text-brand-primary hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-dark-300 border rounded-lg text-white placeholder-gray-500 transition outline-none ${
                      fieldErrors.password ? "border-red-500 focus:ring-1-red-500" : "border-dark-100 focus:border-brand-primary"
                    }`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-primary text-dark-400 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-100" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-dark-200 text-gray-500">or continue with</span></div>
            </div>

            <div className="flex justify-center">
              {!googleClientId ? (
                <p className="text-xs text-gray-500 text-center">Google login is currently unavailable.</p>
              ) : googleLoading ? (
                <div className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
              ) : (
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setStatus({type: "error", message: "Google Auth Failed"})} theme="dark" />
              )}
            </div>

            <p className="text-center text-sm text-gray-400">
              Don't have an account? <Link to="/register" className="text-brand-primary font-semibold">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;