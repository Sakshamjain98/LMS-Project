import { useEffect, useState } from "react";
import { getStudentProfile, updateStudentProfile } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { Save, X, Loader2, Calendar, User, Mail, Phone, Info } from "lucide-react";

export default function StudentProfile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getStudentProfile();
      // The API response includes both user and subscription
      setUser(res.user);
      setFormData(res.user);
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Simple validation
    if (!formData.name?.trim()) {
      setError("Name is required");
      return;
    }
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      setError("Please enter a valid phone number");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const res = await updateStudentProfile(formData);
      const updatedUser = res?.user || formData;
      setUser(updatedUser);
      setFormData(updatedUser);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setError("");
  };

  const userInitials = (formData.name || "Student")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (loading) {
    return (
      <div className="bg-dark-400 min-h-screen flex flex-col relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-brand-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-brand-primary/20 blur-3xl" />
        <StudentNavbar />
        <div className="flex-1 flex items-center justify-center px-4 md:px-6 py-6">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-dark-200/70 px-8 py-7 backdrop-blur-md shadow-2xl">
            <Loader2 className="animate-spin text-brand-primary" size={34} />
            <p className="text-gray-300 text-sm tracking-wide">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-400 min-h-screen flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-brand-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-brand-primary/20 blur-3xl" />
      <StudentNavbar />
      <div className="flex-1 flex items-center justify-center px-4 md:px-6 py-6">
        <div className="max-w-3xl w-full relative z-10">
          <div className="mb-4">
            <p className="text-brand-primary/90 text-xs md:text-sm font-semibold tracking-[0.18em] uppercase mb-2">Student Dashboard</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">My Profile</h1>
            </div>
            <p className="text-gray-400 text-sm mt-2">Keep your profile polished and up to date.</p>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-xl p-3 text-sm mb-4">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 text-sm mb-4 flex justify-between items-center">
              <span>{error}</span>
              {error.includes("Failed to load") && (
                <button
                  onClick={fetchProfile}
                  className="text-xs underline hover:opacity-80"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          <div className="flex justify-center">
            {/* Profile Form Card */}
            <div className="w-full bg-dark-200/75 border border-white/10 rounded-2xl p-5 md:p-7 space-y-6 backdrop-blur-md shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-dark-300/70 p-4 md:p-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-brand-primary flex items-center justify-center text-dark-400 text-lg font-bold shadow-lg shadow-brand-primary/20">
                    {userInitials || "S"}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg leading-tight">{formData.name || "Student"}</p>
                    <p className="text-gray-400 text-sm">{formData.email || "No email available"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 w-fit">
                  <Calendar size={12} className="text-gray-400" />
                  Student Account
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">
                  <User size={12} /> Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-dark-300/80 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">
                    <Mail size={12} /> Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={formData.email || ""}
                    className="w-full px-3.5 py-2.5 bg-dark-300/70 border border-white/10 rounded-xl text-sm text-gray-400 outline-none opacity-80 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">
                  <Phone size={12} /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="+91 12345 67890"
                  className="w-full px-3.5 py-2.5 bg-dark-300/80 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition"
                />
              </div>

              {/* Role (read-only) */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">
                  <Info size={12} /> Account Type
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.role?.toUpperCase() || "STUDENT"}
                  className="w-full px-3.5 py-2.5 bg-dark-300/70 border border-white/10 rounded-xl text-sm text-gray-400 outline-none opacity-80 cursor-not-allowed"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-dark-400 rounded-xl text-sm font-semibold shadow-lg shadow-brand-primary/20 hover:brightness-110 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-300/80 text-white rounded-xl text-sm font-semibold hover:bg-dark-100 transition border border-white/10"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>

            {/* Subscription Details Card */}
            {/* <div className="bg-dark-200 border border-dark-100 rounded-lg p-5 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Crown size={18} className="text-brand-primary" />
                Subscription
              </h2>

              {isSubscribed ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-dark-100 pb-2">
                      <span className="text-sm text-gray-400">Plan</span>
                      <span className="text-sm font-semibold text-white">{planName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-dark-100 pb-2">
                      <span className="text-sm text-gray-400">Status</span>
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                        Active
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-dark-100 pb-2">
                      <span className="text-sm text-gray-400">Expires on</span>
                      <span className="text-sm text-white flex items-center gap-1">
                        <Calendar size={12} className="text-gray-500" />
                        {expiryDate}
                      </span>
                    </div>
                    {subscription?.autoRenew && (
                      <div className="text-xs text-gray-500 mt-2">
                        Auto‑renewal enabled
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => window.location.href = "/#pricing"}
                    className="w-full mt-4 py-2 text-center text-sm font-semibold text-brand-primary border border-brand-primary/30 rounded-lg hover:bg-brand-primary/10 transition"
                  >
                    Manage Subscription
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm mb-3">You are on the Free plan</p>
                  <a
                    href="/#pricing"
                    className="inline-block px-4 py-2 bg-brand-primary text-dark-400 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                  >
                    Upgrade to Premium
                  </a>
                </div>
              )}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}