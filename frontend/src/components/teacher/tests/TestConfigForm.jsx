// src/components/teacher/tests/TestConfigForm.jsx
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

export default function TestConfigForm({ questions = [], onSubmit, loading }) {
  const [duration, setDuration] = useState("");
  const [negativeEnabled, setNegativeEnabled] = useState(false);
  const [negativeValue, setNegativeValue] = useState(0);
  const [sectionName, setSectionName] = useState("Main Section");

  const handleSubmit = () => {
    const payload = {
      sections: [
        {
          name: sectionName || "Main Section",
          questionIds: questions.map((q) => q._id),
          marksPerQuestion: 1,
        },
      ],
      duration: Number(duration || 0),
      negativeMarking: {
        enabled: negativeEnabled,
        value: Number(negativeValue || 0),
      },
    };

    onSubmit(payload);
  };

  return (
    <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <SlidersHorizontal className="text-brand-primary" size={20} />
        <h3 className="text-lg font-semibold text-white">Test Configuration</h3>
      </div>

      <input
        value={sectionName}
        onChange={(e) => setSectionName(e.target.value)}
        placeholder="Section name"
        className="w-full bg-dark-100 border border-dark-100 rounded-xl px-4 py-3 outline-none text-white"
      />

      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        placeholder="Duration in minutes"
        className="w-full bg-dark-100 border border-dark-100 rounded-xl px-4 py-3 outline-none text-white"
      />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={negativeEnabled}
          onChange={(e) => setNegativeEnabled(e.target.checked)}
        />
        <span className="text-sm text-white">Enable Negative Marking</span>
      </div>

      {negativeEnabled && (
        <input
          type="number"
          value={negativeValue}
          onChange={(e) => setNegativeValue(e.target.value)}
          placeholder="Negative marking value"
          className="w-full bg-dark-100 border border-dark-100 rounded-xl px-4 py-3 outline-none text-white"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-black font-semibold rounded-xl py-3 disabled:opacity-50"
      >
        {loading ? "Saving Config..." : "Save Config"}
      </button>
    </div>
  );
}