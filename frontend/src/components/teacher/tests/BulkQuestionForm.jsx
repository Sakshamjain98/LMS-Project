// src/components/teacher/tests/BulkQuestionForm.jsx
import { useState } from "react";
import { UploadCloud } from "lucide-react";

export default function BulkQuestionForm({ onSubmit, loading }) {
  const [rawJson, setRawJson] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = () => {
    try {
      setLocalError("");
      const parsed = JSON.parse(rawJson);

      if (!Array.isArray(parsed)) {
        return setLocalError("JSON must be an array of questions");
      }

      onSubmit({ questions: parsed });
    } catch {
      setLocalError("Invalid JSON format");
    }
  };

  return (
    <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <UploadCloud className="text-brand-primary" size={20} />
        <h3 className="text-lg font-semibold text-white">Bulk Upload Questions</h3>
      </div>

      {localError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">
          {localError}
        </div>
      )}

      <textarea
        value={rawJson}
        onChange={(e) => setRawJson(e.target.value)}
        rows={12}
        placeholder='Paste JSON array here, e.g. [{"questionText":"...","questionType":"MCQ","options":[...]}]'
        className="w-full bg-dark-100 border border-dark-100 rounded-xl px-4 py-3 outline-none text-white resize-none"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-black font-semibold rounded-xl py-3 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Bulk Add Questions"}
      </button>
    </div>
  );
}