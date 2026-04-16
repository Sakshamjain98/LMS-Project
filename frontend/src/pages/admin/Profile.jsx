import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Save, ShieldUser, UserCircle2 } from "lucide-react";
import {
  changeAdminPassword,
  getAdminProfile,
  updateAdminProfile,
} from "../../services/adminService";

const initialProfile = {
  name: "",
  email: "",
  phone: "",
  avatar: "",
};

export default function AdminProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await getAdminProfile();
        setProfile({
          name: res.profile?.name || "",
          email: res.profile?.email || "",
          phone: res.profile?.phone || "",
          avatar: res.profile?.avatar || "",
        });
      } catch (error) {
        toast.error(error?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await updateAdminProfile(profile);
      setProfile({
        name: res.profile?.name || "",
        email: res.profile?.email || "",
        phone: res.profile?.phone || "",
        avatar: res.profile?.avatar || "",
      });

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          name: res.profile?.name || storedUser.name,
          email: res.profile?.email || storedUser.email,
          phone: res.profile?.phone || storedUser.phone,
          avatar: res.profile?.avatar || storedUser.avatar,
        })
      );

      toast.success(res.message || "Profile updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setSavingPassword(true);
      const res = await changeAdminPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success(res.message || "Password changed");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <p className="text-grayCustom-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Profile</h1>
        <p className="text-grayCustom-medium mt-1 text-sm font-medium">Update your account details and password.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <form
          onSubmit={handleProfileSave}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-4"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <ShieldUser size={18} className="text-brand-primary" />
            Profile Details
          </h2>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">Name</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">Phone</label>
            <input
              value={profile.phone}
              onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">Avatar URL</label>
            <input
              value={profile.avatar}
              onChange={(e) => setProfile((prev) => ({ ...prev, avatar: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
              placeholder="Optional"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 font-bold text-dark-400 hover:bg-brand-primaryDark disabled:opacity-60"
          >
            <Save size={16} />
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <form
          onSubmit={handlePasswordSave}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-4"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <KeyRound size={18} className="text-brand-primary" />
            Change Password
          </h2>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 font-bold text-dark-400 hover:bg-brand-primaryDark disabled:opacity-60"
          >
            <UserCircle2 size={16} />
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
