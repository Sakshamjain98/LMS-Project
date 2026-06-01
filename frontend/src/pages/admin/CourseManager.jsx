import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  BookOpen, Plus, ChevronRight, ChevronLeft, Trash2, Pencil, Check, X,
  FileText, Video, Link2, Loader2, Upload, Eye,
  GraduationCap, Folder, Layers, Tag, Search, DollarSign, Globe, EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import PdfPreviewFrame from "../../components/course/PdfPreviewFrame";
import {
  getAdminCourseHierarchy, getAdminCourseTree,
  createCourse, updateCourse, deleteCourse,
  createSubject, updateSubject, deleteSubject,
  createChapter, updateChapter, deleteChapter,
  createRichTextNote, createPdfNote, updateNote, deleteNote,
  createVideo, updateVideo, deleteVideo,
  linkTestToChapter, unlinkTestFromChapter,
} from "../../services/courseService";
import api from "../../services/api";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

// ─── Level definitions ────────────────────────────────────────────────────────

const LEVEL_LABELS = {
  categories: "Exam Categories",
  exams: "Exams",
  courses: "Courses",
  subjects: "Subjects",
  chapters: "Chapters",
};

const LEVEL_ICON = {
  categories: Tag,
  exams: GraduationCap,
  courses: BookOpen,
  subjects: Folder,
  chapters: FileText,
};

const ICON_COLOR = {
  categories: "text-purple-400",
  exams: "text-sky-400",
  courses: "text-brand-primary",
  subjects: "text-teal-400",
  chapters: "text-amber-400",
};

const PAGE_SIZE = 10;

// ─── Shared field styles ──────────────────────────────────────────────────────

const fi = "w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-primary focus:outline-none transition-colors";

// ─── UI primitives ────────────────────────────────────────────────────────────

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

function PaginationBar({ page, totalPages, totalCount, pageSize, onChange }) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
      <span>
        Showing <span className="font-bold text-white">{start}</span>–
        <span className="font-bold text-white">{end}</span> of{" "}
        <span className="font-bold text-white">{totalCount}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg glass-pill px-3 py-1.5 font-semibold disabled:opacity-30"
        >
          <ChevronLeft size={12} /> Prev
        </button>
        <span className="px-2 font-semibold text-white">{page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg glass-pill px-3 py-1.5 font-semibold disabled:opacity-30"
        >
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
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", className = "", disabled, type = "button" }) {
  const base = "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40";
  const v = {
    primary: "bg-brand-primary text-dark-400 hover:opacity-90",
    ghost: "text-white/70 hover:bg-white/5 hover:text-white",
    danger: "text-red-400 hover:bg-red-500/10",
    outline: "border border-white/10 text-white/80 hover:bg-white/5",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${v[variant]} ${className}`}>
      {children}
    </button>
  );
}

// ─── Test Picker ──────────────────────────────────────────────────────────────

function TestPicker({ onLink, examId, existingTestIds = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(false);
  // expanded: Set of "series-{id}", "subject-{id}", "chapter-{id}"
  const [expanded, setExpanded] = useState(new Set());
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0, minWidth: 400 });

  // Load hierarchy once when first opened
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get("/teacher/test-series")
      .then((r) => {
        const topics = r.data?.topics || [];
        setHierarchy(topics);
        if (topics.length === 1) setExpanded(new Set([`series-${topics[0]._id}`]));
      })
      .catch(() => setHierarchy([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Compute portal position from button rect
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const panelWidth = 400;
    // Prefer right-aligned; shift left if it would overflow
    let right = window.innerWidth - rect.right;
    if (rect.right - panelWidth < 0) right = Math.max(8, window.innerWidth - panelWidth - 8);
    setDropPos({ top: rect.bottom + 6, right, minWidth: panelWidth });
  }, [open]);

  // Close on outside click (check both the button and the portal panel)
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        btnRef.current?.contains(e.target) ||
        panelRef.current?.contains(e.target)
      ) return;
      setOpen(false);
      setQuery("");
      setExpanded(new Set());
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") { setOpen(false); setQuery(""); setExpanded(new Set()); } };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const toggle = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const close = () => { setOpen(false); setQuery(""); setExpanded(new Set()); };

  const isSearching = query.trim().length > 0;
  const q = query.trim().toLowerCase();

  // Filter series to only show those belonging to the same exam as the course.
  // Unassigned series (no examId) are also included as a fallback.
  const filteredHierarchy = useMemo(() => {
    if (!examId) return hierarchy;
    return (hierarchy || []).filter(
      (t) => !t.examId || String(t.examId) === String(examId) || String(t.examId?._id) === String(examId)
    );
  }, [hierarchy, examId]);

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const results = [];
    (filteredHierarchy || []).forEach((topic) => {
      (topic.subjects || []).forEach((subject) => {
        (subject.chapters || []).forEach((chapter) => {
          (chapter.tests || []).forEach((test) => {
            if (existingTestIds.includes(String(test._id))) return;
            if (
              test.title?.toLowerCase().includes(q) ||
              topic.title?.toLowerCase().includes(q) ||
              subject.title?.toLowerCase().includes(q) ||
              chapter.title?.toLowerCase().includes(q)
            ) {
              results.push({ test, seriesTitle: topic.title, subjectTitle: subject.title, chapterTitle: chapter.title });
            }
          });
        });
      });
    });
    return results;
  }, [filteredHierarchy, q, isSearching, existingTestIds]);

  const totalTests = useMemo(() =>
    (filteredHierarchy || []).reduce((n, t) =>
      n + (t.subjects || []).reduce((m, s) =>
        m + (s.chapters || []).reduce((k, c) =>
          k + (c.tests || []).filter(tt => !existingTestIds.includes(String(tt._id))).length, 0), 0), 0),
    [filteredHierarchy, existingTestIds]
  );

  // ── The panel JSX (rendered via portal) ────────────────────────────────────
  const panel = open ? (
    <div
      ref={panelRef}
      className="rounded-2xl border border-white/15 bg-dark-300 shadow-2xl shadow-black/70 overflow-hidden"
      style={{
        position: "fixed",
        top: dropPos.top,
        right: dropPos.right,
        width: dropPos.minWidth,
        zIndex: 2147483647, // max 32-bit int — above everything
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <p className="text-xs font-bold text-white">Link a Test</p>
        <span className="text-[10px] text-white/35">{totalTests} available</span>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={13} className="shrink-0 text-white/40" />
          <input
            autoFocus
            placeholder="Search tests, series, subject, chapter…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-white/30 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/30 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[55vh] overflow-y-auto custom-scrollbar px-2 pb-3">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-brand-primary" />
          </div>
        ) : isSearching ? (
          searchResults.length === 0 ? (
            <p className="py-6 text-center text-xs text-white/40">No tests match "{query}"</p>
          ) : (
            <div className="space-y-0.5 pt-1">
              {searchResults.map(({ test, seriesTitle, subjectTitle, chapterTitle }) => (
                <button
                  key={test._id}
                  onClick={() => { onLink(test._id); close(); }}
                  className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-white/6 transition-colors"
                >
                  <TypeBadge type={test.type} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">{test.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-white/35">
                      {[seriesTitle, subjectTitle, chapterTitle].filter(Boolean).join(" › ")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : filteredHierarchy.length === 0 ? (
          <p className="py-6 text-center text-xs text-white/40">
            {examId ? "No test series found for this exam" : "No test series found"}
          </p>
        ) : (
          <div className="pt-1 space-y-0.5">
            {filteredHierarchy.map((topic) => {
              const seriesKey = `series-${topic._id}`;
              const seriesOpen = expanded.has(seriesKey);
              const availableInSeries = (topic.subjects || []).reduce((n, s) =>
                n + (s.chapters || []).reduce((m, c) =>
                  m + (c.tests || []).filter(t => !existingTestIds.includes(String(t._id))).length, 0), 0);
              if (availableInSeries === 0) return null;
              return (
                <div key={topic._id}>
                  <button
                    onClick={() => toggle(seriesKey)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                  >
                    <ChevronRight size={13} className={`shrink-0 text-brand-primary transition-transform duration-150 ${seriesOpen ? "rotate-90" : ""}`} />
                    <Layers size={13} className="shrink-0 text-brand-primary" />
                    <span className="flex-1 truncate text-xs font-bold text-white">{topic.title}</span>
                    <span className="shrink-0 rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold text-brand-primary">{availableInSeries}</span>
                  </button>
                  {seriesOpen && (
                    <div className="ml-4 border-l border-white/8 pl-2 space-y-0.5">
                      {(topic.subjects || []).map((subject) => {
                        const subjectKey = `subject-${subject._id}`;
                        const subjectOpen = expanded.has(subjectKey);
                        const availableInSubject = (subject.chapters || []).reduce((m, c) =>
                          m + (c.tests || []).filter(t => !existingTestIds.includes(String(t._id))).length, 0);
                        if (availableInSubject === 0) return null;
                        return (
                          <div key={subject._id}>
                            <button
                              onClick={() => toggle(subjectKey)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-white/5 transition-colors"
                            >
                              <ChevronRight size={12} className={`shrink-0 text-teal-400/70 transition-transform duration-150 ${subjectOpen ? "rotate-90" : ""}`} />
                              <Folder size={12} className="shrink-0 text-teal-400" />
                              <span className="flex-1 truncate text-[11px] font-semibold text-white/80">{subject.title}</span>
                              <span className="shrink-0 text-[10px] text-white/30">{availableInSubject}</span>
                            </button>
                            {subjectOpen && (
                              <div className="ml-4 border-l border-white/6 pl-2 space-y-0.5">
                                {(subject.chapters || []).map((chapter) => {
                                  const chapterKey = `chapter-${chapter._id}`;
                                  const chapterOpen = expanded.has(chapterKey);
                                  const availableTests = (chapter.tests || []).filter(
                                    (t) => !existingTestIds.includes(String(t._id))
                                  );
                                  if (availableTests.length === 0) return null;
                                  return (
                                    <div key={chapter._id}>
                                      <button
                                        onClick={() => toggle(chapterKey)}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-white/5 transition-colors"
                                      >
                                        <ChevronRight size={11} className={`shrink-0 text-amber-400/70 transition-transform duration-150 ${chapterOpen ? "rotate-90" : ""}`} />
                                        <FileText size={11} className="shrink-0 text-amber-400" />
                                        <span className="flex-1 truncate text-[11px] text-white/60">{chapter.title}</span>
                                        <span className="shrink-0 text-[10px] text-white/25">{availableTests.length}</span>
                                      </button>
                                      {chapterOpen && (
                                        <div className="ml-4 border-l border-white/5 pl-2 space-y-0.5">
                                          {availableTests.map((test) => (
                                            <button
                                              key={test._id}
                                              onClick={() => { onLink(test._id); close(); }}
                                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-brand-primary/10 transition-colors group"
                                            >
                                              <TypeBadge type={test.type} />
                                              <span className="flex-1 truncate text-[11px] text-white/70 group-hover:text-brand-primary">{test.title}</span>
                                              <Plus size={11} className="shrink-0 text-white/20 group-hover:text-brand-primary" />
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/8 px-3 py-2">
        <button
          onClick={close}
          className="w-full rounded-xl py-2 text-xs text-white/40 hover:bg-white/5 hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div ref={btnRef}>
        <Btn
          variant="outline"
          className="text-xs py-1.5 px-3"
          onClick={() => setOpen((v) => !v)}
        >
          <Link2 size={13} /> Link Test
        </Btn>
      </div>
      {/* Portal: renders directly into <body>, escaping all backdrop-filter stacking contexts */}
      {createPortal(panel, document.body)}
    </>
  );
}

// Small inline type badge reused by TestPicker rows
function TypeBadge({ type }) {
  const cfg = type === "pyq"
    ? "bg-purple-500/20 text-purple-400"
    : type === "aits"
    ? "bg-amber-500/20 text-amber-400"
    : "bg-brand-primary/20 text-brand-primary";
  return (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${cfg}`}>
      {(type || "practice").toUpperCase()}
    </span>
  );
}

// ─── Note Editor Drawer ───────────────────────────────────────────────────────

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    [{ color: [] }, { background: [] }],
    ["clean"],
  ],
};
const QUILL_FORMATS = ["header","bold","italic","underline","strike","list","blockquote","code-block","link","color","background"];

function NoteEditorDrawer({ chapterId, note, onClose, onSaved }) {
  const isEdit = Boolean(note);
  const [title, setTitle] = useState(note?.title || "");
  const [type, setType] = useState(note?.type || "rich_text");
  const [content, setContent] = useState(note?.content || "");
  const [pdfFile, setPdfFile] = useState(null);
  const [allowDownload, setAllowDownload] = useState(note?.allowDownload ?? true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title required");
    setSaving(true);
    try {
      if (isEdit) {
        if (type === "pdf" && pdfFile) {
          const fd = new FormData();
          fd.append("file", pdfFile);
          fd.append("title", title);
          fd.append("allowDownload", String(allowDownload));
          await updateNote(note._id, fd);
        } else {
          await updateNote(note._id, { title, content, allowDownload });
        }
        toast.success("Note updated");
      } else {
        if (type === "rich_text") {
          if (!content) return toast.error("Content required");
          await createRichTextNote(chapterId, { title, content, allowDownload });
        } else {
          if (!pdfFile) return toast.error("Select a PDF file");
          const fd = new FormData();
          fd.append("file", pdfFile);
          fd.append("title", title);
          fd.append("allowDownload", String(allowDownload));
          await createPdfNote(chapterId, fd);
        }
        toast.success("Note created");
      }
      onSaved();
    } catch (err) {
      toast.error(err?.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-dark-300 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h3 className="font-bold text-white">{isEdit ? "Edit Note" : "New Note"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-primary"
            />
          </div>
          {!isEdit && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60">Type</label>
              <div className="flex gap-3">
                {["rich_text", "pdf"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                      type === t ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-white/10 text-white/50 hover:border-white/20"
                    }`}
                  >
                    {t === "rich_text" ? <><FileText size={14} /> Rich Text</> : <><Upload size={14} /> PDF</>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {type === "rich_text" ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60">Content</label>
              <div className="quill-dark">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={QUILL_MODULES}
                  formats={QUILL_FORMATS}
                  style={{ minHeight: 260 }}
                  placeholder="Write your notes..."
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60">PDF File</label>
              {note?.fileUrl && !pdfFile && (
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-2.5">
                  <FileText size={14} className="text-red-400" />
                  <span className="text-xs text-white/60 truncate">{note.fileName || "Current PDF"}</span>
                  <span className="ml-auto text-xs text-white/35">Preview available in the chapter list</span>
                </div>
              )}
              <div
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-white/10 hover:border-brand-primary/40 p-6 text-center transition-colors"
              >
                <Upload size={24} className="mx-auto mb-2 text-white/30" />
                <p className="text-sm text-white/50">{pdfFile ? pdfFile.name : "Click to select PDF"}</p>
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files[0] || null)} />
              </div>
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setAllowDownload((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${allowDownload ? "bg-brand-primary" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${allowDownload ? "translate-x-4" : "translate-x-0"}`} />
            </div>
            <span className="text-sm text-white/70">Allow download</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isEdit ? "Update" : "Create"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function PdfPreviewModal({ note, onClose }) {
  if (!note) return null;

  return (
    <div className="fixed inset-0 z-9998 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-dark-300 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/35">PDF Preview</p>
            <h3 className="truncate text-base font-bold text-white">{note.title}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/45 hover:bg-white/5 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <PdfPreviewFrame noteId={note._id} title={note.title} className="bg-white" />
      </div>
    </div>
  );
}

// ─── Video Form ───────────────────────────────────────────────────────────────

function VideoForm({ chapterId, video, onClose, onSaved }) {
  const isEdit = Boolean(video);
  const [title, setTitle] = useState(video?.title || "");
  const [url, setUrl] = useState(video?.youtubeUrl || "");
  const [desc, setDesc] = useState(video?.description || "");
  const [saving, setSaving] = useState(false);
  const ytId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/)?.[1];

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title required");
    if (!ytId) return toast.error("Valid YouTube URL required");
    setSaving(true);
    try {
      if (isEdit) await updateVideo(video._id, { title, youtubeUrl: url, description: desc });
      else await createVideo(chapterId, { title, youtubeUrl: url, description: desc });
      toast.success(isEdit ? "Video updated" : "Video added");
      onSaved();
    } catch (err) {
      toast.error(err?.message || "Failed to save video");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-dark-300 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h3 className="font-bold text-white">{isEdit ? "Edit Video" : "Add Video"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/5">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title..." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">YouTube URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-primary" />
            {ytId && <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="preview" className="mt-2 w-48 rounded-xl object-cover" />}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Description (optional)</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-primary" />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isEdit ? "Update" : "Add"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Course Form Modal ────────────────────────────────────────────────────────

function CourseFormModal({ course, exams, onClose, onSaved }) {
  const isEdit = Boolean(course);
  const [title, setTitle] = useState(course?.title || "");
  const [description, setDescription] = useState(course?.description || "");
  const [examId, setExamId] = useState(course?.examId?._id || course?.examId || exams[0]?._id || "");
  const [isPaid, setIsPaid] = useState(course?.isPaid ?? false);
  const [price, setPrice] = useState(course?.price?.toString() || "");
  const [discountedPrice, setDiscountedPrice] = useState(course?.discountedPrice?.toString() || "");
  const [status, setStatus] = useState(course?.status || "published");
  const [thumb, setThumb] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title required");
    if (!examId) return toast.error("Select an exam");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description);
      fd.append("examId", examId);
      fd.append("isPaid", String(isPaid));
      fd.append("price", isPaid ? String(Number(price) || 0) : "0");
      fd.append("discountedPrice", isPaid ? String(Number(discountedPrice) || 0) : "0");
      fd.append("status", status);
      if (thumb) fd.append("thumbnail", thumb);
      if (isEdit) await updateCourse(course._id, fd);
      else await createCourse(fd);
      toast.success(isEdit ? "Course updated" : "Course created");
      onSaved();
    } catch (err) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-dark-300 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h3 className="font-bold text-white">{isEdit ? "Edit Course" : "New Course"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/5">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <FieldLabel label="Title" required>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title..." className={fi} />
          </FieldLabel>
          <FieldLabel label="Exam" required>
            <select value={examId} onChange={(e) => setExamId(e.target.value)} className={fi}>
              <option value="">Select exam...</option>
              {exams.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </FieldLabel>
          <FieldLabel label="Description">
            <div className="quill-dark">
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                modules={{ toolbar: [[{ header: [1, 2, false] }], ["bold", "italic"], ["link"], ["clean"]] }}
                style={{ minHeight: 120 }}
                placeholder="Course description..."
              />
            </div>
          </FieldLabel>
          <div className="grid grid-cols-2 gap-4">
            <FieldLabel label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={fi}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </FieldLabel>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer select-none rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5">
                <div
                  onClick={() => setIsPaid((v) => !v)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isPaid ? "bg-brand-primary" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isPaid ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <span className="text-sm text-white/70">Paid course</span>
              </label>
            </div>
          </div>
          {isPaid && (
            <div className="grid grid-cols-2 gap-4">
              <FieldLabel label="Original Price (₹)" required hint="Full MRP shown as strikethrough.">
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" placeholder="1499" className={fi} />
              </FieldLabel>
              <FieldLabel label="Selling Price (₹)" hint="What students actually pay. Leave 0 if no discount.">
                <input type="number" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} min="0" placeholder="999" className={fi} />
              </FieldLabel>
            </div>
          )}
          <FieldLabel label="Thumbnail">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumb(e.target.files[0] || null)}
              className="text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/5 file:px-3 file:py-1.5 file:text-xs file:text-white/70 hover:file:bg-white/10"
            />
          </FieldLabel>
        </div>
        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isEdit ? "Update Course" : "Create Course"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Chapter Content Panel ────────────────────────────────────────────────────

function ChapterContentPanel({ chapter, examId, onRefresh }) {
  const [tab, setTab] = useState("notes");
  const [noteDrawer, setNoteDrawer] = useState(null);
  const [videoForm, setVideoForm] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try { await deleteNote(id); toast.success("Deleted"); onRefresh(); } catch (e) { toast.error(e?.message || "Failed"); }
  };
  const handleDeleteVideo = async (id) => {
    if (!window.confirm("Delete this video?")) return;
    try { await deleteVideo(id); toast.success("Deleted"); onRefresh(); } catch (e) { toast.error(e?.message || "Failed"); }
  };
  const handleUnlinkTest = async (testId) => {
    if (!window.confirm("Unlink this test?")) return;
    try { await unlinkTestFromChapter(chapter._id, testId); toast.success("Unlinked"); onRefresh(); } catch (e) { toast.error(e?.message || "Failed"); }
  };
  const handleLinkTest = async (testId) => {
    try { await linkTestToChapter(chapter._id, testId); toast.success("Test linked"); onRefresh(); } catch (e) { toast.error(e?.message || "Failed"); }
  };

  const tabs = [
    { id: "notes", label: "Notes", count: chapter.notes?.length || 0, icon: FileText },
    { id: "videos", label: "Videos", count: chapter.videos?.length || 0, icon: Video },
    { id: "tests", label: "Linked Tests", count: chapter.linkedTests?.length || 0, icon: Link2 },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-1 rounded-2xl glass-card p-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-brand-primary/15 text-brand-primary"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={14} />
              {t.label}
              <span className={`rounded-full px-1.5 text-[10px] font-bold ${
                tab === t.id ? "bg-brand-primary/20 text-brand-primary" : "bg-white/5 text-white/40"
              }`}>
                {t.count}
              </span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 pr-1">
          {tab === "notes" && (
            <button
              onClick={() => setNoteDrawer({})}
              className="flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-1.5 text-xs font-bold text-dark-400 hover:brightness-110"
            >
              <Plus size={13} /> Add Note
            </button>
          )}
          {tab === "videos" && (
            <button
              onClick={() => setVideoForm({})}
              className="flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-1.5 text-xs font-bold text-dark-400 hover:brightness-110"
            >
              <Plus size={13} /> Add Video
            </button>
          )}
          {tab === "tests" && (
            <TestPicker
              onLink={handleLinkTest}
              examId={examId}
              existingTestIds={(chapter.linkedTests || []).map((lt) => String(lt.testId?._id || lt.testId))}
            />
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="overflow-hidden rounded-2xl glass-card">
        {/* Notes */}
        {tab === "notes" && (
          <div className="divide-y divide-white/5">
            {(!chapter.notes?.length) ? (
              <div className="px-6 py-12 text-center">
                <FileText size={28} className="mx-auto mb-3 text-white/15" />
                <p className="text-sm text-white/40">No notes yet. Add your first note.</p>
              </div>
            ) : (
              (chapter.notes || []).map((note) => (
                <div key={note._id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/2 group transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    note.type === "pdf" ? "bg-red-500/15 text-red-400" : "bg-brand-primary/15 text-brand-primary"
                  }`}>
                    <FileText size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{note.title}</p>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">
                      {note.type === "pdf" ? "PDF Document" : "Rich Text"}
                    </span>
                  </div>
                  {note.type === "pdf" && (
                    <button onClick={() => setPdfPreview(note)} className="shrink-0 rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white">
                      <Eye size={14} />
                    </button>
                  )}
                  <button onClick={() => setNoteDrawer({ note })} className="shrink-0 rounded-lg p-1.5 text-white/40 opacity-0 group-hover:opacity-100 hover:text-white transition-opacity">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDeleteNote(note._id)} className="shrink-0 rounded-lg p-1.5 text-red-400/60 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Videos */}
        {tab === "videos" && (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {(!chapter.videos?.length) ? (
              <div className="col-span-full px-6 py-12 text-center">
                <Video size={28} className="mx-auto mb-3 text-white/15" />
                <p className="text-sm text-white/40">No videos yet. Add a YouTube video.</p>
              </div>
            ) : (
              (chapter.videos || []).map((vid) => {
                const ytId = vid.youtubeId || vid.youtubeUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/)?.[1];
                return (
                  <div key={vid._id} className="group overflow-hidden rounded-2xl border border-white/8 bg-white/2 transition-all hover:border-brand-primary/25 hover:bg-white/4">
                    <div className="relative aspect-video overflow-hidden bg-black/20">
                      {ytId ? (
                        <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-red-500/10">
                          <Video size={22} className="text-red-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{vid.title}</p>
                          <p className="text-[11px] text-white/55">{vid.description || "YouTube lecture"}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">Video</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{vid.title}</p>
                        <p className="text-[11px] text-white/40 truncate">{vid.description || "No description added"}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setVideoForm({ video: vid })} className="rounded-lg p-1.5 text-white/45 hover:bg-white/5 hover:text-white">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteVideo(vid._id)} className="rounded-lg p-1.5 text-red-400/60 hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tests */}
        {tab === "tests" && (
          <div className="divide-y divide-white/5">
            {(!chapter.linkedTests?.length) ? (
              <div className="px-6 py-12 text-center">
                <Link2 size={28} className="mx-auto mb-3 text-white/15" />
                <p className="text-sm text-white/40">No tests linked. Use "Link Test" to add.</p>
              </div>
            ) : (
              (chapter.linkedTests || []).map((lt) => {
                const test = lt.test || lt;
                const testId = lt.testId?._id || lt.testId;
                return (
                  <div key={String(testId)} className="flex items-center gap-4 px-6 py-4 hover:bg-white/2 group transition-colors">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      test.type === "pyq" ? "bg-purple-500/15 text-purple-400" : "bg-brand-primary/15 text-brand-primary"
                    }`}>
                      {(test.type || "practice").toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{test.title || "Unknown Test"}</p>
                      <p className="text-[11px] text-white/40">{test.duration ? `${test.duration} min` : ""}</p>
                    </div>
                    <button onClick={() => handleUnlinkTest(testId)} className="shrink-0 rounded-lg p-1.5 text-red-400/60 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity">
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {noteDrawer !== null && (
        <NoteEditorDrawer
          chapterId={chapter._id}
          note={noteDrawer.note}
          onClose={() => setNoteDrawer(null)}
          onSaved={() => { setNoteDrawer(null); onRefresh(); }}
        />
      )}
      {videoForm !== null && (
        <VideoForm
          chapterId={chapter._id}
          video={videoForm.video}
          onClose={() => setVideoForm(null)}
          onSaved={() => { setVideoForm(null); onRefresh(); }}
        />
      )}
      {pdfPreview && <PdfPreviewModal note={pdfPreview} onClose={() => setPdfPreview(null)} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CourseManager() {
  const [params, setParams] = useSearchParams();

  const [hierarchy, setHierarchy] = useState([]);
  const [fullCourseTree, setFullCourseTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);

  const [level, setLevel] = useState(params.get("level") || "categories");
  const [selectedCategoryId, setSelectedCategoryId] = useState(params.get("categoryId") || null);
  const [selectedExamId, setSelectedExamId] = useState(params.get("examId") || null);
  const [selectedCourseId, setSelectedCourseId] = useState(params.get("courseId") || null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(params.get("subjectId") || null);
  const [selectedChapterId, setSelectedChapterId] = useState(params.get("chapterId") || null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [courseModal, setCourseModal] = useState(null);
  const [entityModal, setEntityModal] = useState({ isOpen: false, mode: "create", editData: null });
  const [entityTitle, setEntityTitle] = useState("");
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: null, id: null });
  const [actionLoading, setActionLoading] = useState(false);

  // ── URL helpers ──────────────────────────────────────────────────────────────

  const updateUrl = useCallback((next) => {
    const sp = new URLSearchParams();
    const current = {
      level,
      categoryId: selectedCategoryId,
      examId: selectedExamId,
      courseId: selectedCourseId,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
    };
    const keys = ["level", "categoryId", "examId", "courseId", "subjectId", "chapterId"];
    keys.forEach((k) => {
      const val = k in next ? next[k] : current[k];
      if (val) sp.set(k, val);
    });
    setParams(sp, { replace: true });
  }, [level, selectedCategoryId, selectedExamId, selectedCourseId, selectedSubjectId, selectedChapterId, setParams]);

  // Sync URL → state
  useEffect(() => {
    setLevel(params.get("level") || "categories");
    setSelectedCategoryId(params.get("categoryId") || null);
    setSelectedExamId(params.get("examId") || null);
    setSelectedCourseId(params.get("courseId") || null);
    setSelectedSubjectId(params.get("subjectId") || null);
    setSelectedChapterId(params.get("chapterId") || null);
  }, [params]);

  // ── Data fetching ─────────────────────────────────────────────────────────────

  const fetchHierarchy = useCallback(async () => {
    try {
      const data = await getAdminCourseHierarchy();
      setHierarchy(data || []);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFullTree = useCallback(async (courseId) => {
    if (!courseId) return;
    setLoadingTree(true);
    try {
      const tree = await getAdminCourseTree(courseId);
      setFullCourseTree(tree);
    } catch {
      toast.error("Failed to load course content");
    } finally {
      setLoadingTree(false);
    }
  }, []);

  useEffect(() => { fetchHierarchy(); }, [fetchHierarchy]);

  useEffect(() => {
    if (selectedCourseId) fetchFullTree(selectedCourseId);
    else setFullCourseTree(null);
  }, [selectedCourseId, fetchFullTree]);

  const refreshAll = useCallback(() => {
    fetchHierarchy();
    if (selectedCourseId) fetchFullTree(selectedCourseId);
  }, [fetchHierarchy, fetchFullTree, selectedCourseId]);

  // ── Derived data ──────────────────────────────────────────────────────────────

  const selectedCategory = useMemo(
    () => hierarchy.find((c) => c._id === selectedCategoryId) || null,
    [hierarchy, selectedCategoryId]
  );
  const selectedExam = useMemo(
    () => (selectedCategory?.exams || []).find((e) => e._id === selectedExamId) || null,
    [selectedCategory, selectedExamId]
  );
  const selectedCourse = useMemo(
    () => (selectedExam?.courses || []).find((c) => c._id === selectedCourseId) || null,
    [selectedExam, selectedCourseId]
  );
  const selectedSubject = useMemo(
    () => (fullCourseTree?.subjects || []).find((s) => s._id === selectedSubjectId) || null,
    [fullCourseTree, selectedSubjectId]
  );
  const selectedChapter = useMemo(
    () => (selectedSubject?.chapters || []).find((ch) => ch._id === selectedChapterId) || null,
    [selectedSubject, selectedChapterId]
  );

  const allExams = useMemo(() => hierarchy.flatMap((c) => c.exams || []), [hierarchy]);

  // ── Breadcrumb ────────────────────────────────────────────────────────────────

  const hierarchyPath = useMemo(() => {
    const parts = [];
    if (selectedCategory) parts.push(selectedCategory.title);
    if (selectedExam) parts.push(selectedExam.title);
    if (selectedCourse) parts.push(selectedCourse.title);
    if (selectedSubject) parts.push(selectedSubject.title);
    if (selectedChapter) parts.push(selectedChapter.title);
    return parts;
  }, [selectedCategory, selectedExam, selectedCourse, selectedSubject, selectedChapter]);

  // ── Rows ──────────────────────────────────────────────────────────────────────

  const isContentLevel = level === "chapters" && Boolean(selectedChapterId);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [];
    if (level === "categories") rows = hierarchy;
    else if (level === "exams") rows = selectedCategory?.exams || [];
    else if (level === "courses") rows = selectedExam?.courses || [];
    else if (level === "subjects") rows = fullCourseTree?.subjects || [];
    else if (level === "chapters" && !selectedChapterId) rows = selectedSubject?.chapters || [];
    return q ? rows.filter((r) => (r.title || "").toLowerCase().includes(q)) : rows;
  }, [search, level, hierarchy, selectedCategory, selectedExam, fullCourseTree, selectedSubject, selectedChapterId]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );

  useEffect(() => { setPage(1); }, [search, level, selectedCategoryId, selectedExamId, selectedCourseId, selectedSubjectId, selectedChapterId]);

  // ── Navigation ────────────────────────────────────────────────────────────────

  const handleRowSelect = (row) => {
    if (level === "categories") {
      updateUrl({ level: "exams", categoryId: row._id, examId: null, courseId: null, subjectId: null, chapterId: null });
    } else if (level === "exams") {
      updateUrl({ level: "courses", examId: row._id, courseId: null, subjectId: null, chapterId: null });
    } else if (level === "courses") {
      updateUrl({ level: "subjects", courseId: row._id, subjectId: null, chapterId: null });
    } else if (level === "subjects") {
      updateUrl({ level: "chapters", subjectId: row._id, chapterId: null });
    } else if (level === "chapters") {
      updateUrl({ chapterId: row._id });
    }
  };

  const goBack = () => {
    if (level === "chapters" && selectedChapterId) {
      updateUrl({ chapterId: null });
      return;
    }
    if (level === "exams") updateUrl({ level: "categories", categoryId: null, examId: null, courseId: null, subjectId: null, chapterId: null });
    else if (level === "courses") updateUrl({ level: "exams", examId: null, courseId: null, subjectId: null, chapterId: null });
    else if (level === "subjects") updateUrl({ level: "courses", courseId: null, subjectId: null, chapterId: null });
    else if (level === "chapters") updateUrl({ level: "subjects", subjectId: null, chapterId: null });
  };

  const canGoBack = level !== "categories" || isContentLevel;

  // ── Header labels ─────────────────────────────────────────────────────────────

  const headerTitle = isContentLevel
    ? (selectedChapter?.title || "Chapter Content")
    : LEVEL_LABELS[level] || level;

  const canCreate = ["courses", "subjects", "chapters"].includes(level) && !isContentLevel;
  const actionLabel =
    level === "courses" ? "New Course" :
    level === "subjects" ? "New Subject" :
    level === "chapters" ? "New Chapter" : null;

  // ── CRUD handlers ─────────────────────────────────────────────────────────────

  const handleCreate = () => {
    if (level === "courses") { setCourseModal({}); return; }
    setEntityTitle("");
    setEntityModal({ isOpen: true, mode: "create", editData: null });
  };

  const handleEditRow = (row) => {
    if (level === "courses") { setCourseModal({ course: row }); return; }
    setEntityTitle(row.title);
    setEntityModal({ isOpen: true, mode: "edit", editData: row });
  };

  const handleSaveEntity = async () => {
    if (!entityTitle.trim()) return;
    setActionLoading(true);
    try {
      if (entityModal.mode === "create") {
        if (level === "subjects") await createSubject(selectedCourseId, { title: entityTitle.trim() });
        else if (level === "chapters") await createChapter(selectedSubjectId, { title: entityTitle.trim() });
        toast.success("Created successfully");
      } else {
        const id = entityModal.editData?._id;
        if (level === "subjects") await updateSubject(id, { title: entityTitle.trim() });
        else if (level === "chapters") await updateChapter(id, { title: entityTitle.trim() });
        toast.success("Updated successfully");
      }
      setEntityModal({ isOpen: false, mode: "create", editData: null });
      refreshAll();
    } catch (e) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const { type, id } = confirmState;
      if (type === "course") {
        await deleteCourse(id);
        if (selectedCourseId === id) updateUrl({ level: "courses", courseId: null, subjectId: null, chapterId: null });
      } else if (type === "subject") {
        await deleteSubject(id);
        if (selectedSubjectId === id) updateUrl({ subjectId: null, chapterId: null });
      } else if (type === "chapter") {
        await deleteChapter(id);
        if (selectedChapterId === id) updateUrl({ chapterId: null });
      }
      toast.success("Deleted successfully");
      refreshAll();
    } catch (e) {
      toast.error(e?.message || "Failed to delete");
    } finally {
      setActionLoading(false);
      setConfirmState({ isOpen: false, type: null, id: null });
    }
  };

  const isReadOnly = level === "categories" || level === "exams";
  const showTableLoading = loadingTree && (level === "subjects" || level === "chapters");

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Toolbar ── */}
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
            <button
              onClick={goBack}
              className="rounded-xl glass-pill px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
            >
              ← Back
            </button>
          )}
          {canCreate && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-400 transition hover:brightness-110"
            >
              <Plus size={16} /> {actionLabel}
            </button>
          )}
        </div>
      </div>

      {/* ── Chapter content panel ── */}
      {isContentLevel ? (
        <div className="space-y-2">
          {showTableLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 size={22} className="animate-spin text-brand-primary" />
            </div>
          ) : selectedChapter ? (
            <ChapterContentPanel chapter={selectedChapter} examId={selectedExamId} onRefresh={refreshAll} />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-2xl glass-card">
              <p className="text-sm text-white/40">Chapter not found.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Search ── */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl glass-card p-4">
            <div className="relative min-w-64 flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${(LEVEL_LABELS[level] || level).toLowerCase()}...`}
                className="w-full rounded-xl border border-white/10 bg-dark-300/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
            </div>
          </div>

          {/* ── Table ── */}
          <div className="overflow-hidden rounded-2xl glass-card">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Name</th>
                    {level === "categories" && (
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Exams</th>
                    )}
                    {level === "exams" && (
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Courses</th>
                    )}
                    {level === "courses" && (
                      <>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Price</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Subjects</th>
                      </>
                    )}
                    {level === "subjects" && (
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Chapters</th>
                    )}
                    {level === "chapters" && (
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Content</th>
                    )}
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-white/50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {showTableLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <Loader2 size={22} className="animate-spin text-brand-primary mx-auto" />
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-sm text-white/40">
                        {search
                          ? `No results for "${search}"`
                          : `No ${(LEVEL_LABELS[level] || level).toLowerCase()} found.${canCreate ? " Create your first one above." : ""}`
                        }
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, idx) => {
                      const LevelIcon = LEVEL_ICON[level] || FileText;
                      const iconColor = ICON_COLOR[level] || "text-brand-primary";
                      return (
                        <tr
                          key={row._id}
                          className="transition-colors hover:bg-white/4 animate-fade-up"
                          style={{ animationDelay: `${idx * 25}ms` }}
                        >
                          {/* Name */}
                          <td
                            className="px-6 py-4 text-sm font-semibold text-white cursor-pointer"
                            onClick={() => handleRowSelect(row)}
                          >
                            <div className="flex items-center gap-2">
                              <LevelIcon size={14} className={iconColor} />
                              {row.title}
                            </div>
                          </td>

                          {/* Category: exam count */}
                          {level === "categories" && (
                            <td className="px-6 py-4 text-sm text-white/50">
                              {(row.exams || []).length} exams
                            </td>
                          )}

                          {/* Exam: course count */}
                          {level === "exams" && (
                            <td className="px-6 py-4 text-sm text-white/50">
                              {(row.courses || []).length} courses
                            </td>
                          )}

                          {/* Course columns */}
                          {level === "courses" && (
                            <>
                              <td className="px-6 py-4 text-xs">
                                <span className={`rounded-full px-2.5 py-1 font-semibold uppercase tracking-wider ${
                                  row.status === "published"
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : "bg-white/5 text-white/60"
                                }`}>
                                  {row.status === "published" ? (
                                    <span className="flex items-center gap-1"><Globe size={10} /> Published</span>
                                  ) : (
                                    <span className="flex items-center gap-1"><EyeOff size={10} /> Draft</span>
                                  )}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {row.isPaid ? (
                                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                                    <DollarSign size={12} />
                                    {row.discountedPrice > 0 && row.discountedPrice < row.price ? (
                                      <>
                                        <span className="line-through text-white/35 text-xs">₹{row.price}</span>
                                        <span>₹{row.discountedPrice}</span>
                                      </>
                                    ) : (
                                      <span>₹{row.price}</span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="font-semibold text-emerald-400">Free</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-white/50">
                                {(row.subjects || []).length} subjects
                              </td>
                            </>
                          )}

                          {/* Subject: chapter count */}
                          {level === "subjects" && (
                            <td className="px-6 py-4 text-sm text-white/50">
                              {(row.chapters || []).length} chapters
                            </td>
                          )}

                          {/* Chapter: content summary */}
                          {level === "chapters" && (
                            <td className="px-6 py-4 text-xs text-white/50">
                              <div className="flex items-center gap-3">
                                {(row.notesCount || 0) > 0 && (
                                  <span className="flex items-center gap-1">
                                    <FileText size={11} className="text-brand-primary" /> {row.notesCount} notes
                                  </span>
                                )}
                                {(row.videosCount || 0) > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Video size={11} className="text-red-400" /> {row.videosCount} videos
                                  </span>
                                )}
                                {(row.notesCount || 0) === 0 && (row.videosCount || 0) === 0 && (
                                  <span className="text-white/25">No content yet</span>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRowSelect(row)}
                                className="rounded-lg glass-pill px-3 py-1.5 text-xs text-white/80 hover:text-white"
                              >
                                {level === "chapters" ? "Manage" : "View"}
                              </button>
                              {!isReadOnly && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEditRow(row); }}
                                    className="rounded-lg glass-pill p-2 text-white/70 hover:text-white"
                                    title="Edit"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmState({
                                        isOpen: true,
                                        type: level === "courses" ? "course" : level === "subjects" ? "subject" : "chapter",
                                        id: row._id,
                                      });
                                    }}
                                    className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
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
            <PaginationBar
              page={page}
              totalPages={totalPages}
              totalCount={filteredRows.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          )}
        </>
      )}

      {/* ── Subject / Chapter entity modal ── */}
      <Modal
        isOpen={entityModal.isOpen}
        title={`${entityModal.mode === "edit" ? "Edit" : "Create"} ${level === "subjects" ? "Subject" : "Chapter"}`}
        onClose={() => setEntityModal({ isOpen: false, mode: "create", editData: null })}
      >
        <FieldLabel label="Title" required>
          <input
            value={entityTitle}
            onChange={(e) => setEntityTitle(e.target.value)}
            placeholder={level === "subjects" ? "e.g. Physics" : "e.g. Motion in a Straight Line"}
            className={fi}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSaveEntity()}
          />
        </FieldLabel>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setEntityModal({ isOpen: false, mode: "create", editData: null })}
            className="rounded-lg glass-pill px-4 py-2 text-sm text-white/80"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEntity}
            disabled={actionLoading || !entityTitle.trim()}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-dark-400 disabled:opacity-50"
          >
            {actionLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      {/* ── Course modal ── */}
      {courseModal !== null && (
        <CourseFormModal
          course={courseModal.course}
          exams={allExams}
          onClose={() => setCourseModal(null)}
          onSaved={() => { setCourseModal(null); refreshAll(); }}
        />
      )}

      {/* ── Confirm delete ── */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: null, id: null })}
        onConfirm={handleDelete}
        title="Delete item"
        message="This will permanently remove the item and all its nested content. This cannot be undone."
      />
    </div>
  );
}
