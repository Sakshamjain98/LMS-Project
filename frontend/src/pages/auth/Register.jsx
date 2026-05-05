import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/icons/logo.png";
import { registerUser } from "../../services/authService";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Navbar from "../../components/layout/Navbar";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (status.message) setStatus({ type: "", message: "" });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (formData.password.length < 8) errors.password = "Min. 8 characters required";
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";
    return errors;
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
      const payload = { ...formData, role: "student" };
      const res = await registerUser(payload);
      if (res.success) {
        setIsSuccess(true);
        setStatus({ type: "success", message: "Account created successfully!" });
      }
    } catch (err) {
      // Specifically catch "User already exists" (409 Conflict)
      setStatus({ 
        type: "error", 
        message: err.response?.data?.message || "Registration failed. Try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS VIEW: Replaces the form once registered
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-400">
        <div className="w-full max-w-md p-8 bg-dark-200 border border-dark-100 rounded-xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-500/10 rounded-full">
              <CheckCircle2 size={48} className="text-emerald-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Registration Complete!</h2>
          <p className="text-gray-400">
            Your student account is ready. You can now sign in to start learning.
          </p>
          <button 
            onClick={() => navigate("/login")}
            className="w-full py-3 btn-gradient rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            Go to Login <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-dark-400 pt-20">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-3">
            <img src={Logo} alt="logo" className="w-12 h-12 object-contain" />
          </div>

          <h2 className="text-center text-3xl font-black text-white mb-1">Create Account</h2>
          <p className="text-center text-sm text-gray-400 mb-8">Join thousands of learners today</p>

          <div className="bg-dark-200 border border-dark-100 rounded-xl p-8 space-y-6">
            {status.type === "error" && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <input type="text" name="name" placeholder="Full Name" onChange={handleChange} className="w-full px-4 py-2.5 bg-dark-300 border border-dark-100 rounded-lg text-white" />
              {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
              
              <input type="email" name="email" placeholder="Email" onChange={handleChange} className="w-full px-4 py-2.5 bg-dark-300 border border-dark-100 rounded-lg text-white" />
              {fieldErrors.email && <p className="text-xs text-red-400">{fieldErrors.email}</p>}

              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" onChange={handleChange} className="w-full px-4 py-2.5 bg-dark-300 border border-dark-100 rounded-lg text-white" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-500"><Eye size={18}/></button>
              </div>
              
              <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} className="w-full px-4 py-2.5 bg-dark-300 border border-dark-100 rounded-lg text-white" />
              {fieldErrors.confirmPassword && <p className="text-xs text-red-400">{fieldErrors.confirmPassword}</p>}

              <button type="submit" disabled={loading} className="w-full py-2.5 btn-gradient rounded-lg font-bold">
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400">
              Already have an account? <Link to="/login" className="text-brand-primary font-semibold">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;