// src/components/teacher/tests/TestForm.jsx
import { useState } from "react";
import { Clock3, CalendarDays, FileText } from "lucide-react";

export default function TestForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    startTime: "",
    endTime: "",
    instructions: "",
    passingMarks: "",
  });

  const [localError, setLocalError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    setLocalError("");

    if (!form.title.trim()) return setLocalError("Test title is required");
    if (!form.duration) return setLocalError("Duration is required");
    if (!form.startTime) return setLocalError("Start time is required");
    if (!form.endTime) return setLocalError("End time is required");
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      return setLocalError("End time must be after start time");
    }

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      duration: Number(form.duration),
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      instructions: form.instructions.trim(),
      passingMarks: Number(form.passingMarks || 0),
    });
  };

  return (
    <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <FileText className="text-brand-primary" size={20} />
        <h2 className="text-xl font-semibold text-white">Create New Test</h2>
      </div>

      {localError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">
          {localError}
        </div>
      )}

      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Enter test title"
        className="w-full bg-dark-100 border border-dark-100 rounded-xl px-4 py-3 outline-none text-white"
      />

      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Enter test description"
        rows={4}
        className="w-full bg-dark-100 border border-dark-100 rounded-xl px-4 py-3 outline-none text-white resize-none"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-dark-100 border border-dark-100 rounded-xl px-4 py-3">
          <label className="text-xs text-grayCustom-medium flex items-center gap-2 mb-2">
            <Clock3 size={14} />
            Duration (minutes)
          </label>
          <input
            type="number"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className="w-full bg-transparent outline-none text-white"
            placeholder="60"
          />
        </div>

        <div className="bg-dark-100 border border-dark-100 rounded-xl px-4 py-3">
          <label className="text-xs text-grayCustom-medium mb-2 block">
            Passing Marks
          </label>
          <input
            type="number"
            name="passingMarks"
            value={form.passingMarks}
            onChange={handleChange}
            className="w-full bg-transparent outline-none text-white"
            placeholder="40"
          />
        </div>

        <div className="bg-dark-100 border border-dark-100 rounded-xl px-4 py-3">
          <label className="text-xs text-grayCustom-medium flex items-center gap-2 mb-2">
            <CalendarDays size={14} />
            Start Time
          </label>
          <input
            type="datetime-local"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            className="w-full bg-transparent outline-none text-white"
          />
        </div>

        <div className="bg-dark-100 border border-dark-100 rounded-xl px-4 py-3">
          <label className="text-xs text-grayCustom-medium flex items-center gap-2 mb-2">
            <CalendarDays size={14} />
            End Time
          </label>
          <input
            type="datetime-local"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            className="w-full bg-transparent outline-none text-white"
          />
        </div>
      </div>

      <textarea
        name="instructions"
        value={form.instructions}
        onChange={handleChange}
        placeholder="Write instructions for students"
        rows={4}
        className="w-full bg-dark-100 border border-dark-100 rounded-xl px-4 py-3 outline-none text-white resize-none"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-black font-semibold rounded-xl py-3 disabled:opacity-50"
      >
        {loading ? "Creating Test..." : "Create Test"}
      </button>
    </div>
  );
}