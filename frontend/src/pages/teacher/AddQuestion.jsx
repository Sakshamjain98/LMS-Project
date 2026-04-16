import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addQuestionToTest, getTestQuestions } from "../../services/teacherService";
import { ChevronLeft, Plus, Trash2, AlertCircle, CheckCircle, Tag, Sparkles, ListChecks } from "lucide-react";

const QUESTION_TYPE_CONFIG = {
  MCQ: {
    fixedOptions: true,
    minOptions: 4,
    maxOptions: 4,
    defaults: ["", "", "", ""],
  },
  TRUE_FALSE: {
    fixedOptions: true,
    minOptions: 2,
    maxOptions: 2,
    defaults: ["True", "False"],
  },
  MULTIPLE_SELECT: {
    fixedOptions: false,
    minOptions: 2,
    maxOptions: 8,
    defaults: ["", "", "", ""],
  },
};

const buildOptions = (questionType) =>
  QUESTION_TYPE_CONFIG[questionType].defaults.map((text) => ({ text }));

const initialFormState = () => ({
  questionText: "",
  questionType: "MCQ",
  options: buildOptions("MCQ"),
  correctOptionIndex: 0,
  marks: 1,
  negativeMarks: 0,
  difficulty: "medium",
  explanation: "",
  tags: [],
});

export default function AddQuestion() {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [existingQuestions, setExistingQuestions] = useState([]);

  const [form, setForm] = useState(initialFormState);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoadingExisting(true);
        const res = await getTestQuestions(testId);
        const items = Array.isArray(res.questions)
          ? res.questions
          : Array.isArray(res?.data?.questions)
          ? res.data.questions
          : Array.isArray(res.data)
          ? res.data
          : [];
        setExistingQuestions(items);
      } catch {
        setExistingQuestions([]);
      } finally {
        setLoadingExisting(false);
      }
    };

    loadQuestions();
  }, [testId]);

  const typeConfig = useMemo(
    () => QUESTION_TYPE_CONFIG[form.questionType],
    [form.questionType]
  );

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index].text = value;
    setField("options", newOptions);
  };

  const handleQuestionTypeChange = (nextType) => {
    const nextOptions = buildOptions(nextType);
    setForm((prev) => ({
      ...prev,
      questionType: nextType,
      options: nextOptions,
      correctOptionIndex: 0,
    }));
  };

  const handleRemoveOption = (index) => {
    if (!typeConfig.fixedOptions && form.options.length > typeConfig.minOptions) {
      const newOptions = form.options.filter((_, i) => i !== index);
      const newCorrectIndex = form.correctOptionIndex === index 
        ? 0 
        : form.correctOptionIndex > index 
        ? form.correctOptionIndex - 1 
        : form.correctOptionIndex;
      setForm((prev) => ({ ...prev, options: newOptions, correctOptionIndex: newCorrectIndex }));
    }
  };

  const handleAddOption = () => {
    if (!typeConfig.fixedOptions && form.options.length < typeConfig.maxOptions) {
      setForm((prev) => ({ ...prev, options: [...prev.options, { text: "" }] }));
    }
  };

  const addTag = () => {
    const next = tagInput.trim();
    if (!next) return;
    if (form.tags.includes(next)) {
      setTagInput("");
      return;
    }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, next] }));
    setTagInput("");
  };

  const removeTag = (tagToRemove) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateForm = () => {
    if (!form.questionText.trim()) {
      setError("Question text is required");
      return false;
    }

    if (form.options.length < typeConfig.minOptions || form.options.length > typeConfig.maxOptions) {
      setError(`Option count must be between ${typeConfig.minOptions} and ${typeConfig.maxOptions}`);
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
        tags: form.tags,
      };

      await addQuestionToTest(testId, payload);
      setSuccess("Question added successfully!");

      setExistingQuestions((prev) => [
        {
          ...payload,
          _id: `temp-${Date.now()}`,
        },
        ...prev,
      ]);

      setForm(initialFormState());
      setTagInput("");
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-brand-primary" size={24} /> Add Question
          </h1>
          <p className="text-white/50 mt-2 text-sm font-medium">Create a clear and structured question flow for this test.</p>
        </div>
        <div className="text-xs text-gray-400 bg-dark-200 px-3 py-2 rounded-lg border border-white/5">
          Type: <span className="text-brand-primary font-semibold">{form.questionType}</span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-emerald-400 text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-dark-200 border border-white/5 rounded-2xl p-5 md:p-8 space-y-6">
        {/* Question Text */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">Question Text *</label>
          <textarea
            value={form.questionText}
            onChange={(e) => setField("questionText", e.target.value)}
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
              onChange={(e) => handleQuestionTypeChange(e.target.value)}
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
              onChange={(e) => setField("difficulty", e.target.value)}
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
                  className="mt-3 w-5 h-5 cursor-pointer accent-brand-primary shrink-0"
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
                {!typeConfig.fixedOptions && form.options.length > typeConfig.minOptions && (
                  <button
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            {!typeConfig.fixedOptions && (
              <button
                onClick={handleAddOption}
                disabled={form.options.length >= typeConfig.maxOptions}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                <Plus size={16} />
                Add Option
              </button>
            )}
          </div>
        </div>

        {/* Marks & Negative Marks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Marks</label>
            <input
              type="number"
              value={form.marks}
              onChange={(e) => setField("marks", parseFloat(e.target.value) || 0)}
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
              onChange={(e) => setField("negativeMarks", parseFloat(e.target.value) || 0)}
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
            onChange={(e) => setField("explanation", e.target.value)}
            rows="3"
            placeholder="Explain the correct answer..."
            className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">Tags (Optional)</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-brand-primary/15 text-brand-primary border border-brand-primary/30"
              >
                <Tag size={12} />
                {tag}
                <span className="opacity-70">x</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag and press Enter"
              className="flex-1 bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary outline-none"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-3 bg-white/5 rounded-lg text-white hover:bg-white/10"
            >
              Add
            </button>
          </div>
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

      <div className="bg-dark-200 border border-white/5 rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ListChecks size={18} className="text-brand-primary" />
          <h2 className="text-lg font-bold text-white">Already Added Questions ({existingQuestions.length})</h2>
        </div>

        {loadingExisting ? (
          <p className="text-sm text-white/60">Loading existing questions...</p>
        ) : existingQuestions.length === 0 ? (
          <p className="text-sm text-white/60">No questions added yet.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {existingQuestions.map((q, idx) => {
              const correctText = q.options?.[q.correctOptionIndex]?.text;
              return (
                <div key={q._id || idx} className="rounded-xl border border-white/10 bg-dark-100/70 p-4">
                  <p className="text-sm font-semibold text-white">
                    <span className="text-brand-primary">Q{idx + 1}.</span> {q.questionText}
                  </p>
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <ul className="mt-2 grid gap-1 text-xs text-white/70">
                      {q.options.map((opt, optionIndex) => (
                        <li key={optionIndex}>
                          {optionIndex + 1}. {opt.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/60">
                    <span className="rounded-md bg-white/5 px-2 py-1">Marks: {q.marks ?? 1}</span>
                    <span className="rounded-md bg-white/5 px-2 py-1">Difficulty: {q.difficulty || "medium"}</span>
                    {correctText && <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-300">Answer: {correctText}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}