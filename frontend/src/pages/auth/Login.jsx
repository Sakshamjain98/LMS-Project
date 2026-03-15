import React from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/icons/logo.png";
import GoogleButton from "../../components/ui/GoogleButton.jsx";

const Login = () => {
  const cardBg = { backgroundColor: "#14181F" };
  const pageBg = { backgroundColor: "#0B0E13" };

  return (
    <div
      className="min-h-screen flex items-start justify-center px-6 pt-28"
      style={pageBg}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img
            src={Logo}
            alt="logo"
            className="w-16 h-auto object-contain"
          />
        </div>

        <h2 className="text-center text-3xl font-bold text-white">
          Welcome Back
        </h2>

        <p className="mt-2 text-center text-sm text-gray-400 mb-8">
          Sign in to continue learning
        </p>

        <div
          className="py-8 px-6 border border-white/10 shadow-2xl rounded-xl"
          style={cardBg}
        >

          {/* Form */}
          <form className="space-y-5">

            {/* Email */}
            <div>
              <label className="text-sm text-gray-300">Email</label>

              <input
                type="email"
                placeholder="you@example.com"
                className="mt-1 w-full px-3 py-2 bg-dark-300 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-300">Password</label>

              <input
                type="password"
                placeholder="********"
                className="mt-1 w-full px-3 py-2 bg-dark-300 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>

            {/* Forgot Password */}
            <div className="text-right text-sm">
              <Link
                to="/forgot-password"
                className="text-brand-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full bg-brand-primary py-2.5 rounded-md font-semibold hover:opacity-90 transition"
            >
              Sign In →
            </button>

          </form>

          {/* Divider */}
          <div className="my-6 text-center text-gray-500 text-sm">
            or continue with
          </div>

          <GoogleButton />

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-brand-primary hover:underline">
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;