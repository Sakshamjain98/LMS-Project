import { useState } from "react";
import { createAdmin } from "../../services/adminService";
import toast from "react-hot-toast";
import { Loader2, UserPlus } from "lucide-react";

export default function CreateAdmin() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error("Please fill all fields");
    }

    try {
      setLoading(true);
      const res = await createAdmin(formData);
      toast.success(res.message || "Admin created successfully!");
      setFormData({ name: "", email: "", password: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Admin</h1>
        <p className="text-grayCustom-medium mt-1 text-sm font-medium">
          Add a new admin to the system.
        </p>
      </div>

      {/* Form */}
      <div className="bg-dark-200 border border-dark-100 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-dark-300/50 px-6 py-4 border-b border-dark-100 flex items-center gap-2">
          <UserPlus className="text-brand-primary" size={18} />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">New Admin</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-grayCustom-medium uppercase ml-1">Name</label>
            <input
              type="text"
              placeholder="Enter admin name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-dark-400 border border-dark-100 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-grayCustom-medium uppercase ml-1">Email</label>
            <input
              type="email"
              placeholder="Enter admin email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-dark-400 border border-dark-100 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-grayCustom-medium uppercase ml-1">Password</label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-dark-400 border border-dark-100 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
          <div className="flex justify-end">
            <button
              disabled={loading}
              className="bg-brand-primary hover:bg-brand-primaryDark text-dark-400 font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/10 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}