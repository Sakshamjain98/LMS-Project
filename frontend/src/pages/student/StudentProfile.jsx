import { useEffect, useState } from "react";
import { getStudentProfile, updateStudentProfile } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { Save, X } from "lucide-react";

export default function StudentProfile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getStudentProfile();
        setUser(res.user);
        setFormData(res.user);
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateStudentProfile(formData);
      setUser(formData);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className="flex items-center justify-center h-96">
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentNavbar />
      <div className="bg-dark-400 min-h-screen p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Profile</h1>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="bg-dark-200 border border-dark-100 rounded-lg p-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-lg text-sm text-white focus:border-brand-primary outline-none transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                disabled
                value={formData.email || ""}
                className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-lg text-sm text-gray-500 outline-none opacity-60 cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-lg text-sm text-white focus:border-brand-primary outline-none transition"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Account Type</label>
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
                <Save size={14} />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setFormData(user)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-dark-300 text-white rounded-lg text-sm font-semibold hover:bg-dark-100 transition border border-dark-100"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
