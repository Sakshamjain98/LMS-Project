import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTeacherTest } from "../../services/teacherService";
import { ChevronLeft, AlertCircle, CheckCircle } from "lucide-react";

export default function CreateTest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: 60,
    passingMarks: 0,
    instructions: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "duration" || name === "passingMarks" ? parseInt(value) || 0 : value,
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

    if (form.duration <= 0) {
      setError("Duration must be greater than 0");
      return false;
    }

    if (form.passingMarks < 0) {
      setError("Passing marks cannot be negative");
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
        duration: form.duration,
        passingMarks: form.passingMarks,
        instructions: form.instructions.trim(),
      };

      const response = await createTeacherTest(payload);
      
      // ✅ FIX: Handle both response structures
      const testId = response.test?._id || response.data?.test?._id;
      
      if (!testId) {
        throw new Error("Failed to create test - no ID returned");
      }

      setSuccess("Test created successfully! Redirecting...");
      
      setTimeout(() => {
        navigate(`/teacher/tests/${testId}`);
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to create test";
      setError(errorMsg);
      console.error("Create test error:", err);
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
        <h1 className="text-3xl font-bold text-white">Create New Test</h1>
        <p className="text-white/50 mt-2 text-sm font-medium">Set up basic test details</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
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
            placeholder="e.g. Biology Final Exam"
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
            placeholder="Test description and details..."
            className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none text-sm"
          />
          </div>
        </div>

        {/* Duration & Passing Marks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Duration (minutes) *</label>
            <input
              type="number"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              min="1"
              max="480"
              className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-2.5 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Passing Marks</label>
            <input
              type="number"
              name="passingMarks"
              value={form.passingMarks}
              onChange={handleChange}
              min="0"
              className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-2.5 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm"
            />
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Instructions (Optional)</label>
          <textarea
            name="instructions"
            value={form.instructions}
            onChange={handleChange}
            rows="2"
            placeholder="Any special instructions for students..."
            className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none text-sm"
          />
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
            Cancel
          </button>
        </div>
      </div>

    </div>
  );
}