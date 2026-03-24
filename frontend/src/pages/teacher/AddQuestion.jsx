import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addQuestionToTest } from "../../services/teacherService";
import { ChevronLeft, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";

export default function AddQuestion() {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    questionText: "",
    questionType: "MCQ",
    options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
    correctOptionIndex: 0,
    marks: 1,
    negativeMarks: 0,
    difficulty: "medium",
    explanation: "",
    tags: "",
  });

  const handleQuestionChange = (e) => {
    setForm({ ...form, questionText: e.target.value });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index].text = value;
    setForm({ ...form, options: newOptions });
  };

  const handleRemoveOption = (index) => {
    if (form.options.length > 2) {
      const newOptions = form.options.filter((_, i) => i !== index);
      const newCorrectIndex = form.correctOptionIndex === index 
        ? 0 
        : form.correctOptionIndex > index 
        ? form.correctOptionIndex - 1 
        : form.correctOptionIndex;
      setForm({ ...form, options: newOptions, correctOptionIndex: newCorrectIndex });
    }
  };

  const handleAddOption = () => {
    setForm({ ...form, options: [...form.options, { text: "" }] });
  };

  const validateForm = () => {
    if (!form.questionText.trim()) {
      setError("Question text is required");
      return false;
    }

    for (let i = 0; i < form.options.length; i++) {
      if (!form.options[i].text.trim()) {
        setError(`Option ${i + 1} cannot be empty`);
        return false;
      }
    }

    if (form.correctOptionIndex >= form.options.length) {
      setError("Please select a valid correct option");
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
        questionText: form.questionText.trim(),
        questionType: form.questionType,
        options: form.options.map(opt => ({ text: opt.text.trim() })),
        correctOptionIndex: form.correctOptionIndex,
        marks: form.marks || 1,
        negativeMarks: form.negativeMarks || 0,
        difficulty: form.difficulty,
        explanation: form.explanation.trim(),
        tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
      };

      await addQuestionToTest(testId, payload);
      setSuccess("Question added successfully!");

      // Reset form
      setForm({
        questionText: "",
        questionType: "MCQ",
        options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
        correctOptionIndex: 0,
        marks: 1,
        negativeMarks: 0,
        difficulty: "medium",
        explanation: "",
        tags: "",
      });

      // Redirect back after short delay
      setTimeout(() => navigate(`/teacher/tests/${testId}`), 1500);
    } catch (err) {
      setError(err.message || "Failed to add question");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12 space-y-8">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/teacher/tests/${testId}`)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-medium"
        >
          <ChevronLeft size={20} />
          Back to Test
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Add Question</h1>
        <p className="text-white/50 mt-2 text-sm font-medium">Create a new question for this test</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-400 text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-dark-200 border border-white/5 rounded-2xl p-8 space-y-6">
        {/* Question Text */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">Question Text *</label>
          <textarea
            value={form.questionText}
            onChange={handleQuestionChange}
            rows="3"
            placeholder="Enter your question here..."
            className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none"
          />
        </div>

        {/* Question Type & Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Question Type</label>
            <select
              value={form.questionType}
              onChange={(e) => setForm({ ...form, questionType: e.target.value })}
              className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            >
              <option value="MCQ">Multiple Choice (MCQ)</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="MULTIPLE_SELECT">Multiple Select</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">Difficulty Level</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">Options *</label>
          <div className="space-y-3">
            {form.options.map((opt, idx) => (
              <div key={idx} className="flex gap-3 items-start bg-dark-100 p-4 rounded-lg border border-white/5">
                <input
                  type="radio"
                  name="correctOption"
                  checked={form.correctOptionIndex === idx}
                  onChange={() => setForm({ ...form, correctOptionIndex: idx })}
                  className="mt-3 w-5 h-5 cursor-pointer accent-brand-primary flex-shrink-0"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full bg-dark-200 border border-white/5 rounded-lg px-3 py-2 text-white focus:border-brand-primary outline-none text-sm"
                  />
                </div>
                {form.options.length > 2 && (
                  <button
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={handleAddOption}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors"
            >
              <Plus size={16} />
              Add Option
            </button>
          </div>
        </div>

        {/* Marks & Negative Marks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Marks</label>
            <input
              type="number"
              value={form.marks}
              onChange={(e) => setForm({ ...form, marks: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.5"
              className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">Negative Marks</label>
            <input
              type="number"
              value={form.negativeMarks}
              onChange={(e) => setForm({ ...form, negativeMarks: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.5"
              className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary outline-none"
            />
          </div>
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">Explanation (Optional)</label>
          <textarea
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            rows="3"
            placeholder="Explain the correct answer..."
            className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">Tags (Optional)</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="comma, separated, tags"
            className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-black rounded-lg font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {loading ? "Adding..." : "Add Question"}
          </button>
          <button
            onClick={() => navigate(`/teacher/tests/${testId}`)}
            className="px-6 py-3 bg-white/5 text-white rounded-lg font-semibold hover:bg-white/10 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}