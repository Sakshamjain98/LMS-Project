import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../../assets/icons/logo.png";
import { resetPassword } from "../../services/authService";
import { Lock, Eye, EyeOff, Check } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const pageBg = { backgroundColor: "#0B0E13" };
  const cardBg = { backgroundColor: "#14181F" };

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      return "Password must include uppercase, lowercase, number, and special character";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await resetPassword({
        token,
        newPassword: formData.newPassword,
      });

      if (res.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        className="min-h-screen flex items-start justify-center px-6 pt-28"
        style={pageBg}
      >
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <img src={Logo} alt="logo" className="w-16 h-auto object-contain" />
          </div>

          <div
            className="py-8 px-6 border border-white/10 shadow-2xl rounded-xl text-center"
            style={cardBg}
          >
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              Invalid Reset Link
            </h2>

            <p className="text-gray-400 mb-6">
              The password reset link is invalid or has expired. Please request a new one.
            </p>

            <button
              onClick={() => navigate("/forgot-password")}
              className="w-full bg-brand-primary text-dark-400 py-3 rounded-lg font-bold hover:opacity-90 transition"
            >
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-start justify-center px-6 pt-28"
        style={pageBg}
      >
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <img src={Logo} alt="logo" className="w-16 h-auto object-contain" />
          </div>

          <div
            className="py-8 px-6 border border-white/10 shadow-2xl rounded-xl text-center"
            style={cardBg}
          >
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-500/20 rounded-full">
                <Check size={32} className="text-green-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
              Password Reset Successfully
            </h2>

            <p className="text-gray-400 mb-6">
              Your password has been changed. You can now log in with your new password.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="w-full bg-brand-primary text-dark-400 py-3 rounded-lg font-bold hover:opacity-90 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-start justify-center px-6 pt-28"
      style={pageBg}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-2">
          <img src={Logo} alt="logo" className="w-16 h-auto object-contain" />
        </div>

        <h2 className="text-center text-3xl font-bold text-white">
          Create New Password
        </h2>

        <p className="mt-2 text-center text-sm text-gray-400 mb-8">
          Enter a strong password to secure your account
        </p>

        <div
          className="py-8 px-6 border border-white/10 shadow-2xl rounded-xl"
          style={cardBg}
        >
          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* New Password */}
            <div>
              <label className="text-sm text-gray-300">New Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Min 8 chars, uppercase, number, special char"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-2 bg-dark-300 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-brand-primary outline-none transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Must contain: uppercase, lowercase, number, special character (@$!%*?&)
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm text-gray-300">Confirm Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-2 bg-dark-300 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-brand-primary outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showConfirm ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-dark-400 py-2.5 rounded-md font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
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
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          🔒 Your password is encrypted end-to-end
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
