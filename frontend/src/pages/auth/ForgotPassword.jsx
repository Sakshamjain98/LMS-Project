import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/icons/logo.png";
import { forgotPassword } from "../../services/authService";
import { Mail, ArrowLeft, Check } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const pageBg = { backgroundColor: "#0B0E13" };
  const cardBg = { backgroundColor: "#14181F" };

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await forgotPassword({ email });

      if (res.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(
        err.message ||
          "Failed to send reset email. Please check your email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
              Email Sent Successfully
            </h2>

            <p className="text-gray-400 mb-6">
              We've sent a password reset link to
              <br />
              <strong className="text-white">{email}</strong>
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 text-sm text-blue-300">
              <p>
                ℹ️ Check your email (including spam folder) for a link to reset your password. The link expires in 1 hour.
              </p>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="w-full btn-gradient py-3 rounded-lg font-bold hover:opacity-90 transition mb-4"
            >
              Back to Login
            </button>

            <p className="text-sm text-gray-400">
              Didn't receive an email?{" "}
              <button
                onClick={() => setSuccess(false)}
                className="text-brand-primary hover:text-brand-primaryDark font-medium"
              >
                Try again
              </button>
            </p>
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
          Reset Password
        </h2>

        <p className="mt-2 text-center text-sm text-gray-400 mb-8">
          Enter your email and we'll send you a password reset link
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
            <div>
              <label className="text-sm text-gray-300">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 bg-dark-300 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-brand-primary outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-2.5 rounded-md font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
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
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="mt-6">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-brand-primary hover:text-brand-primaryDark transition text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          🔒 Your email is safe with us
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
