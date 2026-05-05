import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTestSeriesTopic } from "../../services/teacherService";
import { ChevronLeft, AlertCircle, CheckCircle } from "lucide-react";

export default function CreateTest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      setError("Test title is required");
      return false;
    }

    if (form.title.trim().length < 3) {
      setError("Test title must be at least 3 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
      };

      await createTestSeriesTopic(payload);

      setSuccess("Topic created successfully! Redirecting...");
      
      setTimeout(() => {
        navigate("/teacher/tests");
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to create topic";
      setError(errorMsg);
      console.error("Create topic error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-6 space-y-5">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/teacher/tests")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-medium text-sm"
        >
          <ChevronLeft size={18} />
          Back to Tests
        </button>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">Create New Topic</h1>
        <p className="text-white/50 mt-2 text-sm font-medium">Start your test series with a topic</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-emerald-400 text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-dark-200 border border-white/5 rounded-lg p-6 space-y-5">
        {/* Title */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
          <label className="block text-sm font-semibold text-white mb-2">Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Class 12 Biology"
            className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm"
          />
          </div>

          {/* Description */}
          <div>
          <label className="block text-sm font-semibold text-white mb-2">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="2"
            placeholder="Topic overview and scope..."
            className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none text-sm"
          />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 bg-brand-primary text-black rounded-lg font-semibold hover:brightness-110 disabled:opacity-50 transition-all text-sm disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Test"}
          </button>
          <button
            onClick={() => navigate("/teacher/tests")}
            className="px-5 py-2.5 bg-white/5 text-white rounded-lg font-semibold hover:bg-white/10 transition text-sm"
          >
            {loading ? "Creating Topic..." : "Create Topic"}
          </button>
        </div>
      </div>

    </div>
  );
}