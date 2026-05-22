import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, Plus, ChevronRight, Trash2, Pencil, Check, X,
  FileText, Video, Link2, Loader2, Upload, Eye,
  GraduationCap, Folder, Tag, Search, DollarSign, Globe, EyeOff,
  ChevronDown, Layers, Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  getAdminCourseHierarchy, createCourse, updateCourse, deleteCourse,
  createSubject, updateSubject, deleteSubject,
  createChapter, updateChapter, deleteChapter,
  createRichTextNote, createPdfNote, updateNote, deleteNote,
  createVideo, updateVideo, deleteVideo,
  linkTestToChapter, unlinkTestFromChapter,
} from "../../services/courseService";
import api from "../../services/api";

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── UI Atoms ─────────────────────────────────────────────────────────────────

function Btn({ children, onClick, variant = "primary", className = "", disabled, type = "button" }) {
  const base = "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40";
  const v = {
    primary: "bg-brand-primary text-dark-400 hover:opacity-90",
    ghost: "text-white/70 hover:bg-white/5 hover:text-white",
    danger: "text-red-400 hover:bg-red-500/10",
    outline: "border border-white/10 text-white/80 hover:bg-white/5",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${v[variant]} ${className}`}>{children}</button>;
}

function InlineInput({ value, onSave, onCancel, placeholder }) {
  const [val, setVal] = useState(value);
  return (
    <form onSubmit={(e) => { e.preventDefault(); val.trim() && onSave(val.trim()); }} className="flex items-center gap-1.5 flex-1 min-w-0">
      <input
        autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder}
        className="flex-1 min-w-0 rounded-lg border border-brand-primary/40 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-brand-primary"
      />
      <button type="submit" disabled={!val.trim()} className="rounded-md bg-brand-primary/20 p-1 text-brand-primary disabled:opacity-30 hover:bg-brand-primary/30"><Check size={12} /></button>
      <button type="button" onClick={onCancel} className="rounded-md p-1 text-white/40 hover:bg-white/5"><X size={12} /></button>
    </form>
  );
}

// ─── Test Picker ──────────────────────────────────────────────────────────────

function TestPicker({ onLink, existingTestIds = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get("/teacher/tests", { params: { limit: 100 } })
      .then((r) => setTests(r.data?.tests || r.data || []))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = tests.filter((t) =>
    !existingTestIds.includes(String(t._id)) && t.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <Btn variant="outline" className="text-xs py-1.5 px-3" onClick={() => setOpen(!open)}>
        <Link2 size={13} /> Link Test
      </Btn>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-80 rounded-2xl border border-white/10 bg-dark-300 p-3 shadow-2xl">
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2">
            <Search size={13} className="text-white/40" />
            <input autoFocus placeholder="Search tests..." value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 bg-transparent text-xs text-white placeholder-white/30 outline-none" />
          </div>
          {loading ? (
            <div className="flex justify-center py-3"><Loader2 size={18} className="animate-spin text-brand-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-3 text-center text-xs text-white/40">No tests found</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filtered.map((t) => (
                <button key={t._id} onClick={() => { onLink(t._id); setOpen(false); setQuery(""); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 hover:text-white">
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${t.type === "pyq" ? "bg-purple-500/15 text-purple-400" : "bg-brand-primary/15 text-brand-primary"}`}>{t.type?.toUpperCase()}</span>
                  <span className="flex-1 truncate">{t.title}</span>
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 border-t border-white/5 pt-2">
            <Btn variant="ghost" className="w-full justify-center text-xs" onClick={() => setOpen(false)}>Cancel</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Note Editor Drawer ───────────────────────────────────────────────────────

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
    } catch (err) { toast.error(err?.message || "Failed to save note"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-dark-300 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h3 className="font-bold text-white">{isEdit ? "Edit Note" : "New Note"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title..." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-primary" />
          </div>
          {!isEdit && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60">Type</label>
              <div className="flex gap-3">
                {["rich_text","pdf"].map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${type === t ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-white/10 text-white/50 hover:border-white/20"}`}>
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
                <ReactQuill theme="snow" value={content} onChange={setContent} modules={QUILL_MODULES} formats={QUILL_FORMATS} style={{ minHeight: 260 }} placeholder="Write your notes..." />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60">PDF File</label>
              {note?.fileUrl && !pdfFile && (
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-2.5">
                  <FileText size={14} className="text-red-400" />
                  <span className="text-xs text-white/60 truncate">{note.fileName || "Current PDF"}</span>
                  <a href={note.fileUrl} target="_blank" rel="noreferrer" className="ml-auto text-xs text-brand-primary hover:underline">View</a>
                </div>
              )}
              <div onClick={() => fileRef.current?.click()} className="cursor-pointer rounded-xl border-2 border-dashed border-white/10 hover:border-brand-primary/40 p-6 text-center transition-colors">
                <Upload size={24} className="mx-auto mb-2 text-white/30" />
                <p className="text-sm text-white/50">{pdfFile ? pdfFile.name : "Click to select PDF"}</p>
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files[0] || null)} />
              </div>
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setAllowDownload((v) => !v)} className={`relative h-5 w-9 rounded-full transition-colors ${allowDownload ? "bg-brand-primary" : "bg-white/10"}`}>
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${allowDownload ? "translate-x-4" : "translate-x-0"}`} />
            </div>
            <span className="text-sm text-white/70">Allow download</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {isEdit ? "Update" : "Create"}
          </Btn>
        </div>
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
  const ytId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/)?.[1];

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title required");
    if (!ytId) return toast.error("Valid YouTube URL required");
    setSaving(true);
    try {
      if (isEdit) await updateVideo(video._id, { title, youtubeUrl: url, description: desc });
      else await createVideo(chapterId, { title, youtubeUrl: url, description: desc });
      toast.success(isEdit ? "Video updated" : "Video added");
      onSaved();
    } catch (err) { toast.error(err?.message || "Failed to save video"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-dark-300 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h3 className="font-bold text-white">{isEdit ? "Edit Video" : "Add Video"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/5"><X size={16} /></button>
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
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {isEdit ? "Update" : "Add"}
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
  const [status, setStatus] = useState(course?.status || "draft");
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
      fd.append("status", status);
      if (thumb) fd.append("thumbnail", thumb);
      if (isEdit) await updateCourse(course._id, fd);
      else await createCourse(fd);
      toast.success(isEdit ? "Course updated" : "Course created");
      onSaved();
    } catch (err) { toast.error(err?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-dark-300 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h3 className="font-bold text-white">{isEdit ? "Edit Course" : "New Course"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/5"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title..." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Exam *</label>
            <select value={examId} onChange={(e) => setExamId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-dark-400 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary">
              {exams.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Description</label>
            <div className="quill-dark">
              <ReactQuill theme="snow" value={description} onChange={setDescription} modules={{ toolbar: [[{ header: [1, 2, false] }], ["bold", "italic"], ["link"], ["clean"]] }} style={{ minHeight: 120 }} placeholder="Course description..." />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-white/60">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-white/10 bg-dark-400 px-4 py-2.5 text-sm text-white outline-none">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <div onClick={() => setIsPaid((v) => !v)} className={`relative h-5 w-9 rounded-full transition-colors ${isPaid ? "bg-brand-primary" : "bg-white/10"}`}>
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isPaid ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <span className="text-sm text-white/70 whitespace-nowrap">Paid</span>
              </label>
            </div>
          </div>
          {isPaid && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60">Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-primary" />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Thumbnail</label>
            <input type="file" accept="image/*" onChange={(e) => setThumb(e.target.files[0] || null)} className="text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/5 file:px-3 file:py-1.5 file:text-xs file:text-white/70 hover:file:bg-white/10" />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {isEdit ? "Update" : "Create"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Chapter Content Panel ────────────────────────────────────────────────────

function ChapterContentPanel({ chapter, onRefresh }) {
  const [tab, setTab] = useState("notes");
  const [noteDrawer, setNoteDrawer] = useState(null);
  const [videoForm, setVideoForm] = useState(null);

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
    { id: "notes", label: "Notes", count: chapter.notes?.length || 0 },
    { id: "videos", label: "Videos", count: chapter.videos?.length || 0 },
    { id: "tests", label: "Linked Tests", count: chapter.linkedTests?.length || 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-white/5 pb-3 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${tab === t.id ? "bg-brand-primary/15 text-brand-primary" : "text-white/50 hover:bg-white/5 hover:text-white"}`}>
            {t.label}
            <span className={`rounded-full px-1.5 text-[10px] font-bold ${tab === t.id ? "bg-brand-primary/20 text-brand-primary" : "bg-white/5 text-white/40"}`}>{t.count}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {tab === "notes" && <Btn variant="outline" className="text-xs py-1.5 px-3" onClick={() => setNoteDrawer({})}><Plus size={13} /> Add Note</Btn>}
          {tab === "videos" && <Btn variant="outline" className="text-xs py-1.5 px-3" onClick={() => setVideoForm({})}><Plus size={13} /> Add Video</Btn>}
          {tab === "tests" && <TestPicker onLink={handleLinkTest} existingTestIds={(chapter.linkedTests || []).map((lt) => String(lt.testId?._id || lt.testId))} />}
        </div>
      </div>

      {/* Notes */}
      {tab === "notes" && (
        <div className="space-y-2">
          {(!chapter.notes?.length) && <p className="text-xs text-white/40 py-2">No notes yet.</p>}
          {(chapter.notes || []).map((note) => (
            <div key={note._id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3 group">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${note.type === "pdf" ? "bg-red-500/15 text-red-400" : "bg-brand-primary/15 text-brand-primary"}`}>
                <FileText size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{note.title}</p>
                <span className="text-[10px] text-white/40 uppercase">{note.type === "pdf" ? "PDF" : "Rich Text"}</span>
              </div>
              {note.type === "pdf" && note.fileUrl && (
                <a href={note.fileUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white"><Eye size={14} /></a>
              )}
              <button onClick={() => setNoteDrawer({ note })} className="shrink-0 rounded-lg p-1.5 text-white/40 opacity-0 group-hover:opacity-100 hover:text-white"><Pencil size={14} /></button>
              <button onClick={() => handleDeleteNote(note._id)} className="shrink-0 rounded-lg p-1.5 text-red-400/60 opacity-0 group-hover:opacity-100 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {tab === "videos" && (
        <div className="space-y-2">
          {(!chapter.videos?.length) && <p className="text-xs text-white/40 py-2">No videos yet.</p>}
          {(chapter.videos || []).map((vid) => {
            const ytId = vid.youtubeId || vid.youtubeUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/)?.[1];
            return (
              <div key={vid._id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3 group">
                {ytId ? (
                  <img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} alt="" className="h-10 w-14 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-red-500/15"><Video size={16} className="text-red-400" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{vid.title}</p>
                  {vid.description && <p className="text-[11px] text-white/40 truncate">{vid.description}</p>}
                </div>
                <button onClick={() => setVideoForm({ video: vid })} className="shrink-0 rounded-lg p-1.5 text-white/40 opacity-0 group-hover:opacity-100 hover:text-white"><Pencil size={14} /></button>
                <button onClick={() => handleDeleteVideo(vid._id)} className="shrink-0 rounded-lg p-1.5 text-red-400/60 opacity-0 group-hover:opacity-100 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tests */}
      {tab === "tests" && (
        <div className="space-y-2">
          {(!chapter.linkedTests?.length) && <p className="text-xs text-white/40 py-2">No tests linked. Use "Link Test" to add.</p>}
          {(chapter.linkedTests || []).map((lt) => {
            const test = lt.test || lt;
            const testId = lt.testId?._id || lt.testId;
            return (
              <div key={String(testId)} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3 group">
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${test.type === "pyq" ? "bg-purple-500/15 text-purple-400" : "bg-brand-primary/15 text-brand-primary"}`}>
                  {(test.type || "practice").toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{test.title || "Unknown Test"}</p>
                  <p className="text-[11px] text-white/40">{test.duration ? `${test.duration} min` : ""}</p>
                </div>
                <button onClick={() => handleUnlinkTest(testId)} className="shrink-0 rounded-lg p-1.5 text-red-400/60 opacity-0 group-hover:opacity-100 hover:text-red-400"><X size={14} /></button>
              </div>
            );
          })}
        </div>
      )}

      {noteDrawer !== null && (
        <NoteEditorDrawer chapterId={chapter._id} note={noteDrawer.note} onClose={() => setNoteDrawer(null)} onSaved={() => { setNoteDrawer(null); onRefresh(); }} />
      )}
      {videoForm !== null && (
        <VideoForm chapterId={chapter._id} video={videoForm.video} onClose={() => setVideoForm(null)} onSaved={() => { setVideoForm(null); onRefresh(); }} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CourseManager() {
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sidebar open state (mirrors AdminLayout pattern)
  const [openCategory, setOpenCategory] = useState(null);
  const [openExam, setOpenExam] = useState(null);
  const [openCourse, setOpenCourse] = useState(null);
  const [openSubject, setOpenSubject] = useState(null);

  // Selected items for detail panel
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  // Editing / adding states
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [addingSubjectFor, setAddingSubjectFor] = useState(null); // courseId
  const [addingChapterFor, setAddingChapterFor] = useState(null); // subjectId
  const [courseModal, setCourseModal] = useState(null);

  const fetchHierarchy = useCallback(async () => {
    try {
      const data = await getAdminCourseHierarchy();
      setHierarchy(data || []);
    } catch { toast.error("Failed to load courses"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHierarchy(); }, [fetchHierarchy]);

  const allExams = hierarchy.flatMap((cat) => cat.exams || []);
  const allCourses = allExams.flatMap((e) => e.courses || []);
  const selectedCourse = allCourses.find((c) => c._id === selectedCourseId);
  const selectedSubject = selectedCourse?.subjects?.find((s) => s._id === selectedSubjectId);
  const selectedChapter = selectedSubject?.chapters?.find((ch) => ch._id === selectedChapterId);

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Delete course and all content?")) return;
    try { await deleteCourse(id); toast.success("Deleted"); if (selectedCourseId === id) { setSelectedCourseId(null); setSelectedSubjectId(null); setSelectedChapterId(null); } fetchHierarchy(); } catch (e) { toast.error(e?.message || "Failed"); }
  };
  const handleSaveSubject = async (title) => {
    try { await createSubject(addingSubjectFor, { title }); toast.success("Subject added"); setAddingSubjectFor(null); fetchHierarchy(); } catch (e) { toast.error(e?.message || "Failed"); }
  };
  const handleUpdateSubject = async (id, title) => {
    try { await updateSubject(id, { title }); toast.success("Updated"); setEditingSubject(null); fetchHierarchy(); } catch (e) { toast.error(e?.message || "Failed"); }
  };
  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Delete subject + chapters?")) return;
    try { await deleteSubject(id); toast.success("Deleted"); if (selectedSubjectId === id) { setSelectedSubjectId(null); setSelectedChapterId(null); } fetchHierarchy(); } catch (e) { toast.error(e?.message || "Failed"); }
  };
  const handleSaveChapter = async (title) => {
    try { await createChapter(addingChapterFor, { title }); toast.success("Chapter added"); setAddingChapterFor(null); fetchHierarchy(); } catch (e) { toast.error(e?.message || "Failed"); }
  };
  const handleUpdateChapter = async (id, title) => {
    try { await updateChapter(id, { title }); toast.success("Updated"); setEditingChapter(null); fetchHierarchy(); } catch (e) { toast.error(e?.message || "Failed"); }
  };
  const handleDeleteChapter = async (id) => {
    if (!window.confirm("Delete chapter + content?")) return;
    try { await deleteChapter(id); toast.success("Deleted"); if (selectedChapterId === id) setSelectedChapterId(null); fetchHierarchy(); } catch (e) { toast.error(e?.message || "Failed"); }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 size={28} className="animate-spin text-brand-primary" /></div>;
  }

  return (
    <div className="flex gap-5 min-h-[calc(100vh-6rem)]">

      {/* ════════════════════════════════════════
          LEFT SIDEBAR — Collapsible tree
      ════════════════════════════════════════ */}
      <aside className="w-72 shrink-0">
        <div className="sticky top-6 rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-brand-primary" />
              <span className="text-sm font-bold text-white">Courses</span>
            </div>
            <button onClick={() => setCourseModal({})} className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors">
              <Plus size={14} />
            </button>
          </div>

          {/* Tree — scrollable */}
          <div className="custom-scrollbar max-h-[calc(100vh-14rem)] overflow-y-auto p-2 space-y-0.5">
            {hierarchy.length === 0 ? (
              <div className="py-8 text-center">
                <BookOpen size={24} className="mx-auto mb-2 text-white/20" />
                <p className="text-xs text-white/40 mb-3">No courses yet</p>
                <button onClick={() => setCourseModal({})} className="text-xs text-brand-primary hover:underline">Create your first course</button>
              </div>
            ) : (
              hierarchy.map((cat) => (
                <div key={cat._id}>
                  {/* Category row */}
                  <button
                    onClick={() => setOpenCategory((v) => v === cat._id ? null : cat._id)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/4"
                  >
                    <ChevronRight size={12} className={`text-white/30 transition-transform shrink-0 ${openCategory === cat._id ? "rotate-90" : ""}`} />
                    <Tag size={11} className="text-purple-400 shrink-0" />
                    <span className="flex-1 truncate text-xs font-bold text-purple-300">{cat.title}</span>
                    <span className="text-[9px] text-white/30">{(cat.exams || []).length}</span>
                  </button>

                  {openCategory === cat._id && (
                    <div className="ml-5 space-y-0.5 border-l border-white/5 pl-2">
                      {(cat.exams || []).map((exam) => (
                        <div key={exam._id}>
                          {/* Exam row */}
                          <button
                            onClick={() => setOpenExam((v) => v === exam._id ? null : exam._id)}
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/4"
                          >
                            <ChevronRight size={11} className={`text-white/30 transition-transform shrink-0 ${openExam === exam._id ? "rotate-90" : ""}`} />
                            <GraduationCap size={10} className="text-sky-400 shrink-0" />
                            <span className="flex-1 truncate text-xs text-sky-300">{exam.title}</span>
                            <span className="text-[9px] text-white/30">{(exam.courses || []).length}</span>
                          </button>

                          {openExam === exam._id && (
                            <div className="ml-4 space-y-0.5 border-l border-white/5 pl-2">
                              {(exam.courses || []).map((course) => (
                                <div key={course._id}>
                                  {/* Course row */}
                                  <div className={`flex items-center group rounded-xl pr-1 transition-colors ${selectedCourseId === course._id ? "bg-brand-primary/10" : "hover:bg-white/4"}`}>
                                    <button
                                      onClick={() => setOpenCourse((v) => v === course._id ? null : course._id)}
                                      className="shrink-0 p-1 text-white/30 hover:text-white"
                                    >
                                      <ChevronRight size={10} className={`transition-transform ${openCourse === course._id ? "rotate-90" : ""}`} />
                                    </button>
                                    <button
                                      onClick={() => { setSelectedCourseId(course._id); setSelectedSubjectId(null); setSelectedChapterId(null); }}
                                      className="flex flex-1 min-w-0 items-center gap-1.5 py-1.5 text-left"
                                    >
                                      <BookOpen size={10} className={selectedCourseId === course._id ? "text-brand-primary shrink-0" : "text-white/40 shrink-0"} />
                                      <span className={`flex-1 truncate text-xs ${selectedCourseId === course._id ? "text-brand-primary font-semibold" : "text-white/70"}`}>{course.title}</span>
                                      {course.isPaid && <DollarSign size={8} className="text-amber-400 shrink-0" />}
                                      {course.status === "published" ? <Globe size={8} className="text-emerald-400 shrink-0" /> : <EyeOff size={8} className="text-white/20 shrink-0" />}
                                    </button>
                                    <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setCourseModal({ course })} className="rounded-md p-0.5 text-white/30 hover:text-white"><Pencil size={9} /></button>
                                      <button onClick={() => handleDeleteCourse(course._id)} className="rounded-md p-0.5 text-red-400/50 hover:text-red-400"><Trash2 size={9} /></button>
                                    </div>
                                  </div>

                                  {/* Subjects under course */}
                                  {openCourse === course._id && (
                                    <div className="ml-4 space-y-0.5 border-l border-white/5 pl-2">
                                      {(course.subjects || []).map((sub) => (
                                        <div key={sub._id}>
                                          {/* Subject row */}
                                          <div className={`flex items-center group rounded-xl pr-1 transition-colors ${selectedSubjectId === sub._id ? "bg-teal-500/8" : "hover:bg-white/4"}`}>
                                            <button onClick={() => setOpenSubject((v) => v === sub._id ? null : sub._id)} className="shrink-0 p-1 text-white/20 hover:text-white">
                                              <ChevronRight size={9} className={`transition-transform ${openSubject === sub._id ? "rotate-90" : ""}`} />
                                            </button>

                                            {editingSubject === sub._id ? (
                                              <InlineInput value={sub.title} onSave={(t) => handleUpdateSubject(sub._id, t)} onCancel={() => setEditingSubject(null)} placeholder="Subject name" />
                                            ) : (
                                              <>
                                                <button onClick={() => { setSelectedSubjectId(sub._id); setSelectedChapterId(null); }} className="flex flex-1 min-w-0 items-center gap-1.5 py-1 text-left">
                                                  <Folder size={9} className="text-teal-400 shrink-0" />
                                                  <span className={`flex-1 truncate text-[11px] ${selectedSubjectId === sub._id ? "text-teal-300 font-semibold" : "text-white/60"}`}>{sub.title}</span>
                                                  <span className="text-[9px] text-white/30">{sub.chapters?.length || 0}</span>
                                                </button>
                                                <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button onClick={() => setEditingSubject(sub._id)} className="rounded-md p-0.5 text-white/25 hover:text-white"><Pencil size={8} /></button>
                                                  <button onClick={() => handleDeleteSubject(sub._id)} className="rounded-md p-0.5 text-red-400/40 hover:text-red-400"><Trash2 size={8} /></button>
                                                </div>
                                              </>
                                            )}
                                          </div>

                                          {/* Chapters under subject */}
                                          {openSubject === sub._id && (
                                            <div className="ml-3 space-y-0.5 border-l border-white/5 pl-2">
                                              {(sub.chapters || []).map((ch) => (
                                                <div key={ch._id} className={`flex items-center group rounded-lg pr-1 transition-colors ${selectedChapterId === ch._id ? "bg-amber-500/8" : "hover:bg-white/3"}`}>
                                                  {editingChapter === ch._id ? (
                                                    <div className="flex-1 min-w-0 py-1">
                                                      <InlineInput value={ch.title} onSave={(t) => handleUpdateChapter(ch._id, t)} onCancel={() => setEditingChapter(null)} placeholder="Chapter name" />
                                                    </div>
                                                  ) : (
                                                    <>
                                                      <button onClick={() => { setSelectedChapterId(ch._id); setSelectedSubjectId(sub._id); setSelectedCourseId(course._id); }} className="flex flex-1 min-w-0 items-center gap-1.5 py-1 pl-1 text-left">
                                                        <FileText size={8} className="text-amber-400 shrink-0" />
                                                        <span className={`flex-1 truncate text-[10px] ${selectedChapterId === ch._id ? "text-amber-300 font-semibold" : "text-white/50"}`}>{ch.title}</span>
                                                        <div className="flex gap-0.5 ml-auto">
                                                          {ch.notesCount > 0 && <span className="text-[8px] text-white/25">{ch.notesCount}📄</span>}
                                                          {ch.videosCount > 0 && <span className="text-[8px] text-white/25">{ch.videosCount}▶</span>}
                                                        </div>
                                                      </button>
                                                      <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setEditingChapter(ch._id)} className="rounded-md p-0.5 text-white/20 hover:text-white"><Pencil size={7} /></button>
                                                        <button onClick={() => handleDeleteChapter(ch._id)} className="rounded-md p-0.5 text-red-400/30 hover:text-red-400"><Trash2 size={7} /></button>
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                              ))}
                                              {/* Add chapter */}
                                              {addingChapterFor === sub._id ? (
                                                <div className="py-1 pl-1">
                                                  <InlineInput value="" onSave={handleSaveChapter} onCancel={() => setAddingChapterFor(null)} placeholder="Chapter name" />
                                                </div>
                                              ) : (
                                                <button onClick={() => setAddingChapterFor(sub._id)} className="flex w-full items-center gap-1 px-1 py-1 text-[10px] text-white/25 hover:text-brand-primary transition-colors">
                                                  <Plus size={8} /> Add Chapter
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                      {/* Add subject */}
                                      {addingSubjectFor === course._id ? (
                                        <div className="py-1">
                                          <InlineInput value="" onSave={handleSaveSubject} onCancel={() => setAddingSubjectFor(null)} placeholder="Subject name" />
                                        </div>
                                      ) : (
                                        <button onClick={() => setAddingSubjectFor(course._id)} className="flex w-full items-center gap-1 px-2 py-1 text-[10px] text-white/25 hover:text-teal-400 transition-colors">
                                          <Plus size={8} /> Add Subject
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {(exam.courses || []).length === 0 && (
                                <p className="px-2 py-1 text-[10px] text-white/25">No courses yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          RIGHT PANEL — Content
      ════════════════════════════════════════ */}
      <div className="flex-1 min-w-0">
        {/* Nothing selected */}
        {!selectedCourseId && (
          <div className="flex h-80 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10">
            <BookOpen size={36} className="text-white/15" />
            <p className="text-sm text-white/40">Select a course from the sidebar, or create a new one.</p>
            <Btn onClick={() => setCourseModal({})}><Plus size={14} /> New Course</Btn>
          </div>
        )}

        {/* Course selected, no chapter */}
        {selectedCourseId && !selectedChapterId && selectedCourse && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen size={20} className="text-brand-primary" />
                <div>
                  <h2 className="font-bold text-lg text-white">{selectedCourse.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-semibold ${selectedCourse.status === "published" ? "text-emerald-400" : "text-white/40"}`}>{selectedCourse.status}</span>
                    {selectedCourse.isPaid && <span className="text-xs text-amber-400 font-semibold">₹{selectedCourse.price}</span>}
                  </div>
                </div>
              </div>
              <Btn variant="outline" onClick={() => setCourseModal({ course: selectedCourse })}>
                <Settings size={14} /> Edit Course
              </Btn>
            </div>

            {/* Subject count summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Subjects", value: selectedCourse.subjects?.length || 0, color: "text-teal-400" },
                { label: "Chapters", value: (selectedCourse.subjects || []).reduce((a, s) => a + (s.chapters?.length || 0), 0), color: "text-amber-400" },
                { label: "Content Items", value: (selectedCourse.subjects || []).reduce((a, s) => a + (s.chapters || []).reduce((b, ch) => b + (ch.notesCount || 0) + (ch.videosCount || 0) + (ch.testsCount || 0), 0), 0), color: "text-brand-primary" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/2 p-4 text-center">
                  <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-white/40">
              Select a chapter from the sidebar to manage its notes, videos, and linked tests.
            </p>
          </div>
        )}

        {/* Chapter selected — show content panel */}
        {selectedChapterId && selectedChapter && (
          <div className="space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-white/40 flex-wrap">
              <button onClick={() => { setSelectedChapterId(null); setSelectedSubjectId(null); }} className="hover:text-white transition-colors">{selectedCourse?.title}</button>
              <ChevronRight size={10} />
              <span className="text-white/60">{selectedSubject?.title}</span>
              <ChevronRight size={10} />
              <span className="text-white font-semibold">{selectedChapter.title}</span>
            </div>

            <ChapterContentPanel chapter={selectedChapter} onRefresh={fetchHierarchy} />
          </div>
        )}
      </div>

      {/* Course modal */}
      {courseModal !== null && (
        <CourseFormModal course={courseModal.course} exams={allExams} onClose={() => setCourseModal(null)} onSaved={() => { setCourseModal(null); fetchHierarchy(); }} />
      )}
    </div>
  );
}
