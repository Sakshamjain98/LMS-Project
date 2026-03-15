import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/icons/logo.png";
import GoogleButton from "../../components/ui/GoogleButton.jsx";

const Signup = () => {
  const [role, setRole] = useState("student");

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
          Create Account
        </h2>

        <p className="mt-2 text-center text-sm text-gray-400 mb-8">
          Start your learning journey today
        </p>

        <div
          className="py-8 px-6 border border-white/10 shadow-2xl rounded-xl"
          style={cardBg}
        >

          {/* Role */}
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-3">
              I am a
            </label>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex-1 py-2 rounded-md border transition ${
                  role === "student"
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "text-gray-400 border-gray-700 hover:bg-dark-300"
                }`}
              >
                Student
              </button>

              <button
                type="button"
                onClick={() => setRole("educator")}
                className={`flex-1 py-2 rounded-md border transition ${
                  role === "educator"
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "text-gray-400 border-gray-700 hover:bg-dark-300"
                }`}
              >
                Educator
              </button>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-5">

            <div>
              <label className="text-sm text-gray-300">Full Name</label>

              <input
                type="text"
                className="mt-1 w-full px-3 py-2 bg-dark-300 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-brand-primary outline-none"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Email</label>

              <input
                type="email"
                className="mt-1 w-full px-3 py-2 bg-dark-300 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-brand-primary outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Password</label>

              <input
                type="password"
                className="mt-1 w-full px-3 py-2 bg-dark-300 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-brand-primary outline-none"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary py-2.5 rounded-md font-semibold hover:opacity-90 transition"
            >
              Create Account →
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 text-center text-gray-500 text-sm">
            or continue with
          </div>

          <GoogleButton />

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-primary hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Signup;