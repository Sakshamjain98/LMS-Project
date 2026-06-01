import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  ListChecks,
  Settings2,
  UploadCloud,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  getTeacherTestById,
  updateTeacherTest,
  getTestQuestions,
  addQuestionToTest,
  bulkAddQuestionsToTest,
  deleteQuestion,
} from "../../services/teacherService";
import toast from "react-hot-toast";

const fieldInput =
  "w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-primary focus:outline-none transition-colors";
const fieldChk = "h-4 w-4 rounded border-white/20 bg-dark-300 accent-brand-primary";

function FieldLabel({ label, hint, required, children }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}

const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const buildTestPayload = (form) => {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    duration: Number(form.duration) || 60,
    passingMarks: Number(form.passingMarks) || 0,
    instructions: form.instructions.trim(),
    attemptLimit: Number(form.attemptLimit) || 0,
    isProctored: Boolean(form.isProctored),
    shuffleQuestions: Boolean(form.shuffleQuestions),
    shuffleOptions: Boolean(form.shuffleOptions),
    showSolution: form.showSolution !== false,
    allowReview: form.allowReview !== false,
    negativeMarking: Math.max(0, Number(form.negativeMarking) || 0),
  };
  if (!form.isOpenTest) {
    if (form.startTime) payload.startTime = new Date(form.startTime).toISOString();
    if (form.endTime) payload.endTime = new Date(form.endTime).toISOString();
  } else {
    payload.startTime = null;
    payload.endTime = null;
  }
  return payload;
};

// CSV parser — handles quoted fields and embedded commas.
const parseCsv = (text) => {
  const rows = [];
  let cur = [""];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur[cur.length - 1] += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") cur.push("");
      else if (c === "\n") { rows.push(cur); cur = [""]; }
      else if (c !== "\r") cur[cur.length - 1] += c;
    }
  }
  if (cur.length > 1 || cur[0] !== "") rows.push(cur);
  return rows;
};

const normalizeHeader = (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

const buildQuestionsFromCsv = (text) => {
  const rows = parseCsv(text).filter((r) => r.some((c) => c && c.trim()));
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeHeader);
  const idx = (...names) => headers.findIndex((h) => names.includes(h));
  const qIdx = idx("questiontext", "question");
  const aIdx = idx("optiona", "a");
  const bIdx = idx("optionb", "b");
  const cIdx = idx("optionc", "c");
  const dIdx = idx("optiond", "d");
  const correctIdx = idx("correctindex", "correct", "answer", "correctanswer");
  const marksIdx = idx("marks", "score");
  const explanationIdx = idx("explanation", "solution", "explain");

  const questions = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const text = row[qIdx]?.trim();
    const a = row[aIdx]?.trim();
    const b = row[bIdx]?.trim();
    const c = row[cIdx]?.trim();
    const d = row[dIdx]?.trim();
    if (!text || !a || !b) continue;
    const correctRaw = (row[correctIdx] || "0").toString().trim().toUpperCase();
    let correctOption = parseInt(correctRaw, 10);
    if (Number.isNaN(correctOption)) {
      correctOption = { A: 0, B: 1, C: 2, D: 3 }[correctRaw] ?? 0;
    }
    const filledOptions = [a, b, c, d].filter(Boolean);
    if (filledOptions.length < 2) continue;
    const safeCorrect = Math.min(Math.max(correctOption, 0), filledOptions.length - 1);
    questions.push({
      questionText: text,
      questionType: "MCQ",
      options: filledOptions.map((t) => ({ text: t })),
      correctOptionIndex: safeCorrect,
      marks: Number(row[marksIdx]) || 1,
      explanation: row[explanationIdx]?.trim() || "",
    });
  }
  return questions;
};

const emptyQuestion = {
  questionText: "",
  options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }],
  marks: 1,
};

export default function TestEditor() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [test, setTest] = useState(null);
  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [newQ, setNewQ] = useState(emptyQuestion);
  const [addingQ, setAddingQ] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const fetchTest = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTeacherTestById(testId);
      const t = res.test || res;
      setTest(t);
      setForm({
        title: t.title || "",
        description: t.description || "",
        duration: t.duration || 60,
        passingMarks: t.passingMarks || 0,
        instructions: t.instructions || "",
        attemptLimit: t.attemptLimit || 0,
        isProctored: Boolean(t.isProctored),
        isOpenTest: !(t.startTime || t.endTime),
        startTime: t.startTime ? toLocalDateTime(t.startTime) : "",
        endTime: t.endTime ? toLocalDateTime(t.endTime) : "",
        shuffleQuestions: Boolean(t.shuffleQuestions),
        shuffleOptions:   Boolean(t.shuffleOptions),
        showSolution:     t.showSolution !== false,
        allowReview:      t.allowReview !== false,
        negativeMarking:  Number(t.negativeMarking) || 0,
      });
    } catch (err) {
      toast.error(err.message || "Failed to load test");
      navigate("/admin/test-series");
    } finally {
      setLoading(false);
    }
  }, [testId, navigate]);

  const fetchQuestions = useCallback(async () => {
    try {
      setQuestionsLoading(true);
      const res = await getTestQuestions(testId);
      setQuestions(res.questions || res.data || []);
    } catch {
      // Silent — empty state shown.
    } finally {
      setQuestionsLoading(false);
    }
  }, [testId]);

  useEffect(() => { fetchTest(); fetchQuestions(); }, [fetchTest, fetchQuestions]);

  const handleSave = async () => {
    if (!form?.title?.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      await updateTeacherTest(testId, buildTestPayload(form));
      toast.success("Test saved");
    } catch (err) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQ.questionText.trim()) return toast.error("Enter a question");
    const filledOptions = newQ.options.filter((o) => o.text.trim());
    if (filledOptions.length < 2) return toast.error("At least 2 options required");
    const correctOptionIndex = filledOptions.findIndex((o) => o.isCorrect);
    if (correctOptionIndex < 0) return toast.error("Mark one option as correct");
    setAddingQ(true);
    try {
      await addQuestionToTest(testId, {
        questionText: newQ.questionText.trim(),
        questionType: "MCQ",
        options: filledOptions.map((o) => ({ text: o.text.trim() })),
        correctOptionIndex,
        marks: Number(newQ.marks) || 1,
      });
      toast.success("Question added");
      setNewQ(emptyQuestion);
      await fetchQuestions();
    } catch (err) {
      toast.error(err.message || "Add failed");
    } finally {
      setAddingQ(false);
    }
  };

  const handleDeleteQuestion = async (qid) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(qid);
      toast.success("Question removed");
      setQuestions((prev) => prev.filter((q) => q._id !== qid));
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return toast.error("Pick a CSV file");
    setCsvUploading(true);
    try {
      const text = await csvFile.text();
      const parsed = buildQuestionsFromCsv(text);
      if (parsed.length === 0) {
        toast.error("No valid questions found in CSV");
        return;
      }
      await bulkAddQuestionsToTest(testId, { questions: parsed });
      toast.success(`Added ${parsed.length} question${parsed.length === 1 ? "" : "s"}`);
      setCsvFile(null);
      await fetchQuestions();
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setCsvUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-white/60">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading test…
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Link
            to="/admin/test-series"
            className="rounded-xl glass-pill p-2.5 text-white/70 hover:text-white shrink-0"
            title="Back to test series"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Editing Test</p>
            <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl break-words">
              {test?.title || "—"}
            </h1>
            {test?.topicId?.title && (
              <p className="mt-1 text-xs text-white/50 break-words">
                {test.topicId.title}
                {test.subjectId?.title && <> &nbsp;/&nbsp; {test.subjectId.title}</>}
                {test.chapterId?.title && <> &nbsp;/&nbsp; {test.chapterId.title}</>}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl btn-gradient px-5 py-2.5 text-sm font-bold whitespace-nowrap disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 overflow-x-auto custom-scrollbar">
        <div className="flex gap-1 min-w-max">
          <TabBtn icon={FileText} active={tab === "details"} onClick={() => setTab("details")}>Details</TabBtn>
          <TabBtn icon={Settings2} active={tab === "config"} onClick={() => setTab("config")}>Configuration</TabBtn>
          <TabBtn icon={ListChecks} active={tab === "questions"} onClick={() => setTab("questions")}>
            Questions <span className="ml-1.5 rounded-full bg-white/10 px-2 text-[10px] font-bold">{questions.length}</span>
          </TabBtn>
        </div>
      </div>

      <div className="min-w-0">
        {tab === "details"   && <DetailsTab   form={form} onChange={setForm} />}
        {tab === "config"    && <ConfigTab    form={form} onChange={setForm} />}
        {tab === "questions" && (
          <QuestionsTab
            questions={questions}
            loading={questionsLoading}
            newQ={newQ}
            onNewQChange={setNewQ}
            onAdd={handleAddQuestion}
            addingQ={addingQ}
            onDelete={handleDeleteQuestion}
            csvFile={csvFile}
            onCsvFileChange={setCsvFile}
            onCsvUpload={handleCsvUpload}
            csvUploading={csvUploading}
          />
        )}
      </div>
    </div>
  );
}

function TabBtn({ icon: Icon, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition ${
        active ? "text-brand-primary" : "text-white/60 hover:text-white"
      }`}
    >
      <Icon size={15} />
      {children}
      {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-primary" />}
    </button>
  );
}

function DetailsTab({ form, onChange }) {
  if (!form) return null;
  return (
    <div className="rounded-2xl glass-card p-5 md:p-6 space-y-5">
      <FieldLabel label="Test Title" required>
        <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} placeholder="e.g. GPAT Mock 1 — Pharmacology" className={fieldInput} />
      </FieldLabel>

      <FieldLabel label="Description" hint="A one-line preview students see before starting.">
        <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} placeholder="What is this test about?" rows={2} className={`${fieldInput} resize-none`} />
      </FieldLabel>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FieldLabel label="Duration (minutes)" hint="Total time allowed to finish." required>
          <input type="number" min="1" value={form.duration} onChange={(e) => onChange({ ...form, duration: e.target.value })} className={fieldInput} />
        </FieldLabel>
        <FieldLabel label="Passing Marks" hint="Minimum score required to pass.">
          <input type="number" min="0" value={form.passingMarks} onChange={(e) => onChange({ ...form, passingMarks: e.target.value })} className={fieldInput} />
        </FieldLabel>
      </div>

      <FieldLabel label="Instructions" hint="Optional notes shown to students before they start.">
        <textarea value={form.instructions} onChange={(e) => onChange({ ...form, instructions: e.target.value })} placeholder="Read carefully — there is negative marking..." rows={3} className={`${fieldInput} resize-none`} />
      </FieldLabel>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FieldLabel label="Attempt Limit" hint="0 = unlimited attempts.">
          <input type="number" min="0" value={form.attemptLimit} onChange={(e) => onChange({ ...form, attemptLimit: e.target.value })} className={fieldInput} />
        </FieldLabel>
        <label className="flex items-center gap-2 self-end rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white/80 cursor-pointer h-[46px]">
          <input type="checkbox" className={fieldChk} checked={form.isOpenTest} onChange={(e) => onChange({ ...form, isOpenTest: e.target.checked })} />
          <span>Open Test <span className="block text-[10px] text-white/40">Available anytime — no schedule.</span></span>
        </label>
      </div>

      {/* Proctored toggle — duplicated from the Configuration tab so admins
          can flip it without leaving the Details view. Both writes go to the
          same `form.isProctored` state. */}
      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-dark-300 p-4 text-sm text-white/80 cursor-pointer hover:border-amber-400/30 transition-colors">
        <input
          type="checkbox"
          className={`${fieldChk} mt-0.5`}
          checked={Boolean(form.isProctored)}
          onChange={(e) => onChange({ ...form, isProctored: e.target.checked })}
        />
        <div className="min-w-0">
          <p className="font-semibold text-white inline-flex items-center gap-1.5">
            Proctored Mode
            {form.isProctored && (
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                ON
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">
            Forces fullscreen, blocks copy/paste & right-click, and auto-submits on tab switches.
            More options live in the <strong className="text-white/70">Configuration</strong> tab.
          </p>
        </div>
      </label>

      {!form.isOpenTest && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FieldLabel label="Starts At" hint="Earliest moment students can begin.">
            <input type="datetime-local" value={form.startTime} onChange={(e) => onChange({ ...form, startTime: e.target.value })} className={fieldInput} />
          </FieldLabel>
          <FieldLabel label="Ends At" hint="No new attempts after this.">
            <input type="datetime-local" value={form.endTime} onChange={(e) => onChange({ ...form, endTime: e.target.value })} className={fieldInput} />
          </FieldLabel>
        </div>
      )}

      <p className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-[11px] text-white/40">
        Tip: pricing is set on the parent <strong className="text-white/70">Test Series</strong>, not on individual tests.
      </p>
    </div>
  );
}

// Hoisted out of ConfigTab so it isn't re-created on every render — that
// caused react-hooks/static-components ESLint errors and reset its DOM state
// each keystroke.
function ConfigToggle({ id, value, onToggle, label, hint }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-dark-300 p-4 cursor-pointer hover:border-white/20 transition-colors">
      <input
        id={id}
        type="checkbox"
        className={`${fieldChk} mt-0.5`}
        checked={Boolean(value)}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-white/40">{hint}</p>}
      </div>
    </label>
  );
}

function ConfigTab({ form, onChange }) {
  if (!form) return null;
  return (
    <div className="rounded-2xl glass-card p-5 md:p-6 space-y-5">
      <h3 className="text-sm font-bold text-white inline-flex items-center gap-2">
        <Settings2 size={16} className="text-brand-primary" /> Behaviour during the test
      </h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ConfigToggle
          id="cfg-shuffleQ"
          value={form.shuffleQuestions}
          onToggle={(v) => onChange({ ...form, shuffleQuestions: v })}
          label="Shuffle Questions"
          hint="Each student sees the questions in a different order."
        />
        <ConfigToggle
          id="cfg-shuffleO"
          value={form.shuffleOptions}
          onToggle={(v) => onChange({ ...form, shuffleOptions: v })}
          label="Shuffle Options"
          hint="The four options of every MCQ are randomly ordered per attempt."
        />
        <ConfigToggle
          id="cfg-proctored"
          value={form.isProctored}
          onToggle={(v) => onChange({ ...form, isProctored: v })}
          label="Proctored Mode"
          hint="Forces fullscreen, blocks copy/paste, detects tab-switches."
        />
        <ConfigToggle
          id="cfg-showSol"
          value={form.showSolution}
          onToggle={(v) => onChange({ ...form, showSolution: v })}
          label="Show Solutions After Submit"
          hint="Reveal correct answers and explanations on the result page."
        />
        <ConfigToggle
          id="cfg-review"
          value={form.allowReview}
          onToggle={(v) => onChange({ ...form, allowReview: v })}
          label="Allow Review Of Answers"
          hint="Student can revisit questions before final submission."
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FieldLabel label="Negative Marking (per wrong answer)" hint="0 = no negative marking. 0.25 means −¼ for each wrong answer.">
          <input
            type="number"
            min="0"
            step="0.25"
            value={form.negativeMarking}
            onChange={(e) => onChange({ ...form, negativeMarking: Number(e.target.value) })}
            className={fieldInput}
          />
        </FieldLabel>
      </div>
    </div>
  );
}

function QuestionsTab({ questions, loading, newQ, onNewQChange, onAdd, addingQ, onDelete, csvFile, onCsvFileChange, onCsvUpload, csvUploading }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl glass-card p-5">
        <h3 className="text-sm font-bold text-white inline-flex items-center gap-2">
          <UploadCloud size={16} className="text-brand-primary" /> Bulk import via CSV
        </h3>
        <p className="mt-1 text-xs text-white/50">
          Columns: <code className="rounded bg-white/5 px-1 py-0.5">questionText, optionA, optionB, optionC, optionD, correctIndex (0–3 or A/B/C/D), marks, explanation</code>
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => onCsvFileChange(e.target.files?.[0] || null)}
            className="flex-1 min-w-0 rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white/80 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white"
          />
          <button
            onClick={onCsvUpload}
            disabled={!csvFile || csvUploading}
            className="inline-flex items-center justify-center gap-2 rounded-xl btn-gradient px-4 py-2.5 text-sm font-bold whitespace-nowrap disabled:opacity-50"
          >
            {csvUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            {csvUploading ? "Importing…" : "Import CSV"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl glass-card p-5">
        <h3 className="text-sm font-bold text-white inline-flex items-center gap-2">
          <Plus size={16} className="text-brand-primary" /> Add a question manually
        </h3>
        <div className="mt-4 space-y-4">
          <FieldLabel label="Question" required>
            <textarea
              rows={2}
              value={newQ.questionText}
              onChange={(e) => onNewQChange({ ...newQ, questionText: e.target.value })}
              placeholder="What is the chemical name of aspirin?"
              className={`${fieldInput} resize-none`}
            />
          </FieldLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {newQ.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct-new"
                  checked={opt.isCorrect}
                  onChange={() => onNewQChange({ ...newQ, options: newQ.options.map((o, j) => ({ ...o, isCorrect: i === j })) })}
                  className="accent-brand-primary"
                />
                <input
                  value={opt.text}
                  onChange={(e) => onNewQChange({ ...newQ, options: newQ.options.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)) })}
                  placeholder={`Option ${String.fromCharCode(65 + i)}${i < 2 ? " (required)" : ""}`}
                  className={fieldInput}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <FieldLabel label="Marks">
              <input type="number" min="0" value={newQ.marks} onChange={(e) => onNewQChange({ ...newQ, marks: e.target.value })} className={`${fieldInput} max-w-32`} />
            </FieldLabel>
            <button
              onClick={onAdd}
              disabled={addingQ}
              className="inline-flex items-center gap-2 rounded-xl btn-gradient px-4 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              {addingQ ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {addingQ ? "Adding…" : "Add Question"}
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white inline-flex items-center gap-2">
            <ListChecks size={16} className="text-brand-primary" /> Questions in this test
          </h3>
          <span className="text-xs text-white/50">{questions.length} total</span>
        </div>

        {loading ? (
          <div className="rounded-2xl glass-card p-8 text-center text-sm text-white/50">
            <Loader2 size={18} className="mx-auto animate-spin" />
            <p className="mt-2">Loading questions…</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/40">
            No questions yet. Add one above or upload a CSV.
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <article key={q._id} className="rounded-2xl glass-card p-5 animate-fade-up min-w-0" style={{ animationDelay: `${idx * 30}ms` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white break-words">
                      <span className="mr-2 text-white/40">{idx + 1}.</span>
                      {q.questionText}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {(q.options || []).map((o, i) => (
                        <li key={i} className={`flex items-start gap-2 text-xs break-words ${o.isCorrect ? "text-emerald-300" : "text-white/60"}`}>
                          <span className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${o.isCorrect ? "border-emerald-400 bg-emerald-500/15" : "border-white/15"}`}>
                            {o.isCorrect && <CheckCircle2 size={10} />}
                          </span>
                          <span>{String.fromCharCode(65 + i)}. {o.text}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] text-white/40">Marks: {q.marks ?? 1}</p>
                  </div>
                  <button
                    onClick={() => onDelete(q._id)}
                    className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 shrink-0"
                    title="Delete question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
