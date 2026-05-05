import { useCallback, useEffect, useMemo, useState } from "react";
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

const emptyEntityForm = { title: "", description: "" };
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

export default function Tests() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "" });
  const [level, setLevel] = useState("topics");
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, type: null, mode: "create" });
  const [editingTestId, setEditingTestId] = useState(null);
  const [entityForm, setEntityForm] = useState(emptyEntityForm);
  const [testForm, setTestForm] = useState(emptyTestForm);
  const [csvForm, setCsvForm] = useState(emptyCsvForm);
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: null, id: null });
  const [actionLoading, setActionLoading] = useState(false);

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
    if (level === "topics") {
      const rows = topics || [];
      return search ? rows.filter((row) => row.title.toLowerCase().includes(search)) : rows;
    }
    if (level === "subjects") {
      const rows = selectedTopic?.subjects || [];
      return search ? rows.filter((row) => row.title.toLowerCase().includes(search)) : rows;
    }
    if (level === "chapters") {
      const rows = selectedSubject?.chapters || [];
      return search ? rows.filter((row) => row.title.toLowerCase().includes(search)) : rows;
    }
    const rows = selectedChapter?.tests || [];
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
    if (type === "csv") {
      setCsvForm(emptyCsvForm);
      return;
    }
    if (mode === "edit" && data) {
      setEntityForm({
        title: data.title || "",
        description: data.description || "",
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
      if (level === "topics") {
        await createTestSeriesTopic(entityForm);
      }
      if (level === "subjects" && selectedTopicId) {
        await createTestSeriesSubject(selectedTopicId, entityForm);
      }
      if (level === "chapters" && selectedSubjectId) {
        await createTestSeriesChapter(selectedSubjectId, entityForm);
      }
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
      if (level === "topics" && selectedTopicId) {
        await updateTestSeriesTopic(selectedTopicId, entityForm);
      }
      if (level === "subjects" && selectedSubjectId) {
        await updateTestSeriesSubject(selectedSubjectId, entityForm);
      }
      if (level === "chapters" && selectedChapterId) {
        await updateTestSeriesChapter(selectedChapterId, entityForm);
      }
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
        if (csvForm.startTime) {
          formData.append("startTime", new Date(csvForm.startTime).toISOString());
        }
        if (csvForm.endTime) {
          formData.append("endTime", new Date(csvForm.endTime).toISOString());
        }
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
        setSelectedTopicId(null);
        setSelectedSubjectId(null);
        setSelectedChapterId(null);
      }
      if (confirmState.type === "subject" && confirmState.id) {
        await deleteTestSeriesSubject(confirmState.id);
        setSelectedSubjectId(null);
        setSelectedChapterId(null);
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
      setSelectedTopicId(row._id);
      setSelectedSubjectId(null);
      setSelectedChapterId(null);
      setLevel("subjects");
    } else if (level === "subjects") {
      setSelectedSubjectId(row._id);
      setSelectedChapterId(null);
      setLevel("chapters");
    } else if (level === "chapters") {
      setSelectedChapterId(row._id);
      setLevel("tests");
    }
  };

  const headerTitle =
    level === "topics"
      ? "Test Series"
      : level === "subjects"
        ? "Subjects"
        : level === "chapters"
          ? "Chapters"
          : "Tests";

  const actionLabel =
    level === "topics"
      ? "Create Test Series"
      : level === "subjects"
        ? "Create Subject"
        : level === "chapters"
          ? "Create Chapter"
          : "Create Test";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px,1fr]">
      {/* Hierarchy Panel */}
      <aside className="rounded-2xl border border-white/10 bg-dark-200 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Layers size={16} className="text-brand-primary" />
          Hierarchy
        </div>
        <div className="mt-4 space-y-3 text-xs text-white/50">
          <p className="uppercase tracking-widest">Path</p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-white">
            {hierarchyPath.length === 0 ? (
              <span className="text-white/40">Select a test series</span>
            ) : (
              hierarchyPath.map((label, index) => (
                <span key={`${label}-${index}`} className="inline-flex items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    {label}
                  </span>
                  {index < hierarchyPath.length - 1 && <ChevronRight size={12} />}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-white/50">Series</p>
          <div className="mt-3 space-y-2">
            {topics.map((topic) => (
              <button
                key={topic._id}
                onClick={() => {
                  setSelectedTopicId(topic._id);
                  setSelectedSubjectId(null);
                  setSelectedChapterId(null);
                  setLevel("subjects");
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  selectedTopicId === topic._id
                    ? "bg-brand-primary/15 text-brand-primary"
                    : "bg-dark-300/40 text-white/70 hover:bg-dark-300"
                }`}
              >
                {topic.title}
              </button>
            ))}
            {topics.length === 0 && (
              <p className="text-xs text-white/40">No test series yet.</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Table */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{headerTitle}</h1>
            <p className="text-sm text-white/50">Manage your test series hierarchy with quick CRUD actions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {level !== "topics" && (
              <button
                onClick={() => {
                  if (level === "subjects") {
                    setLevel("topics");
                  } else if (level === "chapters") {
                    setLevel("subjects");
                  } else {
                    setLevel("chapters");
                  }
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
              >
                Back
              </button>
            )}
            <button
              onClick={() => openModal(level === "tests" ? "test" : "entity", "create")}
              className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-dark-400"
            >
              <Plus size={16} /> {actionLabel}
            </button>
            {level === "tests" && (
              <button
                onClick={() => openModal("csv", "create")}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
              >
                <UploadCloud size={16} /> Upload CSV
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="relative min-w-70 flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder={`Search ${headerTitle.toLowerCase()}...`}
              className="w-full rounded-xl border border-white/10 bg-dark-300/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-300/50 border-b border-dark-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Description</th>
                  {level === "tests" && (
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Status</th>
                  )}
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-white/40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-sm text-white/40">
                      Loading...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-sm text-white/40">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row._id}
                      className="hover:bg-dark-100/50 transition-colors"
                    >
                      <td
                        className="px-6 py-4 text-sm font-semibold text-white cursor-pointer"
                        onClick={() => handleRowSelect(row)}
                      >
                        <div className="flex items-center gap-2">
                          {level === "topics" && <Layers size={14} className="text-brand-primary" />}
                          {level === "subjects" && <Folder size={14} className="text-sky-400" />}
                          {level === "chapters" && <Folder size={14} className="text-amber-400" />}
                          {level === "tests" && <FileText size={14} className="text-brand-primary" />}
                          {row.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/50">
                        {row.description || "-"}
                      </td>
                      {level === "tests" && (
                        <td className="px-6 py-4 text-xs text-white/60">
                          {row.status || "draft"}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {level !== "tests" && (
                            <button
                              onClick={() => {
                                if (level === "topics") {
                                  setSelectedTopicId(row._id);
                                  setLevel("subjects");
                                } else if (level === "subjects") {
                                  setSelectedSubjectId(row._id);
                                  setLevel("chapters");
                                } else {
                                  setSelectedChapterId(row._id);
                                  setLevel("tests");
                                }
                              }}
                              className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/70"
                            >
                              View
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (level === "topics") {
                                setSelectedTopicId(row._id);
                              }
                              if (level === "subjects") {
                                setSelectedSubjectId(row._id);
                              }
                              if (level === "chapters") {
                                setSelectedChapterId(row._id);
                              }
                              openModal(level === "tests" ? "test" : "entity", "edit", row);
                            }}
                            className="rounded-lg bg-white/5 p-2 text-white/70 hover:text-white"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmState({
                                isOpen: true,
                                type:
                                  level === "topics"
                                    ? "topic"
                                    : level === "subjects"
                                      ? "subject"
                                      : level === "chapters"
                                        ? "chapter"
                                        : "test",
                                id: row._id,
                              })
                            }
                            className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:text-red-300"
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
      </section>

      <Modal
        isOpen={modalState.isOpen && modalState.type === "entity"}
        title={modalState.mode === "edit" ? "Edit" : "Create"}
        onClose={closeModal}
      >
        <div className="space-y-4">
          <input
            value={entityForm.title}
            onChange={(e) => setEntityForm({ ...entityForm, title: e.target.value })}
            placeholder="Title"
            className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
          />
          <textarea
            value={entityForm.description}
            onChange={(e) => setEntityForm({ ...entityForm, description: e.target.value })}
            placeholder="Description"
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white/70"
            >
              Cancel
            </button>
            <button
              onClick={modalState.mode === "edit" ? handleUpdateEntity : handleCreateEntity}
              disabled={actionLoading}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-dark-400"
            >
              {actionLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalState.isOpen && modalState.type === "test"}
        title={modalState.mode === "edit" ? "Edit Test" : "Create Test"}
        onClose={closeModal}
      >
        <TestForm form={testForm} onChange={setTestForm} />
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={closeModal}
            className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white/70"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTest}
            disabled={actionLoading}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-dark-400"
          >
            {actionLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={modalState.isOpen && modalState.type === "csv"}
        title="Upload CSV Test"
        onClose={closeModal}
      >
        <CsvForm form={csvForm} onChange={setCsvForm} />
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={closeModal}
            className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white/70"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadCsv}
            disabled={actionLoading}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-dark-400"
          >
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
    </div>
  );
}

function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-dark-200 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/60">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TestForm({ form, onChange }) {
  return (
    <div className="space-y-4">
      <input
        value={form.title}
        onChange={(e) => onChange({ ...form, title: e.target.value })}
        placeholder="Test title"
        className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
      />
      <textarea
        value={form.description}
        onChange={(e) => onChange({ ...form, description: e.target.value })}
        placeholder="Description"
        rows={2}
        className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white resize-none"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="number"
          min="1"
          value={form.duration}
          onChange={(e) => onChange({ ...form, duration: e.target.value })}
          placeholder="Duration (minutes)"
          className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
        />
        <input
          type="number"
          min="0"
          value={form.passingMarks}
          onChange={(e) => onChange({ ...form, passingMarks: e.target.value })}
          placeholder="Passing marks"
          className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
        />
      </div>
      <textarea
        value={form.instructions}
        onChange={(e) => onChange({ ...form, instructions: e.target.value })}
        placeholder="Instructions (optional)"
        rows={2}
        className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white resize-none"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.isPaid}
            onChange={(e) => onChange({ ...form, isPaid: e.target.checked })}
          />
          Paid test
        </div>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.isProctored}
            onChange={(e) => onChange({ ...form, isProctored: e.target.checked })}
          />
          Proctored test
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="number"
          min="0"
          value={form.attemptLimit}
          onChange={(e) => onChange({ ...form, attemptLimit: e.target.value })}
          placeholder="Attempt limit (0 = unlimited)"
          className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
        />
        <div className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.isOpenTest}
            onChange={(e) => onChange({ ...form, isOpenTest: e.target.checked })}
          />
          Open test (no dates)
        </div>
      </div>
      {!form.isOpenTest && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => onChange({ ...form, startTime: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
          />
          <input
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => onChange({ ...form, endTime: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
          />
        </div>
      )}
    </div>
  );
}

function CsvForm({ form, onChange }) {
  return (
    <div className="space-y-4">
      <input
        value={form.title}
        onChange={(e) => onChange({ ...form, title: e.target.value })}
        placeholder="Test title"
        className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
      />
      <textarea
        value={form.description}
        onChange={(e) => onChange({ ...form, description: e.target.value })}
        placeholder="Description"
        rows={2}
        className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white resize-none"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="number"
          min="1"
          value={form.duration}
          onChange={(e) => onChange({ ...form, duration: e.target.value })}
          placeholder="Duration (minutes)"
          className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
        />
        <input
          type="number"
          min="0"
          value={form.passingMarks}
          onChange={(e) => onChange({ ...form, passingMarks: e.target.value })}
          placeholder="Passing marks"
          className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="number"
          min="0"
          value={form.attemptLimit}
          onChange={(e) => onChange({ ...form, attemptLimit: e.target.value })}
          placeholder="Attempt limit (0 = unlimited)"
          className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
        />
        <div className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.isProctored}
            onChange={(e) => onChange({ ...form, isProctored: e.target.checked })}
          />
          Proctored test
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-white/70">
        <input
          type="checkbox"
          checked={form.isOpenTest}
          onChange={(e) => onChange({ ...form, isOpenTest: e.target.checked })}
        />
        Open test (no dates)
      </div>
      {!form.isOpenTest && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => onChange({ ...form, startTime: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
          />
          <input
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => onChange({ ...form, endTime: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
          />
        </div>
      )}
      <label className="flex flex-col gap-2 text-xs text-white/60">
        Upload CSV
        <input
          type="file"
          accept=".csv"
          onChange={(e) => onChange({ ...form, file: e.target.files?.[0] || null })}
          className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white"
        />
      </label>
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
    if (form.startTime) {
      payload.startTime = new Date(form.startTime).toISOString();
    }
    if (form.endTime) {
      payload.endTime = new Date(form.endTime).toISOString();
    }
  }

  return payload;
};

const toLocalDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};