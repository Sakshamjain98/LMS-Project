import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTeacherTestById,
  updateTeacherTest,
  deleteTeacherTest,
  saveTestConfig,
  publishTeacherTest,
  previewTeacherTest,
  getTestQuestions,
  deleteQuestion,
} from "../../services/teacherService";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { Trash2, Edit, Save, X, Plus, Eye, Send, ChevronLeft, AlertCircle, CheckCircle } from "lucide-react";

export default function TestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", duration: 0 });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, questionId: null });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [testRes, questionsRes, previewRes] = await Promise.all([
          getTeacherTestById(id),
          getTestQuestions(id),
          previewTeacherTest(id),
        ]);

        setTest(testRes.test);
        const questionsArray = Array.isArray(questionsRes.questions) 
          ? questionsRes.questions 
          : Array.isArray(questionsRes?.data?.questions)
          ? questionsRes.data.questions
          : Array.isArray(questionsRes.data)
          ? questionsRes.data
          : [];
        setQuestions(questionsArray);
        setPreview(previewRes.test);

        setEditForm({
          title: testRes.test.title,
          description: testRes.test.description || "",
          duration: testRes.test.duration,
        });
      } catch (err) {
        setError(err.message || "Failed to load test details");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleUpdateTest = async () => {
    try {
      const res = await updateTeacherTest(id, editForm);
      setTest(res.test);
      setEditing(false);
      setSuccess("Test updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTest = async () => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await deleteTeacherTest(id);
      navigate("/teacher/tests");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteQuestion = async () => {
    try {
      await deleteQuestion(deleteModal.questionId);
      setQuestions((prev) => prev.filter((q) => q._id !== deleteModal.questionId));
      setSuccess("Question deleted");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteModal({ isOpen: false, questionId: null });
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "questions", label: "Questions" },
    { id: "config", label: "Configuration" },
    { id: "publish", label: "Publish" },
    { id: "preview", label: "Preview" },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white/60 font-medium">Loading test...</p>
    </div>
  );

  if (!test) return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md mx-auto mt-12 text-center">
      <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
      <p className="text-red-400 font-medium">Test not found</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12 space-y-8">
      {/* Breadcrumb & Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/teacher/tests")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-medium"
        >
          <ChevronLeft size={20} />
          Back to Tests
        </button>
      </div>

      {/* Header */}
      <div className="space-y-4">
        {editing ? (
          <div className="bg-dark-200 border border-white/5 rounded-2xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Edit Test</h2>
            
            <div>
              <label className="block text-sm font-semibold text-white mb-3">Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows="3"
                className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Duration (minutes)</label>
              <input
                type="number"
                value={editForm.duration}
                onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                min="1"
                className="w-full bg-dark-100 border border-white/5 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleUpdateTest}
                className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-black rounded-lg font-semibold hover:brightness-110 transition-all"
              >
                <Save size={18} />
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-6 py-3 bg-white/5 text-white rounded-lg font-semibold hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-dark-200 border border-white/5 rounded-2xl p-8">
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-white">{test.title}</h1>
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                    test.status === "published" 
                      ? "bg-emerald-500/15 text-emerald-400" 
                      : "bg-amber-500/15 text-amber-400"
                  }`}>
                    {test.status}
                  </span>
                </div>
                {test.description && (
                  <p className="text-white/60 text-sm mb-6">{test.description}</p>
                )}
                {(test.topicId?.title || test.subjectId?.title || test.chapterId?.title) && (
                  <p className="text-xs text-white/40 mb-4">
                    {test.topicId?.title || "Untitled Topic"} / {test.subjectId?.title || "Untitled Subject"} / {test.chapterId?.title || "Untitled Chapter"}
                  </p>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide font-semibold">Questions</p>
                    <p className="text-2xl font-bold text-white mt-1">{questions.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide font-semibold">Duration</p>
                    <p className="text-2xl font-bold text-white mt-1">{test.duration} min</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide font-semibold">Total Marks</p>
                    <p className="text-2xl font-bold text-brand-primary mt-1">{test.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide font-semibold">Passing Marks</p>
                    <p className="text-2xl font-bold text-white mt-1">{test.passingMarks}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditing(true)}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                  title="Edit test"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={handleDeleteTest}
                  className="p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  title="Delete test"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
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

      {/* Tabs */}
      <div className="bg-dark-200 border border-white/5 rounded-2xl overflow-hidden">
        <div className="border-b border-white/5 px-8">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 text-sm font-semibold transition-colors relative ${
                  activeTab === tab.id
                    ? "text-brand-primary"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-6">Test Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-dark-100 p-6 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase tracking-wide font-semibold mb-2">Created Date</p>
                    <p className="text-white font-medium">{new Date(test.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-dark-100 p-6 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase tracking-wide font-semibold mb-2">Last Updated</p>
                    <p className="text-white font-medium">{new Date(test.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-dark-100 p-6 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase tracking-wide font-semibold mb-2">Passing Marks</p>
                    <p className="text-white font-medium">{test.passingMarks}</p>
                  </div>
                  <div className="bg-dark-100 p-6 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase tracking-wide font-semibold mb-2">Instructions</p>
                    <p className="text-white font-medium">{test.instructions || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "questions" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Questions ({questions.length})</h3>
                <button
                  onClick={() => navigate(`/teacher/tests/${id}/questions/add`)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-black rounded-lg font-semibold hover:brightness-110 transition-all"
                >
                  <Plus size={18} />
                  Add Question
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 bg-dark-100 rounded-lg border border-white/5">
                  <p className="text-white/50 font-medium">No questions added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q._id} className="bg-dark-100 p-6 rounded-lg border border-white/5 hover:border-brand-primary/30 transition-colors">
                      <div className="flex justify-between items-start gap-6">
                        <div className="flex-1">
                          <p className="text-white font-medium mb-2">
                            <span className="text-brand-primary font-bold">Q{idx + 1}:</span> {q.questionText}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-white/60">
                            <span className="bg-white/5 px-3 py-1 rounded">Marks: {q.marks}</span>
                            <span className="bg-white/5 px-3 py-1 rounded">Difficulty: {q.difficulty}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, questionId: q._id })}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors shrink-0"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "config" && (
            <TestConfigForm
              testId={id}
              initialConfig={{
                duration: test.duration || 60,
                shuffleQuestions: test.shuffleQuestions ?? false,
                shuffleOptions: test.shuffleOptions ?? false,
                showResults: test.showResults ?? true,
                allowRetake: test.allowRetake ?? false,
                negativeMarks: test.negativeMarks ?? 0,
              }}
              onSave={async (config) => {
                try {
                  await saveTestConfig(id, config);
                  setSuccess("Configuration saved");
                  setTimeout(() => setSuccess(""), 3000);
                } catch (err) {
                  setError(err.message);
                }
              }}
            />
          )}

          {activeTab === "publish" && (
            <PublishTestForm
              testId={id}
              currentStatus={test.status}
              onPublish={async (payload) => {
                try {
                  await publishTeacherTest(id, payload);
                  setSuccess("Test published successfully");
                  const updated = await getTeacherTestById(id);
                  setTest(updated.test);
                  setTimeout(() => setSuccess(""), 3000);
                } catch (err) {
                  setError(err.message);
                }
              }}
            />
          )}

          {activeTab === "preview" && (
            <TestPreviewPanel preview={preview} />
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, questionId: null })}
        onConfirm={handleDeleteQuestion}
        title="Delete Question"
        message="This question will be permanently deleted. This action cannot be undone."
      />
    </div>
  );
}

// Configuration Form
function TestConfigForm({ initialConfig, onSave }) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(config);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-white mb-6">Test Settings</h3>
        
        <div className="space-y-4 bg-dark-100 rounded-lg border border-white/5 p-6">
          <label className="flex items-center gap-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={config.shuffleQuestions}
              onChange={(e) => setConfig({ ...config, shuffleQuestions: e.target.checked })}
              className="w-5 h-5 rounded border border-white/20 bg-dark-200 cursor-pointer accent-brand-primary"
            />
            <div className="flex-1">
              <p className="text-white font-medium group-hover:text-brand-primary transition-colors">Shuffle Questions</p>
              <p className="text-xs text-white/50 mt-0.5">Randomize question order for each student</p>
            </div>
          </label>

          <div className="border-t border-white/5" />

          <label className="flex items-center gap-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={config.shuffleOptions}
              onChange={(e) => setConfig({ ...config, shuffleOptions: e.target.checked })}
              className="w-5 h-5 rounded border border-white/20 bg-dark-200 cursor-pointer accent-brand-primary"
            />
            <div className="flex-1">
              <p className="text-white font-medium group-hover:text-brand-primary transition-colors">Shuffle Options</p>
              <p className="text-xs text-white/50 mt-0.5">Randomize answer options for each student</p>
            </div>
          </label>

          <div className="border-t border-white/5" />

          <label className="flex items-center gap-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={config.showResults}
              onChange={(e) => setConfig({ ...config, showResults: e.target.checked })}
              className="w-5 h-5 rounded border border-white/20 bg-dark-200 cursor-pointer accent-brand-primary"
            />
            <div className="flex-1">
              <p className="text-white font-medium group-hover:text-brand-primary transition-colors">Show Results Immediately</p>
              <p className="text-xs text-white/50 mt-0.5">Display results right after submission</p>
            </div>
          </label>

          <div className="border-t border-white/5" />

          <label className="flex items-center gap-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={config.allowRetake}
              onChange={(e) => setConfig({ ...config, allowRetake: e.target.checked })}
              className="w-5 h-5 rounded border border-white/20 bg-dark-200 cursor-pointer accent-brand-primary"
            />
            <div className="flex-1">
              <p className="text-white font-medium group-hover:text-brand-primary transition-colors">Allow Retake</p>
              <p className="text-xs text-white/50 mt-0.5">Let students attempt the test multiple times</p>
            </div>
          </label>

          <div className="border-t border-white/5 pt-4">
            <label className="block mb-3">
              <p className="text-white font-medium mb-2">Negative Marks Per Wrong Answer</p>
              <p className="text-xs text-white/50 mb-3">Set to 0 for no negative marking</p>
              <input
                type="number"
                step="0.5"
                min="0"
                value={config.negativeMarks}
                onChange={(e) => setConfig({ ...config, negativeMarks: parseFloat(e.target.value) || 0 })}
                className="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition"
              />
            </label>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-black rounded-lg font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
      >
        <Save size={18} />
        {loading ? "Saving..." : "Save Configuration"}
      </button>
    </form>
  );
}

// Publish Form
function PublishTestForm({ currentStatus, onPublish }) {
  const [publishType, setPublishType] = useState("now");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload = {};
      if (publishType === "now") {
        payload = { startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString() };
      } else {
        if (!startTime || !endTime) {
          alert("Please provide both start and end times");
          setLoading(false);
          return;
        }
        payload = { startTime, endTime };
      }
      await onPublish(payload);
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === "published") {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6 text-center">
        <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
        <p className="text-emerald-400 font-medium">This test is already published</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-white mb-6">Publish Options</h3>
        
        <div className="space-y-4 bg-dark-100 rounded-lg border border-white/5 p-6">
          <label className="flex items-center gap-4 cursor-pointer group">
            <input
              type="radio"
              name="publishType"
              value="now"
              checked={publishType === "now"}
              onChange={() => setPublishType("now")}
              className="w-5 h-5 cursor-pointer accent-brand-primary"
            />
            <div>
              <p className="text-white font-medium group-hover:text-brand-primary transition-colors">Publish Immediately</p>
              <p className="text-xs text-white/50 mt-0.5">Test will be available to students right away</p>
            </div>
          </label>

          <div className="border-t border-white/5" />

          <label className="flex items-center gap-4 cursor-pointer group">
            <input
              type="radio"
              name="publishType"
              value="schedule"
              checked={publishType === "schedule"}
              onChange={() => setPublishType("schedule")}
              className="w-5 h-5 cursor-pointer accent-brand-primary"
            />
            <div>
              <p className="text-white font-medium group-hover:text-brand-primary transition-colors">Schedule for Later</p>
              <p className="text-xs text-white/50 mt-0.5">Set specific date and time for availability</p>
            </div>
          </label>
        </div>
      </div>

      {publishType === "schedule" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-dark-100 rounded-lg border border-white/5 p-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Start Date & Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-3">End Date & Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full bg-dark-200 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all"
      >
        <Send size={18} />
        {loading ? "Publishing..." : publishType === "now" ? "Publish Now" : "Schedule Test"}
      </button>
    </form>
  );
}

// Preview Panel
function TestPreviewPanel({ preview }) {
  if (!preview) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50 font-medium">No preview available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Test Preview</h3>
      <div className="space-y-4">
        {preview.questions?.map((q, idx) => (
          <div key={idx} className="bg-dark-100 p-6 rounded-lg border border-white/5">
            <p className="text-white font-medium mb-4">
              <span className="text-brand-primary font-bold">Q{idx + 1}:</span> {q.questionText}
              <span className="text-xs text-white/50 ml-3">({q.marks} marks)</span>
            </p>
            <div className="space-y-2 ml-4">
              {q.options?.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-white text-xs font-semibold shrink-0">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="text-white/80">{opt.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}