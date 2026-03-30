import { useEffect, useState } from "react";
import { getStudentProfile, updateStudentProfile } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { Save, X, Loader2, Calendar, Crown, User, Mail, Phone, Info } from "lucide-react";

export default function StudentProfile() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
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
      setSubscription(res.subscription);
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
      await updateStudentProfile(formData);
      setUser(formData); // Update displayed user data
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

  // Format date for subscription expiry
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Subscription badge and details
  const isSubscribed = subscription && subscription.status === "ACTIVE" && subscription.plan !== "FREE";
  const planName = subscription?.plan === "YEARLY" ? "Annual Plan" : subscription?.plan === "MONTHLY" ? "Monthly Plan" : "Premium";
  const expiryDate = subscription?.endDate ? formatDate(subscription.endDate) : null;

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className="bg-dark-400 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-brand-primary" size={32} />
            <p className="text-gray-400 text-sm">Loading your profile...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentNavbar />
      <div className="bg-dark-400 min-h-screen p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            {isSubscribed && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 rounded-full border border-brand-primary/20">
                <Crown size={14} className="text-brand-primary" />
                <span className="text-xs font-semibold text-brand-primary">Subscribed</span>
              </div>
            )}
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg p-3 text-sm mb-4">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm mb-4 flex justify-between items-center">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Form Card */}
            <div className="lg:col-span-2 bg-dark-200 border border-dark-100 rounded-lg p-5 space-y-5">
              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-1.5">
                  <User size={12} /> Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-lg text-sm text-white focus:border-brand-primary outline-none transition"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-1.5">
                  <Mail size={12} /> Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email || ""}
                  className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-lg text-sm text-gray-500 outline-none opacity-60 cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-1.5">
                  <Phone size={12} /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="+91 12345 67890"
                  className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-lg text-sm text-white focus:border-brand-primary outline-none transition"
                />
              </div>

              {/* Role (read-only) */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-1.5">
                  <Info size={12} /> Account Type
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.role?.toUpperCase() || "STUDENT"}
                  className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-lg text-sm text-gray-500 outline-none opacity-60 cursor-not-allowed"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-dark-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-dark-400 rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-dark-300 text-white rounded-lg text-sm font-semibold hover:bg-dark-100 transition border border-dark-100"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>

            {/* Subscription Details Card */}
            <div className="bg-dark-200 border border-dark-100 rounded-lg p-5 space-y-4">
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}