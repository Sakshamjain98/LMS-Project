import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/icons/logo.png";
import { loginUser, googleAuth } from "../../services/authService";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "../../components/layout/Navbar";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setFieldErrors({});

      const res = await loginUser(formData);

      if (res.success) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("userRole", res.user.role);
        localStorage.setItem("userEmail", res.user.email);

        if (res.user.role === "teacher") {
          navigate("/teacher/dashboard");
        } else if (res.user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      }
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setGoogleLoading(true);
      setError("");

      const res = await googleAuth({
        token: credentialResponse.credential,
        role: "student",
      });

      if (res.success) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("userRole", res.user.role);
        localStorage.setItem("userEmail", res.user.email);

        if (res.user.role === "teacher") {
          navigate("/teacher/dashboard");
        } else if (res.user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      }
    } catch (err) {
      setError(err.message || "Google authentication failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google authentication failed. Please try again.");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-dark-400 pt-20">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <img src={Logo} alt="logo" className="w-12 h-12 object-contain" />
          </div>

          {/* Heading */}
          <h2 className="text-center text-3xl font-black text-white mb-1">
            Welcome Back
          </h2>
          <p className="text-center text-sm text-gray-400 mb-8">
            Sign in to continue learning
          </p>

          {/* Card */}
          <div className="bg-dark-200 border border-dark-100 rounded-xl p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-dark-300 border rounded-lg text-white placeholder-gray-500 transition outline-none ${
                    fieldErrors.email
                      ? "border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-dark-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-brand-primary hover:text-brand-primaryDark transition"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 pr-10 bg-dark-300 border rounded-lg text-white placeholder-gray-500 transition outline-none ${
                      fieldErrors.password
                        ? "border-red-500 focus:ring-1 focus:ring-red-500"
                        : "border-dark-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-primary text-dark-400 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-100" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-200 text-gray-500">
                  or continue with
                </span>
              </div>
            </div>

            {/* Google Auth */}
            <div className="flex justify-center">
              {googleLoading ? (
                <div className="animate-spin h-10 w-10 border-2 border-brand-primary border-t-transparent rounded-full" />
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="dark"
                />
              )}
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-brand-primary font-semibold hover:text-brand-primaryDark transition"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Security Badge */}
          <p className="text-center text-xs text-gray-600 mt-6">
            🔒 Your login is secure and encrypted
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;