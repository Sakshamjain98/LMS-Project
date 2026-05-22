import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  // New hierarchy
  getExamCategories,
  createExamCategory,
  updateExamCategory,
  deleteExamCategory,
  getExams,
  createExam,
  updateExam,
  deleteExam,
  assignTestSeriesToExam,
  getAITSByExam,
  createAITS,
  updateAITS,
  deleteAITS,
  createAITSTest,
} from "../../services/teacherService";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  BarChart2,
  BookOpen,
  GraduationCap,
  Trophy,
  Tag,
} from "lucide-react";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

// ─── Level definitions ──────────────────────────────────────────────────────
const LEVELS = ["categories", "exams", "series", "subjects", "chapters", "tests"];

const LEVEL_LABELS = {
  categories: "Exam Categories",
  exams: "Exams",
  series: "Test Series",
  subjects: "Subjects",
  chapters: "Chapters",
  tests: "Tests",
};

const LEVEL_ICON = {
  categories: Tag,
  exams: GraduationCap,
  series: Layers,
  subjects: BookOpen,
  chapters: Folder,
  tests: FileText,
};

const ICON_COLOR = {
  categories: "text-purple-400",
  exams: "text-sky-400",
  series: "text-brand-primary",
  subjects: "text-teal-400",
  chapters: "text-amber-400",
  tests: "text-brand-primary",
};

// ─── Empty form defaults ─────────────────────────────────────────────────────
const emptyEntityForm = { title: "", description: "", isPaid: false, price: 0, examId: "" };
const emptyTestForm = {
  title: "", description: "", duration: 60, passingMarks: 0, instructions: "",
  isPaid: false, attemptLimit: 0, isProctored: false, isOpenTest: true,
  startTime: "", endTime: "", type: "practice",
};
const emptyCsvForm = {
  title: "", description: "", duration: 60, passingMarks: 0, attemptLimit: 0,
  isProctored: false, isOpenTest: false, startTime: "", endTime: "", file: null, type: "practice",
};

const PAGE_SIZE = 10;

// ─── Main component ──────────────────────────────────────────────────────────
export default function AdminTestSeries() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [exams, setExams] = useState([]);
  const [aitsList, setAitsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "" });
  const [level, setLevel] = useState(params.get("level") || "categories");

  const [selectedCategoryId, setSelectedCategoryId] = useState(params.get("categoryId") || null);
  const [selectedExamId, setSelectedExamId] = useState(params.get("examId") || null);
  const [selectedTopicId, setSelectedTopicId] = useState(params.get("topicId") || null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(params.get("subjectId") || null);
  const [selectedChapterId, setSelectedChapterId] = useState(params.get("chapterId") || null);

  const [modalState, setModalState] = useState({ isOpen: false, type: null, mode: "create" });
  const [editingTestId, setEditingTestId] = useState(null);
  const [entityForm, setEntityForm] = useState(emptyEntityForm);
  const [testForm, setTestForm] = useState(emptyTestForm);
  const [csvForm, setCsvForm] = useState(emptyCsvForm);
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: null, id: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Track whether we're in the AITS sub-view at the exam level
  const [aitsView, setAitsView] = useState(false);
  const [selectedAitsId, setSelectedAitsId] = useState(params.get("aitsId") || null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [seriesRes, catsRes] = await Promise.all([
        getTeacherTestSeries().catch(() => ({ topics: [] })),
        getExamCategories().catch(() => ({ categories: [] })),
      ]);
      setTopics(seriesRes.topics || []);
      setCategories(catsRes.categories || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExams = useCallback(async (categoryId) => {
    if (!categoryId) { setExams([]); return; }
    try {
      const res = await getExams(categoryId);
      setExams(res.exams || []);
    } catch { setExams([]); }
  }, []);

  const fetchAITS = useCallback(async (examId) => {
    if (!examId) { setAitsList([]); return; }
    try {
      const res = await getAITSByExam(examId);
      setAitsList(res.aitsList || []);
    } catch { setAitsList([]); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (selectedCategoryId) fetchExams(selectedCategoryId);
  }, [selectedCategoryId, fetchExams]);

  useEffect(() => {
    if (selectedExamId) fetchAITS(selectedExamId);
  }, [selectedExamId, fetchAITS]);

  // Sync URL → state
  useEffect(() => {
    setLevel(params.get("level") || "categories");
    setSelectedCategoryId(params.get("categoryId") || null);
    setSelectedExamId(params.get("examId") || null);
    setSelectedTopicId(params.get("topicId") || null);
    setSelectedSubjectId(params.get("subjectId") || null);
    setSelectedChapterId(params.get("chapterId") || null);
    setAitsView(params.get("aitsView") === "1");
    setSelectedAitsId(params.get("aitsId") || null);
  }, [params]);

  const updateUrl = (next) => {
    const sp = new URLSearchParams();
    const merged = {
      level: next.level ?? level,
      categoryId: next.categoryId ?? selectedCategoryId,
      examId: next.examId ?? selectedExamId,
      topicId: next.topicId ?? selectedTopicId,
      subjectId: next.subjectId ?? selectedSubjectId,
      chapterId: next.chapterId ?? selectedChapterId,
      aitsView: next.aitsView ?? (aitsView ? "1" : undefined),
      aitsId: next.aitsId ?? selectedAitsId,
    };
    Object.entries(merged).forEach(([k, v]) => v && sp.set(k, v));
    setParams(sp, { replace: true });
  };

  // ─── Derived selections ───────────────────────────────────────────────────
  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );
  const selectedExam = useMemo(
    () => exams.find((e) => e._id === selectedExamId) || null,
    [exams, selectedExamId]
  );
  const selectedTopic = useMemo(
    () => topics.find((t) => t._id === selectedTopicId) || null,
    [topics, selectedTopicId]
  );
  const selectedSubject = useMemo(
    () => selectedTopic?.subjects?.find((s) => s._id === selectedSubjectId) || null,
    [selectedTopic, selectedSubjectId]
  );
  const selectedChapter = useMemo(
    () => selectedSubject?.chapters?.find((c) => c._id === selectedChapterId) || null,
    [selectedSubject, selectedChapterId]
  );
  const selectedAits = useMemo(
    () => aitsList.find((a) => a._id === selectedAitsId) || null,
    [aitsList, selectedAitsId]
  );

  // ─── Breadcrumb path ──────────────────────────────────────────────────────
  const hierarchyPath = useMemo(() => {
    const parts = [];
    if (selectedCategory) parts.push(selectedCategory.title);
    if (selectedExam) parts.push(selectedExam.title);
    if (aitsView) {
      parts.push("All India Test Series");
      if (selectedAits) parts.push(selectedAits.title);
    } else {
      if (selectedTopic) parts.push(selectedTopic.title);
      if (selectedSubject) parts.push(selectedSubject.title);
      if (selectedChapter) parts.push(selectedChapter.title);
    }
    return parts;
  }, [selectedCategory, selectedExam, aitsView, selectedAits, selectedTopic, selectedSubject, selectedChapter]);

  // ─── Rows to display ─────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let rows = [];

    if (aitsView) {
      if (!selectedAitsId) rows = aitsList;
      else rows = selectedAits?.tests || [];
    } else {
      if (level === "categories") rows = categories;
      else if (level === "exams") rows = exams;
      else if (level === "series") rows = topics.filter((t) => !selectedExamId || t.examId === selectedExamId);
      else if (level === "subjects") rows = selectedTopic?.subjects || [];
      else if (level === "chapters") rows = selectedSubject?.chapters || [];
      else rows = selectedChapter?.tests || [];
    }

    return q ? rows.filter((r) => (r.title || "").toLowerCase().includes(q)) : rows;
  }, [filters.search, level, categories, exams, topics, selectedTopic, selectedSubject, selectedChapter, aitsList, selectedAits, selectedAitsId, selectedExamId, aitsView]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );

  useEffect(() => { setPage(1); }, [filters.search, level, selectedCategoryId, selectedExamId, selectedTopicId, selectedSubjectId, selectedChapterId, aitsView, selectedAitsId]);

  // ─── Effective level for display ─────────────────────────────────────────
  const effectiveLevel = aitsView ? (selectedAitsId ? "tests" : "aits") : level;

  const headerTitle = aitsView
    ? (selectedAitsId ? `AITS: ${selectedAits?.title || ""}` : "All India Test Series")
    : LEVEL_LABELS[level] || level;

  const actionLabel = aitsView
    ? (selectedAitsId ? "Create AITS Test" : "Create AITS Section")
    : level === "categories" ? "Create Category"
    : level === "exams" ? "Create Exam"
    : level === "series" ? "Create Test Series"
    : level === "subjects" ? "Create Subject"
    : level === "chapters" ? "Create Chapter"
    : "Create Test";

  // ─── Modal open/close ─────────────────────────────────────────────────────
  const openModal = (type, mode, data = null) => {
    setModalState({ isOpen: true, type, mode });
    if (type === "test") {
      if (mode === "edit" && data) {
        setEditingTestId(data._id);
        setTestForm({
          title: data.title || "", description: data.description || "",
          duration: data.duration || 60, passingMarks: data.passingMarks || 0,
          instructions: data.instructions || "", isPaid: Boolean(data.isPaid),
          attemptLimit: data.attemptLimit || 0, isProctored: Boolean(data.isProctored),
          isOpenTest: !(data.startTime || data.endTime),
          startTime: data.startTime ? toLocalDateTime(data.startTime) : "",
          endTime: data.endTime ? toLocalDateTime(data.endTime) : "",
          type: data.type || "practice",
        });
      } else {
        setEditingTestId(null);
        setTestForm({ ...emptyTestForm, type: aitsView ? "aits" : "practice" });
      }
      return;
    }
    if (type === "csv") { setCsvForm({ ...emptyCsvForm, type: aitsView ? "aits" : "practice" }); return; }
    if (mode === "edit" && data) {
      setEntityForm({
        title: data.title || "", description: data.description || "",
        isPaid: Boolean(data.isPaid), price: Number(data.price) || 0, examId: data.examId || "",
      });
    } else {
      setEntityForm({ ...emptyEntityForm, examId: selectedExamId || "" });
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, mode: "create" });
    setEntityForm(emptyEntityForm);
    setTestForm(emptyTestForm);
    setCsvForm(emptyCsvForm);
    setEditingTestId(null);
  };

  // ─── Create / Update handlers ─────────────────────────────────────────────
  const handleCreateEntity = async () => {
    if (!entityForm.title.trim()) return;
    setActionLoading(true);
    try {
      if (aitsView) {
        await createAITS({ ...entityForm, examId: selectedExamId });
        await fetchAITS(selectedExamId);
      } else if (level === "categories") {
        await createExamCategory(entityForm);
        await fetchData();
      } else if (level === "exams") {
        await createExam({ ...entityForm, examCategoryId: selectedCategoryId });
        await fetchExams(selectedCategoryId);
      } else if (level === "series") {
        await createTestSeriesTopic({ ...entityForm, examId: selectedExamId || null });
        await fetchData();
      } else if (level === "subjects") {
        await createTestSeriesSubject(selectedTopicId, entityForm);
        await fetchData();
      } else if (level === "chapters") {
        await createTestSeriesChapter(selectedSubjectId, entityForm);
        await fetchData();
      }
      closeModal();
    } finally { setActionLoading(false); }
  };

  const handleUpdateEntity = async () => {
    if (!entityForm.title.trim()) return;
    setActionLoading(true);
    try {
      if (aitsView && !selectedAitsId) {
        await updateAITS(/* edited aits id from confirmState or modal context */ null, entityForm);
      } else if (level === "categories") {
        await updateExamCategory(selectedCategoryId, entityForm);
        await fetchData();
      } else if (level === "exams") {
        await updateExam(selectedExamId, entityForm);
        await fetchExams(selectedCategoryId);
      } else if (level === "series") {
        await updateTestSeriesTopic(selectedTopicId, entityForm);
        await fetchData();
      } else if (level === "subjects") {
        await updateTestSeriesSubject(selectedSubjectId, entityForm);
        await fetchData();
      } else if (level === "chapters") {
        await updateTestSeriesChapter(selectedChapterId, entityForm);
        await fetchData();
      }
      closeModal();
    } finally { setActionLoading(false); }
  };

  const handleCreateTest = async () => {
    if (!testForm.title.trim()) return;
    setActionLoading(true);
    try {
      const payload = buildTestPayload(testForm);
      if (modalState.mode === "edit" && editingTestId) {
        await updateTeacherTest(editingTestId, payload);
      } else if (aitsView && selectedAitsId) {
        await createAITSTest(selectedAitsId, { ...payload, type: "aits" });
        await fetchAITS(selectedExamId);
      } else {
        await createTestSeriesTest(selectedChapterId, { ...payload, type: testForm.type });
      }
      await fetchData();
      closeModal();
    } finally { setActionLoading(false); }
  };

  const handleUploadCsv = async () => {
    if ((!selectedChapterId && !selectedAitsId) || !csvForm.file) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", csvForm.file);
      formData.append("title", csvForm.title.trim() || "CSV Imported Test");
      formData.append("description", csvForm.description.trim());
      formData.append("duration", String(Number(csvForm.duration) || 60));
      formData.append("passingMarks", String(Number(csvForm.passingMarks) || 0));
      formData.append("attemptLimit", String(Number(csvForm.attemptLimit) || 0));
      formData.append("isProctored", String(Boolean(csvForm.isProctored)));
      formData.append("isOpenTest", String(Boolean(csvForm.isOpenTest)));
      formData.append("type", csvForm.type || "practice");
      if (selectedAitsId) {
        formData.append("aitsId", selectedAitsId);
      } else {
        formData.append("chapterId", selectedChapterId);
      }
      if (!csvForm.isOpenTest) {
        if (csvForm.startTime) formData.append("startTime", new Date(csvForm.startTime).toISOString());
        if (csvForm.endTime) formData.append("endTime", new Date(csvForm.endTime).toISOString());
      }
      await uploadTestCSV(formData);
      await fetchData();
      if (selectedAitsId) await fetchAITS(selectedExamId);
      closeModal();
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const { type, id } = confirmState;
      if (type === "category") { await deleteExamCategory(id); await fetchData(); setSelectedCategoryId(null); }
      if (type === "exam") { await deleteExam(id); await fetchExams(selectedCategoryId); setSelectedExamId(null); }
      if (type === "aits") { await deleteAITS(id); await fetchAITS(selectedExamId); }
      if (type === "topic") { await deleteTestSeriesTopic(id); setSelectedTopicId(null); setSelectedSubjectId(null); setSelectedChapterId(null); }
      if (type === "subject") { await deleteTestSeriesSubject(id); setSelectedSubjectId(null); setSelectedChapterId(null); }
      if (type === "chapter") { await deleteTestSeriesChapter(id); setSelectedChapterId(null); }
      if (type === "test") await deleteTeacherTest(id);
      await fetchData();
    } finally {
      setActionLoading(false);
      setConfirmState({ isOpen: false, type: null, id: null });
    }
  };

  // ─── Row select (drill-down) ──────────────────────────────────────────────
  const handleRowSelect = (row) => {
    if (aitsView) {
      if (!selectedAitsId) {
        updateUrl({ aitsView: "1", aitsId: row._id });
      } else {
        navigate(`/admin/test-series/test/${row._id}`);
      }
      return;
    }
    if (level === "categories") {
      updateUrl({ level: "exams", categoryId: row._id, examId: null, topicId: null, subjectId: null, chapterId: null });
    } else if (level === "exams") {
      updateUrl({ level: "series", examId: row._id, topicId: null, subjectId: null, chapterId: null });
    } else if (level === "series") {
      updateUrl({ level: "subjects", topicId: row._id, subjectId: null, chapterId: null });
    } else if (level === "subjects") {
      updateUrl({ level: "chapters", subjectId: row._id, chapterId: null });
    } else if (level === "chapters") {
      updateUrl({ level: "tests", chapterId: row._id });
    } else {
      navigate(`/admin/test-series/test/${row._id}`);
    }
  };

  const goBack = () => {
    if (aitsView) {
      if (selectedAitsId) updateUrl({ aitsView: "1", aitsId: null });
      else updateUrl({ aitsView: undefined, level: "exams" });
      return;
    }
    if (level === "exams") updateUrl({ level: "categories" });
    else if (level === "series") updateUrl({ level: "exams" });
    else if (level === "subjects") updateUrl({ level: "series" });
    else if (level === "chapters") updateUrl({ level: "subjects" });
    else if (level === "tests") updateUrl({ level: "chapters" });
  };

  const canGoBack = level !== "categories" || aitsView;

  // ─── Determine modal entity type for edit ────────────────────────────────
  const handleEditRow = (row) => {
    if (aitsView && !selectedAitsId) {
      // editing an AITS section — store id for update
      setEntityForm({ title: row.title, description: row.description || "", isPaid: Boolean(row.isPaid), price: Number(row.price) || 0, examId: selectedExamId });
      setModalState({ isOpen: true, type: "entity", mode: "edit", editId: row._id });
      return;
    }
    if (level === "tests" || (aitsView && selectedAitsId)) {
      navigate(`/admin/test-series/test/${row._id}`);
      return;
    }
    openModal("entity", "edit", row);
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
          {canGoBack && (
            <button onClick={goBack} className="rounded-xl glass-pill px-4 py-2 text-sm font-medium text-white/80 hover:text-white">
              ← Back
            </button>
          )}

          {/* AITS toggle — visible at exam level */}
          {level === "exams" && selectedExamId && !aitsView && (
            <button
              onClick={() => updateUrl({ aitsView: "1", aitsId: null })}
              className="flex items-center gap-2 rounded-xl glass-pill px-4 py-2 text-sm font-medium text-amber-300 hover:text-white border border-amber-400/30"
            >
              <Trophy size={15} /> All India Test Series
            </button>
          )}

          <button
            onClick={() => openModal(
              (level === "tests" || (aitsView && selectedAitsId)) ? "test" : "entity",
              "create"
            )}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-400 transition hover:brightness-110"
          >
            <Plus size={16} /> {actionLabel}
          </button>

          {(level === "tests" || (aitsView && selectedAitsId)) && (
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
        <div className="relative min-w-65 flex-1">
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
              <tr className="border-b border-white/10 bg-white/3">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Description</th>
                {(level === "tests" || (aitsView && selectedAitsId)) && (
                  <>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Type</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Status</th>
                  </>
                )}
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-white/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-white/40">Loading...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-white/40">No records found.</td></tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const isTestLevel = level === "tests" || (aitsView && selectedAitsId);
                  const LevelIcon = aitsView && !selectedAitsId
                    ? Trophy
                    : LEVEL_ICON[level] || FileText;
                  const iconColor = aitsView ? "text-amber-400" : (ICON_COLOR[level] || "text-brand-primary");
                  return (
                    <tr key={row._id} className="transition-colors hover:bg-white/4 animate-fade-up" style={{ animationDelay: `${idx * 25}ms` }}>
                      <td className="px-6 py-4 text-sm font-semibold text-white cursor-pointer" onClick={() => handleRowSelect(row)}>
                        <div className="flex items-center gap-2">
                          <LevelIcon size={14} className={iconColor} />
                          {row.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/50">{row.description || "—"}</td>
                      {isTestLevel && (
                        <>
                          <td className="px-6 py-4 text-xs">
                            <TypeBadge type={row.type} />
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <span className={`rounded-full px-2 py-1 font-semibold uppercase tracking-wider ${
                              row.status === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/60"
                            }`}>
                              {row.status || "draft"}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isTestLevel && (
                            <button onClick={() => handleRowSelect(row)} className="rounded-lg glass-pill px-3 py-1.5 text-xs text-white/80 hover:text-white">
                              View
                            </button>
                          )}
                          {level === "series" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/admin/test-series/${row._id}/analytics`); }}
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-primary/15 px-3 py-1.5 text-xs font-bold text-brand-primary hover:bg-brand-primary/25"
                            >
                              <BarChart2 size={12} /> Analytics
                            </button>
                          )}
                          <button
                            onClick={() => handleEditRow(row)}
                            className="rounded-lg glass-pill p-2 text-white/70 hover:text-white"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmState({
                              isOpen: true,
                              type: aitsView && !selectedAitsId ? "aits"
                                : level === "categories" ? "category"
                                : level === "exams" ? "exam"
                                : level === "series" ? "topic"
                                : level === "subjects" ? "subject"
                                : level === "chapters" ? "chapter"
                                : "test",
                              id: row._id,
                            })}
                            className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRows.length > PAGE_SIZE && (
        <PaginationBar page={page} totalPages={totalPages} totalCount={filteredRows.length} pageSize={PAGE_SIZE} onChange={setPage} />
      )}

      {/* Entity modal (category / exam / series / subject / chapter / aits) */}
      <Modal
        isOpen={modalState.isOpen && modalState.type === "entity"}
        title={`${modalState.mode === "edit" ? "Edit" : "Create"} ${
          aitsView ? "AITS Section"
          : level === "categories" ? "Exam Category"
          : level === "exams" ? "Exam"
          : level === "series" ? "Test Series"
          : level === "subjects" ? "Subject"
          : "Chapter"
        }`}
        onClose={closeModal}
      >
        <EntityForm
          form={entityForm}
          onChange={setEntityForm}
          level={aitsView ? "aits" : level}
          categories={categories}
          exams={exams}
          selectedCategoryId={selectedCategoryId}
        />
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={closeModal} className="rounded-lg glass-pill px-4 py-2 text-sm text-white/80">Cancel</button>
          <button
            onClick={modalState.mode === "edit" ? handleUpdateEntity : handleCreateEntity}
            disabled={actionLoading}
            className="rounded-lg btn-gradient px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            {actionLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      {/* Test modal */}
      <Modal isOpen={modalState.isOpen && modalState.type === "test"} title={modalState.mode === "edit" ? "Edit Test" : "Create Test"} onClose={closeModal}>
        <TestForm form={testForm} onChange={setTestForm} showTypeSelector={!aitsView} />
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={closeModal} className="rounded-lg glass-pill px-4 py-2 text-sm text-white/80">Cancel</button>
          <button onClick={handleCreateTest} disabled={actionLoading} className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-dark-400">
            {actionLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      {/* CSV modal */}
      <Modal isOpen={modalState.isOpen && modalState.type === "csv"} title="Upload CSV Test" onClose={closeModal}>
        <CsvForm form={csvForm} onChange={setCsvForm} showTypeSelector={!aitsView} />
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
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  if (type === "pyq") return <span className="rounded-full bg-purple-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">PYQ</span>;
  if (type === "aits") return <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">AITS</span>;
  return <span className="rounded-full bg-sky-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-300">Practice</span>;
}

function PaginationBar({ page, totalPages, totalCount, pageSize, onChange }) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
      <span>Showing <span className="font-bold text-white">{start}</span>–<span className="font-bold text-white">{end}</span> of <span className="font-bold text-white">{totalCount}</span></span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="inline-flex items-center gap-1 rounded-lg glass-pill px-3 py-1.5 font-semibold disabled:opacity-30">
          <ChevronLeft size={12} /> Prev
        </button>
        <span className="px-2 font-semibold text-white">{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="inline-flex items-center gap-1 rounded-lg glass-pill px-3 py-1.5 font-semibold disabled:opacity-30">
          Next <ChevronRight size={12} />
        </button>
      </div>
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
        {label}{required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}

const fi = "w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-primary focus:outline-none transition-colors";
const fc = "h-4 w-4 rounded border-white/20 bg-dark-300 accent-brand-primary";

function EntityForm({ form, onChange, level, categories, exams, selectedCategoryId }) {
  return (
    <div className="space-y-4">
      <FieldLabel label="Title" required>
        <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder={level === "categories" ? "e.g. Medical" : level === "exams" ? "e.g. NEET" : level === "series" ? "e.g. NEET Full Series 2026" : "Title"}
          className={fi} />
      </FieldLabel>
      <FieldLabel label="Description">
        <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })}
          rows={2} placeholder="Short description..." className={`${fi} resize-none`} />
      </FieldLabel>

      {/* For exams: select parent category */}
      {level === "exams" && (
        <FieldLabel label="Parent Category" required>
          <select value={form.examCategoryId || selectedCategoryId || ""}
            onChange={(e) => onChange({ ...form, examCategoryId: e.target.value })}
            className={fi}>
            <option value="">Select category...</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </FieldLabel>
      )}

      {/* For test series: select parent exam (optional) */}
      {level === "series" && exams.length > 0 && (
        <FieldLabel label="Parent Exam" hint="Assign this test series to an exam.">
          <select value={form.examId || ""}
            onChange={(e) => onChange({ ...form, examId: e.target.value })}
            className={fi}>
            <option value="">Unassigned</option>
            {exams.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
        </FieldLabel>
      )}

      {/* Pricing — for series and AITS */}
      {(level === "series" || level === "aits") && (
        <>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white/80 cursor-pointer">
            <input type="checkbox" className={fc} checked={Boolean(form.isPaid)}
              onChange={(e) => onChange({ ...form, isPaid: e.target.checked })} />
            <span>Paid <span className="block text-[10px] text-white/40">Students pay once to access.</span></span>
          </label>
          {form.isPaid && (
            <FieldLabel label="Price (₹)" required>
              <input type="number" min="0" value={form.price ?? 0}
                onChange={(e) => onChange({ ...form, price: Number(e.target.value) })}
                placeholder="999" className={fi} />
            </FieldLabel>
          )}
        </>
      )}
    </div>
  );
}

function TestForm({ form, onChange, showTypeSelector = true }) {
  return (
    <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
      <FieldLabel label="Test Title" required>
        <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} placeholder="e.g. Mock Test 1" className={fi} />
      </FieldLabel>
      <FieldLabel label="Description">
        <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} rows={2} className={`${fi} resize-none`} />
      </FieldLabel>

      {showTypeSelector && (
        <FieldLabel label="Test Type" hint="Practice = regular chapter test. PYQ = past year question paper.">
          <div className="flex gap-2">
            {["practice", "pyq"].map((t) => (
              <button key={t} type="button"
                onClick={() => onChange({ ...form, type: t })}
                className={`flex-1 rounded-xl border py-2 text-xs font-bold uppercase tracking-wider transition ${
                  form.type === t ? "border-brand-primary bg-brand-primary/15 text-brand-primary" : "border-white/10 bg-dark-300 text-white/50"
                }`}>
                {t === "practice" ? "Practice Test" : "PYQ Test"}
              </button>
            ))}
          </div>
        </FieldLabel>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldLabel label="Duration (min)" required>
          <input type="number" min="1" value={form.duration} onChange={(e) => onChange({ ...form, duration: e.target.value })} placeholder="60" className={fi} />
        </FieldLabel>
        <FieldLabel label="Passing Marks">
          <input type="number" min="0" value={form.passingMarks} onChange={(e) => onChange({ ...form, passingMarks: e.target.value })} placeholder="40" className={fi} />
        </FieldLabel>
      </div>
      <FieldLabel label="Instructions">
        <textarea value={form.instructions} onChange={(e) => onChange({ ...form, instructions: e.target.value })} rows={2} className={`${fi} resize-none`} />
      </FieldLabel>
      <label className="flex items-center gap-2 text-sm text-white/80 rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 cursor-pointer">
        <input type="checkbox" className={fc} checked={form.isProctored} onChange={(e) => onChange({ ...form, isProctored: e.target.checked })} />
        <span>Proctored <span className="block text-[10px] text-white/40">Forces fullscreen + tab-switch detection.</span></span>
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldLabel label="Attempt Limit" hint="0 = unlimited.">
          <input type="number" min="0" value={form.attemptLimit} onChange={(e) => onChange({ ...form, attemptLimit: e.target.value })} placeholder="0" className={fi} />
        </FieldLabel>
        <label className="flex items-center gap-2 text-sm text-white/80 rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 cursor-pointer self-end h-11.5">
          <input type="checkbox" className={fc} checked={form.isOpenTest} onChange={(e) => onChange({ ...form, isOpenTest: e.target.checked })} />
          <span>Open Test <span className="block text-[10px] text-white/40">Available anytime.</span></span>
        </label>
      </div>
      {!form.isOpenTest && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldLabel label="Starts At">
            <input type="datetime-local" value={form.startTime} onChange={(e) => onChange({ ...form, startTime: e.target.value })} className={fi} />
          </FieldLabel>
          <FieldLabel label="Ends At">
            <input type="datetime-local" value={form.endTime} onChange={(e) => onChange({ ...form, endTime: e.target.value })} className={fi} />
          </FieldLabel>
        </div>
      )}
    </div>
  );
}

function CsvForm({ form, onChange, showTypeSelector = true }) {
  return (
    <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
      <FieldLabel label="Test Title" required>
        <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} placeholder="e.g. NEET PYQ 2024" className={fi} />
      </FieldLabel>
      <FieldLabel label="Description">
        <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} rows={2} className={`${fi} resize-none`} />
      </FieldLabel>
      {showTypeSelector && (
        <FieldLabel label="Test Type">
          <div className="flex gap-2">
            {["practice", "pyq"].map((t) => (
              <button key={t} type="button" onClick={() => onChange({ ...form, type: t })}
                className={`flex-1 rounded-xl border py-2 text-xs font-bold uppercase tracking-wider transition ${
                  form.type === t ? "border-brand-primary bg-brand-primary/15 text-brand-primary" : "border-white/10 bg-dark-300 text-white/50"
                }`}>
                {t === "practice" ? "Practice" : "PYQ"}
              </button>
            ))}
          </div>
        </FieldLabel>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldLabel label="Duration (min)" required>
          <input type="number" min="1" value={form.duration} onChange={(e) => onChange({ ...form, duration: e.target.value })} placeholder="60" className={fi} />
        </FieldLabel>
        <FieldLabel label="Passing Marks">
          <input type="number" min="0" value={form.passingMarks} onChange={(e) => onChange({ ...form, passingMarks: e.target.value })} placeholder="40" className={fi} />
        </FieldLabel>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldLabel label="Attempt Limit" hint="0 = unlimited.">
          <input type="number" min="0" value={form.attemptLimit} onChange={(e) => onChange({ ...form, attemptLimit: e.target.value })} placeholder="0" className={fi} />
        </FieldLabel>
        <label className="flex items-center gap-2 text-sm text-white/80 rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 cursor-pointer self-end h-11.5">
          <input type="checkbox" className={fc} checked={form.isProctored} onChange={(e) => onChange({ ...form, isProctored: e.target.checked })} />
          Proctored
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-white/80 rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 cursor-pointer">
        <input type="checkbox" className={fc} checked={form.isOpenTest} onChange={(e) => onChange({ ...form, isOpenTest: e.target.checked })} />
        Open Test (no schedule)
      </label>
      {!form.isOpenTest && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldLabel label="Starts At"><input type="datetime-local" value={form.startTime} onChange={(e) => onChange({ ...form, startTime: e.target.value })} className={fi} /></FieldLabel>
          <FieldLabel label="Ends At"><input type="datetime-local" value={form.endTime} onChange={(e) => onChange({ ...form, endTime: e.target.value })} className={fi} /></FieldLabel>
        </div>
      )}
      <FieldLabel label="CSV File" hint="Columns: questionText, optionA-D, correctIndex (0-3), marks." required>
        <input type="file" accept=".csv" onChange={(e) => onChange({ ...form, file: e.target.files?.[0] || null })} className={fi} />
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
    type: form.type || "practice",
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
