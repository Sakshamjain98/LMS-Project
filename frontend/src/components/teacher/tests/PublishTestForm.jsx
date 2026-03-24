// src/components/teacher/tests/PublishTestForm.jsx
import { useState } from "react";
import { Send } from "lucide-react";

export default function PublishTestForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    startTime: "",
    endTime: "",
  });

  const [localError, setLocalError] = useState("");

  const handleSubmit = () => {
    setLocalError("");

    if (!form.startTime || !form.endTime) {
      return setLocalError("Both start time and end time are required");
    }

    if (new Date(form.endTime) <= new Date(form.startTime)) {
      return setLocalError("End time must be greater than start time");
    }

    onSubmit({
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
    });
  };

  return (
    <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Send className="text-brand-primary" size={20} />
        <h3 className="text-lg font-semibold text-white">Publish / Schedule Test</h3>
      </div>

      {localError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">
          {localError}
        </div>
      )}

      <input
        type="datetime-local"
        value={form.startTime}
        onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
        className="w-full bg-dark-100 border border-dark-100 rounded-xl px-4 py-3 outline-none text-white"
      />

      <input
        type="datetime-local"
        value={form.endTime}
        onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
        className="w-full bg-dark-100 border border-dark-100 rounded-xl px-4 py-3 outline-none text-white"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-black font-semibold rounded-xl py-3 disabled:opacity-50"
      >
        {loading ? "Publishing..." : "Publish Test"}
      </button>
    </div>
  );
}