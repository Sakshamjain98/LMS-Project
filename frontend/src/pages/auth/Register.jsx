import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/icons/logo.png";
import { registerUser, googleAuth } from "../../services/authService";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "../../components/layout/Navbar";

const Register = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = "Password must contain an uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = "Password must contain a lowercase letter";
    } else if (!/\d/.test(formData.password)) {
      errors.password = "Password must contain a number";
    } else if (!/[@$!%*?&]/.test(formData.password)) {
      errors.password = "Password must contain a special character (@$!%*?&)";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: role === "educator" ? "teacher" : "student",
      };

      const res = await registerUser(payload);

      if (res.success) {
        alert("Account created successfully! Please log in.");
        navigate("/login");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
        role: role === "educator" ? "teacher" : "student",
      });

      if (res.success) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("userRole", res.user.role);
        localStorage.setItem("userEmail", res.user.email);

        navigate(
          res.user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"
        );
      }
    } catch (err) {
      setError(err.message || "Google signup failed");
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
            Create Account
          </h2>
          <p className="text-center text-sm text-gray-400 mb-8">
            Join thousands of learners today
          </p>

          {/* Card */}
          <div className="bg-dark-200 border border-dark-100 rounded-xl p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wide">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "student", label: "Student" },
                  { value: "educator", label: "Educator" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value)}
                    className={`py-2.5 px-4 rounded-lg font-semibold transition border ${
                      role === option.value
                        ? "bg-brand-primary text-dark-400 border-brand-primary"
                        : "bg-dark-300 text-gray-300 border-dark-100 hover:border-dark-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-dark-300 border rounded-lg text-white placeholder-gray-500 transition outline-none ${
                    fieldErrors.name
                      ? "border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-dark-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>
                )}
              </div>

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
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Password
                </label>
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 pr-10 bg-dark-300 border rounded-lg text-white placeholder-gray-500 transition outline-none ${
                      fieldErrors.confirmPassword
                        ? "border-red-500 focus:ring-1 focus:ring-red-500"
                        : "border-dark-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Sign Up Button */}
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
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
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

            {/* Login Link */}
            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-brand-primary font-semibold hover:text-brand-primaryDark transition"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Security Badge */}
          <p className="text-center text-xs text-gray-600 mt-6">
            🔒 Your data is encrypted and secure
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;