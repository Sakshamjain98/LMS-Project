import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createTestSeriesChapter,
  createTestSeriesSubject,
  createTestSeriesTest,
  createTestSeriesTopic,
  deleteTeacherTest,
  deleteTestSeriesChapter,
  deleteTestSeriesSubject,
  deleteTestSeriesTopic,
  getTeacherTestSeries,
  updateTeacherTest,
  updateTestSeriesChapter,
  updateTestSeriesSubject,
  updateTestSeriesTopic,
  uploadTestCSV,
} from "../../services/teacherService";
import {
  ChevronRight,
  FileText,
  Folder,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import TestEditor from "./TestEditor";

const emptyEntityForm = { title: "", description: "", isPaid: false, price: 0 };
const emptyTestForm = {
  title: "",
  description: "",
  duration: 60,
  passingMarks: 0,
  instructions: "",
  isPaid: false,
  attemptLimit: 0,
  isProctored: false,
  isOpenTest: true,
  startTime: "",
  endTime: "",
};

const emptyCsvForm = {
  title: "",
  description: "",
  duration: 60,
  passingMarks: 0,
  attemptLimit: 0,
  isProctored: false,
  isOpenTest: false,
  startTime: "",
  endTime: "",
  file: null,
};

export default function AdminTestSeries() {
  const [params, setParams] = useSearchParams();

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "" });
  const [level, setLevel] = useState(params.get("level") || "topics");
  const [selectedTopicId, setSelectedTopicId] = useState(params.get("topicId"));
  const [selectedSubjectId, setSelectedSubjectId] = useState(params.get("subjectId"));
  const [selectedChapterId, setSelectedChapterId] = useState(params.get("chapterId"));
  const [modalState, setModalState] = useState({ isOpen: false, type: null, mode: "create" });
  const [editingTestId, setEditingTestId] = useState(null);
  const [entityForm, setEntityForm] = useState(emptyEntityForm);
  const [testForm, setTestForm] = useState(emptyTestForm);
  const [csvForm, setCsvForm] = useState(emptyCsvForm);
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: null, id: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [editingTestPanelId, setEditingTestPanelId] = useState(null);

  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTeacherTestSeries();
      const list = res.topics || [];
      setTopics(list);
      setSelectedTopicId((prev) => prev || list[0]?._id || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  // Sync URL → state (when sidebar links change navigation)
  useEffect(() => {
    setLevel(params.get("level") || "topics");
    setSelectedTopicId(params.get("topicId") || null);
    setSelectedSubjectId(params.get("subjectId") || null);
    setSelectedChapterId(params.get("chapterId") || null);
  }, [params]);

  const updateUrl = (next) => {
    const merged = {
      level: next.level ?? level,
      topicId: next.topicId ?? selectedTopicId,
      subjectId: next.subjectId ?? selectedSubjectId,
      chapterId: next.chapterId ?? selectedChapterId,
    };
    const sp = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => v && sp.set(k, v));
    setParams(sp, { replace: true });
  };

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic._id === selectedTopicId) || null,
    [topics, selectedTopicId]
  );

  const selectedSubject = useMemo(
    () => selectedTopic?.subjects?.find((subject) => subject._id === selectedSubjectId) || null,
    [selectedTopic, selectedSubjectId]
  );

  const selectedChapter = useMemo(
    () => selectedSubject?.chapters?.find((chapter) => chapter._id === selectedChapterId) || null,
    [selectedSubject, selectedChapterId]
  );

  const hierarchyPath = useMemo(
    () => [selectedTopic?.title, selectedSubject?.title, selectedChapter?.title].filter(Boolean),
    [selectedTopic, selectedSubject, selectedChapter]
  );

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    let rows = [];
    if (level === "topics") rows = topics || [];
    else if (level === "subjects") rows = selectedTopic?.subjects || [];
    else if (level === "chapters") rows = selectedSubject?.chapters || [];
    else rows = selectedChapter?.tests || [];
    return search ? rows.filter((row) => row.title.toLowerCase().includes(search)) : rows;
  }, [filters.search, level, topics, selectedTopic, selectedSubject, selectedChapter]);

  const openModal = (type, mode, data = null) => {
    setModalState({ isOpen: true, type, mode });
    if (type === "test") {
      if (mode === "edit" && data) {
        setEditingTestId(data._id);
        setTestForm({
          title: data.title || "",
          description: data.description || "",
          duration: data.duration || 60,
          passingMarks: data.passingMarks || 0,
          instructions: data.instructions || "",
          isPaid: Boolean(data.isPaid),
          attemptLimit: data.attemptLimit || 0,
          isProctored: Boolean(data.isProctored),
          isOpenTest: !(data.startTime || data.endTime),
          startTime: data.startTime ? toLocalDateTime(data.startTime) : "",
          endTime: data.endTime ? toLocalDateTime(data.endTime) : "",
        });
      } else {
        setEditingTestId(null);
        setTestForm(emptyTestForm);
      }
      return;
    }
    if (type === "csv") { setCsvForm(emptyCsvForm); return; }
    if (mode === "edit" && data) {
      setEntityForm({
        title: data.title || "",
        description: data.description || "",
        isPaid: Boolean(data.isPaid),
        price: Number(data.price) || 0,
      });
      return;
    }
    setEntityForm(emptyEntityForm);
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, mode: "create" });
    setEntityForm(emptyEntityForm);
    setTestForm(emptyTestForm);
    setCsvForm(emptyCsvForm);
    setEditingTestId(null);
  };

  const handleCreateEntity = async () => {
    if (!entityForm.title.trim()) return;
    setActionLoading(true);
    try {
      if (level === "topics") await createTestSeriesTopic(entityForm);
      if (level === "subjects" && selectedTopicId) await createTestSeriesSubject(selectedTopicId, entityForm);
      if (level === "chapters" && selectedSubjectId) await createTestSeriesChapter(selectedSubjectId, entityForm);
      await fetchSeries();
      closeModal();
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEntity = async () => {
    if (!entityForm.title.trim()) return;
    setActionLoading(true);
    try {
      if (level === "topics" && selectedTopicId) await updateTestSeriesTopic(selectedTopicId, entityForm);
      if (level === "subjects" && selectedSubjectId) await updateTestSeriesSubject(selectedSubjectId, entityForm);
      if (level === "chapters" && selectedChapterId) await updateTestSeriesChapter(selectedChapterId, entityForm);
      await fetchSeries();
      closeModal();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTest = async () => {
    if (!selectedChapterId || !testForm.title.trim()) return;
    setActionLoading(true);
    try {
      const payload = buildTestPayload(testForm);
      if (modalState.mode === "edit" && editingTestId) {
        await updateTeacherTest(editingTestId, payload);
      } else {
        await createTestSeriesTest(selectedChapterId, payload);
      }
      await fetchSeries();
      closeModal();
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadCsv = async () => {
    if (!selectedChapterId || !csvForm.file) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", csvForm.file);
      formData.append("title", csvForm.title.trim() || "CSV Imported Test");
      formData.append("description", csvForm.description.trim());
      formData.append("duration", String(Number(csvForm.duration) || 60));
      formData.append("passingMarks", String(Number(csvForm.passingMarks) || 0));
      formData.append("chapterId", selectedChapterId);
      formData.append("attemptLimit", String(Number(csvForm.attemptLimit) || 0));
      formData.append("isProctored", String(Boolean(csvForm.isProctored)));
      formData.append("isOpenTest", String(Boolean(csvForm.isOpenTest)));
      if (!csvForm.isOpenTest) {
        if (csvForm.startTime) formData.append("startTime", new Date(csvForm.startTime).toISOString());
        if (csvForm.endTime) formData.append("endTime", new Date(csvForm.endTime).toISOString());
      }
      await uploadTestCSV(formData);
      await fetchSeries();
      closeModal();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      if (confirmState.type === "topic" && confirmState.id) {
        await deleteTestSeriesTopic(confirmState.id);
        setSelectedTopicId(null); setSelectedSubjectId(null); setSelectedChapterId(null);
      }
      if (confirmState.type === "subject" && confirmState.id) {
        await deleteTestSeriesSubject(confirmState.id);
        setSelectedSubjectId(null); setSelectedChapterId(null);
      }
      if (confirmState.type === "chapter" && confirmState.id) {
        await deleteTestSeriesChapter(confirmState.id);
        setSelectedChapterId(null);
      }
      if (confirmState.type === "test" && confirmState.id) {
        await deleteTeacherTest(confirmState.id);
      }
      await fetchSeries();
    } finally {
      setActionLoading(false);
      setConfirmState({ isOpen: false, type: null, id: null });
    }
  };

  const handleRowSelect = (row) => {
    if (level === "topics") {
      updateUrl({ level: "subjects", topicId: row._id, subjectId: null, chapterId: null });
    } else if (level === "subjects") {
      updateUrl({ level: "chapters", subjectId: row._id, chapterId: null });
    } else if (level === "chapters") {
      updateUrl({ level: "tests", chapterId: row._id });
    } else if (level === "tests") {
      setEditingTestPanelId(row._id);
    }
  };

  const headerTitle =
    level === "topics" ? "Test Series" :
    level === "subjects" ? "Subjects" :
    level === "chapters" ? "Chapters" : "Tests";

  const actionLabel =
    level === "topics" ? "Create Test Series" :
    level === "subjects" ? "Create Subject" :
    level === "chapters" ? "Create Chapter" : "Create Test";

  const goBack = () => {
    if (level === "subjects") updateUrl({ level: "topics" });
    else if (level === "chapters") updateUrl({ level: "subjects" });
    else if (level === "tests") updateUrl({ level: "chapters" });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{headerTitle}</h2>
          {hierarchyPath.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/50">
              {hierarchyPath.map((label, i) => (
                <span key={`${label}-${i}`} className="inline-flex items-center gap-1.5">
                  <span className="rounded-full glass-pill px-2 py-0.5 text-white/80">{label}</span>
                  {i < hierarchyPath.length - 1 && <ChevronRight size={11} />}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {level !== "topics" && (
            <button
              onClick={goBack}
              className="rounded-xl glass-pill px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => openModal(level === "tests" ? "test" : "entity", "create")}
            disabled={level === "subjects" && !selectedTopicId || level === "chapters" && !selectedSubjectId || level === "tests" && !selectedChapterId}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-400 transition hover:brightness-110 disabled:opacity-40"
          >
            <Plus size={16} /> {actionLabel}
          </button>
          {level === "tests" && selectedChapterId && (
            <button
              onClick={() => openModal("csv", "create")}
              className="flex items-center gap-2 rounded-xl glass-pill px-4 py-2 text-sm text-white/80 hover:text-white"
            >
              <UploadCloud size={16} /> Upload CSV
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl glass-card p-4">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder={`Search ${headerTitle.toLowerCase()}...`}
            className="w-full rounded-xl border border-white/10 bg-dark-300/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl glass-card">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Description</th>
                {level === "tests" && (
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Status</th>
                )}
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-white/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-sm text-white/40">Loading...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-sm text-white/40">
                  {level === "subjects" && !selectedTopicId ? "Select a Test Series from the sidebar to view its subjects." :
                   level === "chapters" && !selectedSubjectId ? "Select a Subject to view its chapters." :
                   level === "tests" && !selectedChapterId ? "Select a Chapter to view its tests." :
                   "No records found."}
                </td></tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row._id} className="transition-colors hover:bg-white/[0.04] animate-fade-up" style={{ animationDelay: `${idx * 25}ms` }}>
                    <td className="px-6 py-4 text-sm font-semibold text-white cursor-pointer" onClick={() => handleRowSelect(row)}>
                      <div className="flex items-center gap-2">
                        {level === "topics" && <Layers size={14} className="text-brand-primary" />}
                        {level === "subjects" && <Folder size={14} className="text-sky-400" />}
                        {level === "chapters" && <Folder size={14} className="text-amber-400" />}
                        {level === "tests" && <FileText size={14} className="text-brand-primary" />}
                        {row.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">{row.description || "—"}</td>
                    {level === "tests" && (
                      <td className="px-6 py-4 text-xs">
                        <span className={`rounded-full px-2 py-1 font-semibold uppercase tracking-wider ${
                          row.status === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/60"
                        }`}>
                          {row.status || "draft"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {level !== "tests" && (
                          <button
                            onClick={() => handleRowSelect(row)}
                            className="rounded-lg glass-pill px-3 py-1.5 text-xs text-white/80 hover:text-white"
                          >
                            View
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (level === "tests") setEditingTestPanelId(row._id);
                            else openModal("entity", "edit", row);
                          }}
                          className="rounded-lg glass-pill p-2 text-white/70 hover:text-white"
                          title={level === "tests" ? "Edit test, configuration & questions" : "Edit"}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmState({
                            isOpen: true,
                            type: level === "topics" ? "topic" : level === "subjects" ? "subject" : level === "chapters" ? "chapter" : "test",
                            id: row._id,
                          })}
                          className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen && modalState.type === "entity"}
        title={`${modalState.mode === "edit" ? "Edit" : "Create"} ${
          level === "topics" ? "Test Series" : level === "subjects" ? "Subject" : "Chapter"
        }`}
        onClose={closeModal}
      >
        <div className="space-y-4">
          <FieldLabel
            label={level === "topics" ? "Test Series Name" : level === "subjects" ? "Subject Name" : "Chapter Name"}
            hint="A short, descriptive title shown to students."
            required
          >
            <input
              value={entityForm.title}
              onChange={(e) => setEntityForm({ ...entityForm, title: e.target.value })}
              placeholder={level === "topics" ? "e.g. GPAT 2026 Full Series" : level === "subjects" ? "e.g. Pharmacology" : "e.g. Autonomic Drugs"}
              className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-primary focus:outline-none"
            />
          </FieldLabel>
          <FieldLabel label="Description" hint="One-line summary that helps students decide.">
            <textarea
              value={entityForm.description}
              onChange={(e) => setEntityForm({ ...entityForm, description: e.target.value })}
              placeholder="What does this contain? Who is it for?"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white placeholder:text-white/30 resize-none focus:border-brand-primary focus:outline-none"
            />
          </FieldLabel>

          {/* Pricing — applies only at the test-series (topic) level. */}
          {level === "topics" && (
            <>
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-dark-300 accent-brand-primary"
                  checked={Boolean(entityForm.isPaid)}
                  onChange={(e) => setEntityForm({ ...entityForm, isPaid: e.target.checked })}
                />
                <span>
                  Paid Test Series
                  <span className="block text-[10px] text-white/40">Students pay once for the entire series.</span>
                </span>
              </label>

              {entityForm.isPaid && (
                <FieldLabel label="Price (₹)" hint="One-time fee for full access to every test in this series." required>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={entityForm.price ?? 0}
                    onChange={(e) => setEntityForm({ ...entityForm, price: Number(e.target.value) })}
                    placeholder="999"
                    className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-primary focus:outline-none"
                  />
                </FieldLabel>
              )}
            </>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="rounded-lg glass-pill px-4 py-2 text-sm text-white/80">Cancel</button>
            <button
              onClick={modalState.mode === "edit" ? handleUpdateEntity : handleCreateEntity}
              disabled={actionLoading || (level === "topics" && entityForm.isPaid && (!entityForm.price || entityForm.price <= 0))}
              className="rounded-lg btn-gradient px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalState.isOpen && modalState.type === "test"} title={modalState.mode === "edit" ? "Edit Test" : "Create Test"} onClose={closeModal}>
        <TestForm form={testForm} onChange={setTestForm} />
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={closeModal} className="rounded-lg glass-pill px-4 py-2 text-sm text-white/80">Cancel</button>
          <button onClick={handleCreateTest} disabled={actionLoading} className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-dark-400">
            {actionLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={modalState.isOpen && modalState.type === "csv"} title="Upload CSV Test" onClose={closeModal}>
        <CsvForm form={csvForm} onChange={setCsvForm} />
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={closeModal} className="rounded-lg glass-pill px-4 py-2 text-sm text-white/80">Cancel</button>
          <button onClick={handleUploadCsv} disabled={actionLoading} className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-dark-400">
            {actionLoading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: null, id: null })}
        onConfirm={handleDelete}
        title="Delete item"
        message="This action will remove all nested data. Continue?"
      />

      {editingTestPanelId && (
        <TestEditor
          testId={editingTestPanelId}
          onClose={() => setEditingTestPanelId(null)}
          onSaved={fetchSeries}
        />
      )}
    </div>
  );
}

function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-xl rounded-2xl glass-panel p-6 animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ label, hint, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}

const fieldInput = "w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-primary focus:outline-none transition-colors";
const fieldChk   = "h-4 w-4 rounded border-white/20 bg-dark-300 accent-brand-primary";

function TestForm({ form, onChange }) {
  return (
    <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
      <FieldLabel label="Test Title" hint="Shown on the student's test list." required>
        <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} placeholder="e.g. GPAT Mock 1 — Pharmacology" className={fieldInput} />
      </FieldLabel>

      <FieldLabel label="Description" hint="A one-line preview students see before starting.">
        <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} placeholder="What is this test about?" rows={2} className={`${fieldInput} resize-none`} />
      </FieldLabel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldLabel label="Duration (minutes)" hint="Total time allowed to finish." required>
          <input type="number" min="1" value={form.duration} onChange={(e) => onChange({ ...form, duration: e.target.value })} placeholder="60" className={fieldInput} />
        </FieldLabel>
        <FieldLabel label="Passing Marks" hint="Minimum score required to pass.">
          <input type="number" min="0" value={form.passingMarks} onChange={(e) => onChange({ ...form, passingMarks: e.target.value })} placeholder="40" className={fieldInput} />
        </FieldLabel>
      </div>

      <FieldLabel label="Instructions" hint="Optional notes shown to students before they start.">
        <textarea value={form.instructions} onChange={(e) => onChange({ ...form, instructions: e.target.value })} placeholder="Read carefully — there is negative marking..." rows={2} className={`${fieldInput} resize-none`} />
      </FieldLabel>

      <label className="flex items-center gap-2 text-sm text-white/80 rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 cursor-pointer">
        <input type="checkbox" className={fieldChk} checked={form.isProctored} onChange={(e) => onChange({ ...form, isProctored: e.target.checked })} />
        <span>Proctored <span className="block text-[10px] text-white/40">Forces fullscreen + tab-switch detection.</span></span>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldLabel label="Attempt Limit" hint="0 = unlimited attempts.">
          <input type="number" min="0" value={form.attemptLimit} onChange={(e) => onChange({ ...form, attemptLimit: e.target.value })} placeholder="0" className={fieldInput} />
        </FieldLabel>
        <label className="flex items-center gap-2 text-sm text-white/80 rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 cursor-pointer self-end h-[46px]">
          <input type="checkbox" className={fieldChk} checked={form.isOpenTest} onChange={(e) => onChange({ ...form, isOpenTest: e.target.checked })} />
          <span>Open Test <span className="block text-[10px] text-white/40">Available anytime — no schedule.</span></span>
        </label>
      </div>

      {!form.isOpenTest && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldLabel label="Starts At" hint="Earliest moment students can begin.">
            <input type="datetime-local" value={form.startTime} onChange={(e) => onChange({ ...form, startTime: e.target.value })} className={fieldInput} />
          </FieldLabel>
          <FieldLabel label="Ends At" hint="No new attempts allowed after this.">
            <input type="datetime-local" value={form.endTime} onChange={(e) => onChange({ ...form, endTime: e.target.value })} className={fieldInput} />
          </FieldLabel>
        </div>
      )}
    </div>
  );
}

function CsvForm({ form, onChange }) {
  return (
    <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
      <FieldLabel label="Test Title" required>
        <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} placeholder="e.g. GPAT Mock 2" className={fieldInput} />
      </FieldLabel>
      <FieldLabel label="Description">
        <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} placeholder="A short summary of this test." rows={2} className={`${fieldInput} resize-none`} />
      </FieldLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldLabel label="Duration (minutes)" required>
          <input type="number" min="1" value={form.duration} onChange={(e) => onChange({ ...form, duration: e.target.value })} placeholder="60" className={fieldInput} />
        </FieldLabel>
        <FieldLabel label="Passing Marks">
          <input type="number" min="0" value={form.passingMarks} onChange={(e) => onChange({ ...form, passingMarks: e.target.value })} placeholder="40" className={fieldInput} />
        </FieldLabel>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldLabel label="Attempt Limit" hint="0 = unlimited.">
          <input type="number" min="0" value={form.attemptLimit} onChange={(e) => onChange({ ...form, attemptLimit: e.target.value })} placeholder="0" className={fieldInput} />
        </FieldLabel>
        <label className="flex items-center gap-2 text-sm text-white/80 rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 cursor-pointer self-end h-[46px]">
          <input type="checkbox" className={fieldChk} checked={form.isProctored} onChange={(e) => onChange({ ...form, isProctored: e.target.checked })} />
          Proctored
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-white/80 rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 cursor-pointer">
        <input type="checkbox" className={fieldChk} checked={form.isOpenTest} onChange={(e) => onChange({ ...form, isOpenTest: e.target.checked })} />
        Open Test (no schedule)
      </label>
      {!form.isOpenTest && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldLabel label="Starts At">
            <input type="datetime-local" value={form.startTime} onChange={(e) => onChange({ ...form, startTime: e.target.value })} className={fieldInput} />
          </FieldLabel>
          <FieldLabel label="Ends At">
            <input type="datetime-local" value={form.endTime} onChange={(e) => onChange({ ...form, endTime: e.target.value })} className={fieldInput} />
          </FieldLabel>
        </div>
      )}
      <FieldLabel
        label="CSV File"
        hint="Columns: questionText, optionA, optionB, optionC, optionD, correctIndex (0–3), marks."
        required
      >
        <input type="file" accept=".csv" onChange={(e) => onChange({ ...form, file: e.target.files?.[0] || null })} className={fieldInput} />
      </FieldLabel>
    </div>
  );
}

const buildTestPayload = (form) => {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    duration: Number(form.duration) || 60,
    passingMarks: Number(form.passingMarks) || 0,
    instructions: form.instructions.trim(),
    isPaid: Boolean(form.isPaid),
    attemptLimit: Number(form.attemptLimit) || 0,
    isProctored: Boolean(form.isProctored),
  };
  if (!form.isOpenTest) {
    if (form.startTime) payload.startTime = new Date(form.startTime).toISOString();
    if (form.endTime) payload.endTime = new Date(form.endTime).toISOString();
  }
  return payload;
};

const toLocalDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
