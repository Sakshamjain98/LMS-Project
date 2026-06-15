import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTeacherFullHierarchy,
  createAITS,
  updateAITS,
  deleteAITS,
  getAITSByExam,
  createAITSTest,
  deleteTeacherTest,
  uploadTestCSV,
  publishTeacherTest,
} from "../../services/teacherService";
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Search,
  GraduationCap,
  Tag,
  Lock,
  Unlock,
  FileText,
  IndianRupee,
  ChevronLeft,
  UploadCloud,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Send,
  EyeOff,
} from "lucide-react";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import toast from "react-hot-toast";

// ── helpers ──────────────────────────────────────────────────────────────────
const emptyAitsForm   = { title: "", description: "", isPaid: false, price: 0, examId: "" };
const emptyTestForm   = {
  title: "", description: "", duration: 60, passingMarks: 0,
  instructions: "", attemptLimit: 0, isProctored: false, isOpenTest: true,
  startTime: "", endTime: "",
};
const emptyCsvForm    = {
  title: "", description: "", duration: 60, passingMarks: 0,
  attemptLimit: 0, isProctored: false, isOpenTest: true,
  startTime: "", endTime: "", file: null,
};

const fi = "w-full rounded-xl border border-white/10 bg-dark-300/70 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors";
const fc = "h-4 w-4 rounded border-white/20 bg-dark-300 accent-brand-primary";

const buildPayload = (f) => {
  const p = {
    title: f.title.trim(), description: f.description.trim(),
    duration: Number(f.duration) || 60, passingMarks: Number(f.passingMarks) || 0,
    instructions: f.instructions?.trim() || "", attemptLimit: Number(f.attemptLimit) || 0,
    isProctored: Boolean(f.isProctored), type: "aits",
  };
  if (!f.isOpenTest) {
    if (f.startTime) p.startTime = new Date(f.startTime).toISOString();
    if (f.endTime)   p.endTime   = new Date(f.endTime).toISOString();
  }
  return p;
};

// ── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === "published")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
        <CheckCircle2 size={9} /> Published
      </span>
    );
  if (status === "scheduled")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
        <Clock size={9} /> Scheduled
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-white/50">
      <AlertCircle size={9} /> Draft
    </span>
  );
}

// ── FieldLabel ───────────────────────────────────────────────────────────────
function FieldLabel({ label, hint, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/60">
        {label}{required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-white/35">{hint}</p>}
    </div>
  );
}

// ── TestFormFields ────────────────────────────────────────────────────────────
function TestFormFields({ form, onChange }) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
      <FieldLabel label="Title" required>
        <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="e.g. AITS Mock Test 1" className={fi} />
      </FieldLabel>
      <FieldLabel label="Description">
        <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })}
          rows={2} className={`${fi} resize-none`} />
      </FieldLabel>
      <div className="grid grid-cols-2 gap-3">
        <FieldLabel label="Duration (min)" required>
          <input type="number" min="1" value={form.duration}
            onChange={(e) => onChange({ ...form, duration: e.target.value })} placeholder="60" className={fi} />
        </FieldLabel>
        <FieldLabel label="Passing Marks">
          <input type="number" min="0" value={form.passingMarks}
            onChange={(e) => onChange({ ...form, passingMarks: e.target.value })} placeholder="0" className={fi} />
        </FieldLabel>
      </div>
      <FieldLabel label="Instructions">
        <textarea value={form.instructions} onChange={(e) => onChange({ ...form, instructions: e.target.value })}
          rows={2} className={`${fi} resize-none`} placeholder="Optional instructions for students…" />
      </FieldLabel>
      <div className="grid grid-cols-2 gap-3">
        <FieldLabel label="Attempt Limit" hint="0 = unlimited">
          <input type="number" min="0" value={form.attemptLimit}
            onChange={(e) => onChange({ ...form, attemptLimit: e.target.value })} placeholder="0" className={fi} />
        </FieldLabel>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-dark-300/70 px-4 py-2.5 self-end">
          <input type="checkbox" className={fc} checked={form.isProctored}
            onChange={(e) => onChange({ ...form, isProctored: e.target.checked })} />
          <span className="text-sm text-white/80">Proctored</span>
        </label>
      </div>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-dark-300/70 px-4 py-2.5">
        <input type="checkbox" className={fc} checked={form.isOpenTest}
          onChange={(e) => onChange({ ...form, isOpenTest: e.target.checked })} />
        <div>
          <span className="text-sm text-white/80">Open Test</span>
          <p className="text-[10px] text-white/35">Available any time — no schedule window.</p>
        </div>
      </label>
      {!form.isOpenTest && (
        <div className="grid grid-cols-2 gap-3">
          <FieldLabel label="Starts At">
            <input type="datetime-local" value={form.startTime}
              onChange={(e) => onChange({ ...form, startTime: e.target.value })} className={fi} />
          </FieldLabel>
          <FieldLabel label="Ends At">
            <input type="datetime-local" value={form.endTime}
              onChange={(e) => onChange({ ...form, endTime: e.target.value })} className={fi} />
          </FieldLabel>
        </div>
      )}
    </div>
  );
}

// ── CsvFormFields ─────────────────────────────────────────────────────────────
function CsvFormFields({ form, onChange }) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
      <FieldLabel label="Test Title" required>
        <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="e.g. AITS 2025 Full Mock" className={fi} />
      </FieldLabel>
      <FieldLabel label="Description">
        <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })}
          rows={2} className={`${fi} resize-none`} />
      </FieldLabel>
      <div className="grid grid-cols-2 gap-3">
        <FieldLabel label="Duration (min)" required>
          <input type="number" min="1" value={form.duration}
            onChange={(e) => onChange({ ...form, duration: e.target.value })} placeholder="60" className={fi} />
        </FieldLabel>
        <FieldLabel label="Passing Marks">
          <input type="number" min="0" value={form.passingMarks}
            onChange={(e) => onChange({ ...form, passingMarks: e.target.value })} placeholder="0" className={fi} />
        </FieldLabel>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldLabel label="Attempt Limit" hint="0 = unlimited">
          <input type="number" min="0" value={form.attemptLimit}
            onChange={(e) => onChange({ ...form, attemptLimit: e.target.value })} placeholder="0" className={fi} />
        </FieldLabel>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-dark-300/70 px-4 py-2.5 self-end">
          <input type="checkbox" className={fc} checked={form.isProctored}
            onChange={(e) => onChange({ ...form, isProctored: e.target.checked })} />
          <span className="text-sm text-white/80">Proctored</span>
        </label>
      </div>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-dark-300/70 px-4 py-2.5">
        <input type="checkbox" className={fc} checked={form.isOpenTest}
          onChange={(e) => onChange({ ...form, isOpenTest: e.target.checked })} />
        <span className="text-sm text-white/80">Open Test (no schedule)</span>
      </label>
      {!form.isOpenTest && (
        <div className="grid grid-cols-2 gap-3">
          <FieldLabel label="Starts At">
            <input type="datetime-local" value={form.startTime}
              onChange={(e) => onChange({ ...form, startTime: e.target.value })} className={fi} />
          </FieldLabel>
          <FieldLabel label="Ends At">
            <input type="datetime-local" value={form.endTime}
              onChange={(e) => onChange({ ...form, endTime: e.target.value })} className={fi} />
          </FieldLabel>
        </div>
      )}
      <FieldLabel label="CSV File" hint="Columns: question, optionA, optionB, optionC, optionD, answer (1-4 or A-D), marks, explanation (optional)." required>
        <input type="file" accept=".csv"
          onChange={(e) => onChange({ ...form, file: e.target.files?.[0] || null })}
          className={fi} />
      </FieldLabel>
    </div>
  );
}

// ── SideModal ─────────────────────────────────────────────────────────────────
function SideModal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl glass-card border border-white/10 p-6 shadow-2xl animate-fade-up">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/50 hover:bg-white/8 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2 border-t border-white/8 pt-4">{footer}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AITSManager() {
  const navigate = useNavigate();

  // ── hierarchy data ──
  const [hierarchy, setHierarchy]   = useState([]);
  const [loadingHier, setLoadingHier] = useState(true);

  // ── AITS + tests for selected exam ──
  const [selectedAits, setSelectedAits]     = useState(null);   // full AITS object
  const [aitsTests, setAitsTests]           = useState([]);
  const [loadingTests, setLoadingTests]     = useState(false);

  // ── search ──
  const [search, setSearch] = useState("");

  // ── AITS modals ──
  const [aitsModal, setAitsModal]     = useState({ open: false, mode: "create", editId: null });
  const [aitsForm, setAitsForm]       = useState(emptyAitsForm);

  // ── test modals ──
  const [testModal, setTestModal]     = useState({ open: false, mode: "manual" }); // mode: manual | csv
  const [testForm, setTestForm]       = useState(emptyTestForm);
  const [csvForm, setCsvForm]         = useState(emptyCsvForm);

  // ── confirm delete ──
  const [confirm, setConfirm] = useState({ open: false, type: null, id: null });
  const [actionLoading, setActionLoading] = useState(false);

  // ── load full hierarchy ──────────────────────────────────────────────────
  const loadHierarchy = useCallback(async () => {
    try {
      setLoadingHier(true);
      const res = await getTeacherFullHierarchy();
      setHierarchy(res?.categories || []);
    } finally {
      setLoadingHier(false);
    }
  }, []);

  useEffect(() => { loadHierarchy(); }, [loadHierarchy]);

  // ── flatten all AITS ────────────────────────────────────────────────────
  const allAITS = useMemo(() => {
    const out = [];
    for (const cat of hierarchy) {
      for (const exam of cat.exams || []) {
        for (const a of exam.allIndiaTestSeries || []) {
          out.push({ ...a, examTitle: exam.title, examId: exam._id, examObj: exam, categoryTitle: cat.title, categoryId: cat._id });
        }
      }
    }
    return out;
  }, [hierarchy]);

  const allExams = useMemo(() => {
    const out = [];
    for (const cat of hierarchy) {
      for (const exam of cat.exams || []) {
        out.push({ _id: exam._id, title: exam.title, categoryTitle: cat.title });
      }
    }
    return out;
  }, [hierarchy]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? allAITS.filter((a) => a.title.toLowerCase().includes(q) || a.examTitle.toLowerCase().includes(q)) : allAITS;
  }, [allAITS, search]);

  // ── drill into an AITS to see / manage tests ─────────────────────────────
  const openAitsTests = useCallback(async (aits) => {
    setSelectedAits(aits);
    setLoadingTests(true);
    try {
      const res = await getAITSByExam(aits.examId);
      const found = (res.aitsList || []).find((a) => a._id === aits._id);
      setAitsTests(found?.tests || []);
    } catch { setAitsTests([]); }
    finally { setLoadingTests(false); }
  }, []);

  const refreshTests = useCallback(async () => {
    if (!selectedAits) return;
    try {
      const res = await getAITSByExam(selectedAits.examId);
      const found = (res.aitsList || []).find((a) => a._id === selectedAits._id);
      setAitsTests(found?.tests || []);
    } catch (error) {
      void error;
    }
  }, [selectedAits]);

  // ── AITS create/edit ─────────────────────────────────────────────────────
  const openCreateAits = () => {
    setAitsForm({ ...emptyAitsForm, examId: allExams[0]?._id || "" });
    setAitsModal({ open: true, mode: "create", editId: null });
  };
  const openEditAits = (a) => {
    setAitsForm({ title: a.title, description: a.description || "", isPaid: Boolean(a.isPaid), price: Number(a.price) || 0, examId: a.examId });
    setAitsModal({ open: true, mode: "edit", editId: a._id });
  };
  const closeAitsModal = () => { setAitsModal({ open: false, mode: "create", editId: null }); setAitsForm(emptyAitsForm); };

  const handleSaveAits = async () => {
    if (!aitsForm.title.trim() || !aitsForm.examId) return;
    setActionLoading(true);
    try {
      const payload = {
        title: aitsForm.title.trim(), description: aitsForm.description.trim(),
        isPaid: aitsForm.isPaid, price: aitsForm.isPaid ? Math.max(0, Number(aitsForm.price) || 0) : 0,
        examId: aitsForm.examId,
      };
      if (aitsModal.mode === "edit") await updateAITS(aitsModal.editId, payload);
      else await createAITS(payload);
      await loadHierarchy();
      closeAitsModal();
    } finally { setActionLoading(false); }
  };

  const handleTogglePaid = async (a) => {
    try {
      await updateAITS(a._id, { title: a.title, description: a.description || "", isPaid: !a.isPaid, price: !a.isPaid ? (a.price || 0) : 0, examId: a.examId });
      await loadHierarchy();
      if (selectedAits?._id === a._id) setSelectedAits((prev) => ({ ...prev, isPaid: !a.isPaid, price: !a.isPaid ? (a.price || 0) : 0 }));
    } catch (error) {
      void error;
    }
  };

  // ── Test create ──────────────────────────────────────────────────────────
  const handleCreateTest = async () => {
    if (!testForm.title.trim()) return;
    if (testForm.title.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }
    setActionLoading(true);
    try {
      await createAITSTest(selectedAits._id, buildPayload(testForm));
      await refreshTests();
      setTestModal({ open: false, mode: "manual" });
      setTestForm(emptyTestForm);
      toast.success("Test created");
    } catch (err) {
      toast.error(err?.message || "Failed to create test");
    } finally { setActionLoading(false); }
  };

  const handleUploadCsv = async () => {
    if (!csvForm.title.trim() || !csvForm.file) return;
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.append("file",        csvForm.file);
      fd.append("title",       csvForm.title.trim());
      fd.append("description", csvForm.description.trim());
      fd.append("duration",    String(Number(csvForm.duration) || 60));
      fd.append("passingMarks",String(Number(csvForm.passingMarks) || 0));
      fd.append("attemptLimit",String(Number(csvForm.attemptLimit) || 0));
      fd.append("isProctored", String(Boolean(csvForm.isProctored)));
      fd.append("isOpenTest",  String(Boolean(csvForm.isOpenTest)));
      fd.append("type",        "aits");
      fd.append("aitsId",      selectedAits._id);
      if (!csvForm.isOpenTest) {
        if (csvForm.startTime) fd.append("startTime", new Date(csvForm.startTime).toISOString());
        if (csvForm.endTime)   fd.append("endTime",   new Date(csvForm.endTime).toISOString());
      }
      const res = await uploadTestCSV(fd);
      await refreshTests();
      setTestModal({ open: false, mode: "manual" });
      setCsvForm(emptyCsvForm);
      toast.success(res?.message || "Test created from CSV");
    } catch (err) {
      toast.error(err?.message || "Failed to upload CSV");
    } finally { setActionLoading(false); }
  };

  // Publish makes the test visible to students; unpublish hides it again.
  // Drafts never appear in the student section, so a test must be published.
  const handleTogglePublish = async (test) => {
    const publish = test.status !== "published";
    setActionLoading(true);
    try {
      await publishTeacherTest(
        test._id,
        publish
          ? (test.endTime ? { startTime: test.startTime, endTime: test.endTime } : {})
          : { unpublish: true }
      );
      await refreshTests();
      toast.success(publish ? "Test published — now visible to students" : "Test moved to draft");
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    } finally { setActionLoading(false); }
  };

  // ── Confirm delete ───────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    setActionLoading(true);
    try {
      if (confirm.type === "aits") {
        await deleteAITS(confirm.id);
        if (selectedAits?._id === confirm.id) setSelectedAits(null);
        await loadHierarchy();
      }
      if (confirm.type === "test") {
        await deleteTeacherTest(confirm.id);
        await refreshTests();
      }
    } finally {
      setActionLoading(false);
      setConfirm({ open: false, type: null, id: null });
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: Tests inside an AITS
  // ──────────────────────────────────────────────────────────────────────────
  if (selectedAits) {
    return (
      <div className="space-y-6">
        {/* Back + header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedAits(null)}
              className="flex items-center gap-1.5 rounded-xl glass-pill px-3 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft size={15} /> Back
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-400" />
                <h2 className="text-lg font-bold text-white">{selectedAits.title}</h2>
                <button
                  onClick={() => handleTogglePaid(selectedAits)}
                  className={`ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                    selectedAits.isPaid ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                  }`}
                >
                  {selectedAits.isPaid ? <><Lock size={9}/> Paid · ₹{Number(selectedAits.price||0).toLocaleString()}</> : <><Unlock size={9}/> Free</>}
                </button>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-white/40">
                <Tag size={10} className="text-purple-400" />{selectedAits.categoryTitle}
                <span className="text-white/20">·</span>
                <GraduationCap size={10} className="text-sky-400" />{selectedAits.examTitle}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setCsvForm(emptyCsvForm); setTestModal({ open: true, mode: "csv" }); }}
              className="flex items-center gap-2 rounded-xl glass-pill px-4 py-2 text-sm text-white/80 hover:text-white"
            >
              <UploadCloud size={15} /> Upload CSV
            </button>
            <button
              onClick={() => { setTestForm(emptyTestForm); setTestModal({ open: true, mode: "manual" }); }}
              className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-400 hover:brightness-110 transition"
            >
              <Plus size={16} /> Create Test
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Tests", value: aitsTests.length, color: "text-brand-primary" },
            { label: "Published", value: aitsTests.filter((t) => t.status === "published").length, color: "text-emerald-400" },
            { label: "Draft", value: aitsTests.filter((t) => t.status !== "published" && t.status !== "scheduled").length, color: "text-white/50" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl glass-card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-white/40">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tests table */}
        <div className="overflow-hidden rounded-2xl glass-card">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Test</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Duration</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-white/50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingTests ? (
                  <tr><td colSpan={4} className="px-6 py-14 text-center text-sm text-white/40">Loading…</td></tr>
                ) : aitsTests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <FileText size={36} className="mx-auto mb-3 text-white/15" />
                      <p className="text-sm text-white/40">No tests yet.</p>
                      <button
                        onClick={() => { setTestForm(emptyTestForm); setTestModal({ open: true, mode: "manual" }); }}
                        className="mt-2 text-sm text-brand-primary hover:underline"
                      >
                        Create the first test →
                      </button>
                    </td>
                  </tr>
                ) : (
                  aitsTests.map((test, idx) => (
                    <tr key={test._id} className="hover:bg-white/4 transition-colors animate-fade-up" style={{ animationDelay: `${idx * 20}ms` }}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-white">{test.title}</p>
                        {test.description && <p className="mt-0.5 text-xs text-white/40 line-clamp-1">{test.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">{test.duration ?? "—"} min</td>
                      <td className="px-6 py-4"><StatusBadge status={test.status} /></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTogglePublish(test)}
                            disabled={actionLoading}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                              test.status === "published"
                                ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                            }`}
                            title={test.status === "published" ? "Unpublish — hide from students" : "Publish — show to students"}
                          >
                            {test.status === "published"
                              ? <><EyeOff size={12} /> Unpublish</>
                              : <><Send size={12} /> Publish</>}
                          </button>
                          <button
                            onClick={() => navigate(`/admin/test-series/test/${test._id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg glass-pill px-3 py-1.5 text-xs text-white/70 hover:text-white"
                          >
                            <ExternalLink size={12} /> Edit Questions
                          </button>
                          <button
                            onClick={() => setConfirm({ open: true, type: "test", id: test._id })}
                            className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 size={13} />
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

        {/* Create test modal */}
        <SideModal
          open={testModal.open && testModal.mode === "manual"}
          title="Create AITS Test"
          onClose={() => { setTestModal({ open: false, mode: "manual" }); setTestForm(emptyTestForm); }}
          footer={
            <>
              <button onClick={() => setTestModal({ open: false, mode: "manual" })} className="rounded-lg glass-pill px-4 py-2 text-sm text-white/80 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleCreateTest}
                disabled={actionLoading || !testForm.title.trim()}
                className="rounded-lg btn-gradient px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                {actionLoading ? "Creating…" : "Create Test"}
              </button>
            </>
          }
        >
          <TestFormFields form={testForm} onChange={setTestForm} />
        </SideModal>

        {/* CSV upload modal */}
        <SideModal
          open={testModal.open && testModal.mode === "csv"}
          title="Upload CSV Test"
          onClose={() => { setTestModal({ open: false, mode: "csv" }); setCsvForm(emptyCsvForm); }}
          footer={
            <>
              <button onClick={() => setTestModal({ open: false, mode: "csv" })} className="rounded-lg glass-pill px-4 py-2 text-sm text-white/80 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleUploadCsv}
                disabled={actionLoading || !csvForm.title.trim() || !csvForm.file}
                className="rounded-lg btn-gradient px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                {actionLoading ? "Uploading…" : "Upload"}
              </button>
            </>
          }
        >
          <CsvFormFields form={csvForm} onChange={setCsvForm} />
        </SideModal>

        <ConfirmationModal
          isOpen={confirm.open && confirm.type === "test"}
          title="Delete Test"
          message="This will permanently delete the test and all its questions. This cannot be undone."
          confirmText="Delete"
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirm({ open: false, type: null, id: null })}
          isLoading={actionLoading}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: AITS list
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <Trophy size={22} className="text-amber-400" />
            All India Test Series
          </h2>
          <p className="mt-1 text-sm text-white/50">
            {loadingHier ? "Loading…" : `${allAITS.length} series across ${allExams.length} exams`}
          </p>
        </div>
        <button
          onClick={openCreateAits}
          disabled={allExams.length === 0}
          className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-400 transition hover:brightness-110 disabled:opacity-40"
        >
          <Plus size={16} /> Create AITS
        </button>
      </div>

      {/* Stats */}
      {!loadingHier && allAITS.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Series",  value: allAITS.length, color: "text-amber-400" },
            { label: "Paid Series",   value: allAITS.filter((a) => a.isPaid).length, color: "text-rose-400" },
            { label: "Free Series",   value: allAITS.filter((a) => !a.isPaid).length, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl glass-card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="rounded-2xl glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AITS by name or exam…"
            className={`${fi} pl-10`}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl glass-card">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">AITS Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Exam</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Tests</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Pricing</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-white/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingHier ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-white/40">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Trophy size={36} className="mx-auto mb-3 text-white/15" />
                    <p className="text-sm text-white/40">
                      {allAITS.length === 0 ? "No AITS created yet." : "No match for your search."}
                    </p>
                    {allAITS.length === 0 && allExams.length > 0 && (
                      <button onClick={openCreateAits} className="mt-2 text-sm text-brand-primary hover:underline">
                        Create your first AITS →
                      </button>
                    )}
                    {allExams.length === 0 && (
                      <p className="mt-1 text-xs text-white/30">Create at least one exam first.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((aits, idx) => (
                  <tr
                    key={aits._id}
                    className="group hover:bg-white/4 transition-colors animate-fade-up cursor-pointer"
                    style={{ animationDelay: `${idx * 20}ms` }}
                    onClick={() => openAitsTests(aits)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Trophy size={14} className="text-amber-400 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">{aits.title}</p>
                          {aits.description && (
                            <p className="text-[11px] text-white/40 line-clamp-1 mt-0.5">{aits.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-white/70">
                          <GraduationCap size={11} className="text-sky-400" />{aits.examTitle}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                          <Tag size={9} className="text-purple-400" />{aits.categoryTitle}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
                        <FileText size={13} className="text-brand-primary" />
                        {aits.tests?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleTogglePaid(aits)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          aits.isPaid
                            ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                            : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                        }`}
                        title={aits.isPaid ? "Click to make free" : "Click to make paid"}
                      >
                        {aits.isPaid ? <><Lock size={10}/> Paid · ₹{Number(aits.price||0).toLocaleString()}</> : <><Unlock size={10}/> Free</>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditAits(aits)}
                          className="rounded-lg glass-pill p-2 text-white/60 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirm({ open: true, type: "aits", id: aits._id })}
                          className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                          title="Delete"
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

      {/* Create / Edit AITS modal */}
      <SideModal
        open={aitsModal.open}
        title={aitsModal.mode === "edit" ? "Edit AITS Series" : "Create AITS Series"}
        onClose={closeAitsModal}
        footer={
          <>
            <button onClick={closeAitsModal} className="rounded-lg glass-pill px-4 py-2 text-sm text-white/80 hover:text-white">Cancel</button>
            <button
              onClick={handleSaveAits}
              disabled={actionLoading || !aitsForm.title.trim() || !aitsForm.examId}
              className="rounded-lg btn-gradient px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              {actionLoading ? "Saving…" : aitsModal.mode === "edit" ? "Save Changes" : "Create"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {aitsModal.mode === "create" && (
            <FieldLabel label="Exam" required>
              <select value={aitsForm.examId} onChange={(e) => setAitsForm((f) => ({ ...f, examId: e.target.value }))} className={fi}>
                <option value="">Select exam…</option>
                {allExams.map((ex) => (
                  <option key={ex._id} value={ex._id}>{ex.categoryTitle} → {ex.title}</option>
                ))}
              </select>
            </FieldLabel>
          )}
          <FieldLabel label="Title" required>
            <input value={aitsForm.title} onChange={(e) => setAitsForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. AITS 2025 Full Syllabus" className={fi} />
          </FieldLabel>
          <FieldLabel label="Description">
            <textarea value={aitsForm.description} onChange={(e) => setAitsForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Optional description…" className={`${fi} resize-none`} />
          </FieldLabel>

          {/* Paid toggle */}
          <div className="rounded-xl border border-white/10 bg-dark-300/40 p-4 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                {aitsForm.isPaid ? <Lock size={15} className="text-amber-400" /> : <Unlock size={15} className="text-emerald-400" />}
                {aitsForm.isPaid ? "Paid Series" : "Free Series"}
              </span>
              <button
                type="button"
                onClick={() => setAitsForm((f) => ({ ...f, isPaid: !f.isPaid, price: !f.isPaid ? f.price : 0 }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aitsForm.isPaid ? "bg-amber-500" : "bg-white/20"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${aitsForm.isPaid ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </label>
            {aitsForm.isPaid && (
              <div className="relative">
                <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input type="number" min={0} value={aitsForm.price}
                  onChange={(e) => setAitsForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
                  placeholder="Price in ₹" className={`${fi} pl-8`} />
              </div>
            )}
          </div>
        </div>
      </SideModal>

      <ConfirmationModal
        isOpen={confirm.open && confirm.type === "aits"}
        title="Delete AITS Series"
        message="This will permanently delete the series and ALL its tests. This cannot be undone."
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirm({ open: false, type: null, id: null })}
        isLoading={actionLoading}
      />
    </div>
  );
}
