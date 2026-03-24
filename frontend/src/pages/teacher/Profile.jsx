import { useState, useEffect } from "react";
import { getTeacherProfile, updateTeacherProfile, getMyCourses, getTeacherTests, getTeacherNotes } from "../../services/teacherService";
import { ChevronLeft, Edit, Save, X, AlertCircle, CheckCircle, Camera, Mail, BookOpen, FileText, Clipboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TeacherProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    _id: "",
    name: "",
    email: "",
    avatar: "",
  });

  const [stats, setStats] = useState({
    totalCourses: 0,
    totalTests: 0,
    totalNotes: 0,
  });

  const [editForm, setEditForm] = useState({
    name: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Fetch profile and stats from actual backend
  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all data in parallel
        const [profileRes, coursesRes, testsRes, notesRes] = await Promise.all([
          getTeacherProfile().catch(err => {
            console.error("Profile fetch error:", err);
            throw err;
          }),
          getMyCourses().catch(err => {
            console.error("Courses fetch error:", err);
            return { courses: [] };
          }),
          getTeacherTests().catch(err => {
            console.error("Tests fetch error:", err);
            return { tests: [] };
          }),
          getTeacherNotes().catch(err => {
            console.error("Notes fetch error:", err);
            return { notes: [] };
          }),
        ]);

        // Extract user from response - only name, email, avatar
        const userData = profileRes?.user || profileRes || {};
        
        setProfile({
          _id: userData._id || "",
          name: userData.name || "",
          email: userData.email || "",
          avatar: userData.avatar || "",
        });

        setAvatarPreview(userData.avatar || "");
        
        setEditForm({
          name: userData.name || "",
        });

        // ✅ Set actual stats from API responses
        setStats({
          totalCourses: Array.isArray(coursesRes?.courses) ? coursesRes.courses.length : 0,
          totalTests: Array.isArray(testsRes?.tests) ? testsRes.tests.length : 0,
          totalNotes: Array.isArray(notesRes?.notes) ? notesRes.notes.length : 0,
        });
      } catch (err) {
        const errorMsg = err?.message || err?.data?.message || "Failed to load profile";
        setError(errorMsg);
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndStats();
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: editForm.name.trim(),
      };

      // ✅ Handle avatar upload with FormData if file exists
      let updateData = payload;
      
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        Object.entries(payload).forEach(([key, value]) => {
          formData.append(key, value);
        });
        updateData = formData;
      }

      const res = await updateTeacherProfile(updateData);
      const updatedUser = res?.user || res;
      
      setProfile({
        _id: updatedUser._id || profile._id,
        name: updatedUser.name || "",
        email: updatedUser.email || profile.email,
        avatar: updatedUser.avatar || "",
      });

      setAvatarFile(null);
      setAvatarPreview(updatedUser.avatar || "");
      setEditing(false);
      setSuccess("Profile updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMsg = err?.message || err?.data?.message || "Failed to update profile";
      setError(errorMsg);
      console.error("Update error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: profile.name || "",
    });
    setAvatarFile(null);
    setAvatarPreview(profile.avatar || "");
    setEditing(false);
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-300 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/teacher/dashboard")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-medium"
          >
            <ChevronLeft size={20} />
            Back to Dashboard
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-400/70 hover:text-red-400"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-400 text-sm font-medium">{success}</p>
            <button
              onClick={() => setSuccess("")}
              className="text-emerald-400/70 hover:text-emerald-400 ml-auto"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-dark-200 border border-white/5 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 border border-brand-primary/20 flex items-center justify-center overflow-hidden">
                  {avatarPreview || profile.avatar ? (
                    <img
                      src={avatarPreview || profile.avatar}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-5xl font-bold text-brand-primary">
                      {profile.name?.charAt(0)?.toUpperCase() || "T"}
                    </div>
                  )}
                </div>
                {editing && (
                  <label className="absolute bottom-0 right-0 p-2.5 bg-brand-primary text-black rounded-full hover:brightness-110 transition cursor-pointer">
                    <Camera size={18} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
                {!editing && (
                  <button className="absolute bottom-0 right-0 p-2.5 bg-brand-primary text-black rounded-full hover:brightness-110 transition opacity-0 group-hover:opacity-100">
                    <Camera size={18} />
                  </button>
                )}
              </div>
              {editing && avatarFile && (
                <p className="text-xs text-brand-primary font-medium">New avatar selected</p>
              )}
              {!editing && (
                <p className="text-xs text-white/40 font-medium">Click to change avatar</p>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {!editing ? (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-1">{profile.name || "Teacher"}</h1>
                      <p className="text-brand-primary font-medium">Teacher Account</p>
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-black rounded-lg font-semibold hover:brightness-110 transition-all text-sm"
                    >
                      <Edit size={16} />
                      Edit Profile
                    </button>
                  </div>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Mail size={18} className="text-brand-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Email</p>
                        <p className="text-white mt-1">{profile.email || "—"}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

                  <div className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-2.5 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 border-t border-white/5">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-black rounded-lg font-semibold hover:brightness-110 disabled:opacity-50 transition-all text-sm"
                      >
                        <Save size={16} />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 bg-white/5 text-white rounded-lg font-semibold hover:bg-white/10 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards - ACTUAL DATA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={<BookOpen className="text-blue-400" size={24} />}
            title="Courses Created"
            value={stats.totalCourses}
            description={stats.totalCourses === 1 ? "course created" : "courses created"}
          />
          <StatCard
            icon={<Clipboard className="text-purple-400" size={24} />}
            title="Tests Created"
            value={stats.totalTests}
            description={stats.totalTests === 1 ? "test created" : "tests created"}
          />
          <StatCard
            icon={<FileText className="text-emerald-400" size={24} />}
            title="Notes Uploaded"
            value={stats.totalNotes}
            description={stats.totalNotes === 1 ? "note uploaded" : "notes uploaded"}
          />
        </div>
      </div>
    </div>
  );
}

// ✅ Professional Statistics Card Component
function StatCard({ icon, title, value, description }) {
  return (
    <div className="bg-dark-200 border border-white/5 rounded-2xl p-6 hover:border-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300 group">
      <div className="w-14 h-14 rounded-xl bg-white/5 group-hover:bg-brand-primary/10 flex items-center justify-center mb-5 transition-colors">
        {icon}
      </div>

      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-2">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-4xl font-bold text-white">{value}</h3>
        </div>
        <p className="text-xs text-white/40 mt-3">
          {description}
        </p>
      </div>

      <div className="h-1 bg-gradient-to-r from-brand-primary/50 to-transparent rounded-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
}
