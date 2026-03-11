import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import GoogleButton from '../components/GoogleButton';

const Signup = () => {
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const cardBg = { backgroundColor: '#14181F' };
  const pageBg = { backgroundColor: '#0B0E13' };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Signup', { role, fullName, email, password, confirmPassword });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={pageBg}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h2 className="text-center text-3xl font-bold text-white">
          Create Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Start your learning journey today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 border border-gray-800 shadow-2xl sm:rounded-xl sm:px-10" style={cardBg}>
          {/* Role selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              I am a
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-2 px-4 rounded-md border transition-colors ${
                  role === 'student'
                    ? 'bg-[#00A37E] text-white border-[#00A37E]'
                    : 'bg-transparent text-gray-400 border-gray-700 hover:bg-gray-800'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('educator')}
                className={`flex-1 py-2 px-4 rounded-md border transition-colors ${
                  role === 'educator'
                    ? 'bg-[#00A37E] text-white border-[#00A37E]'
                    : 'bg-transparent text-gray-400 border-gray-700 hover:bg-gray-800'
                }`}
              >
                Educator
              </button>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-[#1A1F26] border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00A37E] focus:border-[#00A37E]"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-[#1A1F26] border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00A37E] focus:border-[#00A37E]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-[#1A1F26] border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00A37E] focus:border-[#00A37E]"
                placeholder="********"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-[#00A37E] hover:bg-[#008f6f] transition-colors"
              >
                Create Account →
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500" style={cardBg}>or continue with</span>
              </div>
            </div>
            <div className="mt-6">
              <GoogleButton />
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#00A37E] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;