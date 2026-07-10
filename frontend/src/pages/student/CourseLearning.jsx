import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen, ChevronRight, ChevronDown, Loader2, Lock, FileText, Eye,
  Video, Download, ArrowLeft, Play, BookMarked,
  CheckCircle2, Circle, Trophy, Menu, X, Layers, CreditCard, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getCourseFull, getNoteById, downloadNote,
  markChapterComplete, unmarkChapterComplete, getCourseProgress,
  createCourseOrder, verifyCoursePayment,
} from "../../services/courseService";
import { getMyAttempts } from "../../services/studentService";
import TestResult from "./TestResult";
import PdfPreviewFrame from "../../components/course/PdfPreviewFrame";
import AccessExpired from "../../components/student/AccessExpired";
import { formatValidity } from "../../utils/validity";
import { savePendingOrder, clearPendingOrder } from "../../utils/pendingPayment";
import { useResumePendingPayment } from "../../hooks/useResumePendingPayment";

const ensureRazorpayLoaded = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ percentage, className = "" }) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/50">Progress</span>
        <span className="text-xs font-bold text-brand-primary">{percentage}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-primary transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ─── YouTube Player ───────────────────────────────────────────────────────────

function YouTubePlayer({ youtubeId }) {
  if (!youtubeId) return null;
  return (
    <div className="w-full overflow-hidden rounded-2xl aspect-video bg-black shadow-2xl shadow-black/40">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
        title="Video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

// ─── Download Note Button ─────────────────────────────────────────────────────
// NotesSection only renders once course access is already granted (free or
// purchased) — see the access gate around ContentArea — so the only gate left
// here is the note's own `allowDownload` flag.

function DownloadNoteButton({ note, className, iconOnly = false }) {
  const [downloading, setDownloading] = useState(false);
  if (!note?.allowDownload) return null;

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadNote(note._id, `${note.title || "note"}.pdf`);
    } catch (err) {
      toast.error(err?.message || "Failed to download note");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      aria-label={`Download ${note.title}`}
      className={className}
    >
      {downloading ? <Loader2 size={iconOnly ? 12 : 14} className="animate-spin" /> : <Download size={iconOnly ? 12 : 14} />}
      {!iconOnly && (downloading ? "Downloading..." : "Download")}
    </button>
  );
}

// ─── Rich Text Note Viewer ────────────────────────────────────────────────────

function RichTextNote({ noteId }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getNoteById(noteId)
      .then((n) => { if (active) setNote(n); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [noteId]);

  if (loading) return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-white/5 bg-white/2">
      <Loader2 size={22} className="animate-spin text-brand-primary" />
    </div>
  );
  if (error) return (
    <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5">
      <Lock size={20} className="text-amber-400" />
      <p className="text-sm text-amber-400 font-medium">Content not available</p>
      <p className="text-xs text-white/40">Purchase this course to access full content</p>
    </div>
  );
  if (!note) return <p className="text-sm text-white/40 py-6 text-center">Note not found</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-base text-white truncate">{note.title}</h3>
        {note.type === "pdf" && (
          <DownloadNoteButton
            note={note}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white disabled:opacity-50"
          />
        )}
      </div>
      {note.type === "rich_text" && note.content ? (
        <div className="quill-content rounded-2xl border border-white/5 bg-white/2 p-6"
          dangerouslySetInnerHTML={{ __html: note.content }} />
      ) : note.type === "pdf" ? (
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden" style={{ height: "80vh" }}>
          <PdfPreviewFrame noteId={note._id} title={note.title} />
        </div>
      ) : (
        <p className="text-sm text-white/40 py-6 text-center">No content available</p>
      )}
    </div>
  );
}

function PdfPreviewModal({ note, onClose }) {
  if (!note) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-dark-300 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/35">PDF Preview</p>
            <h3 className="truncate text-base font-bold text-white">{note.title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DownloadNoteButton
              note={note}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white disabled:opacity-50"
            />
            <button onClick={onClose} className="rounded-lg p-1.5 text-white/45 hover:bg-white/5 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
        <PdfPreviewFrame noteId={note._id} title={note.title} className="bg-white" />
      </div>
    </div>
  );
}

// ─── Video Section ────────────────────────────────────────────────────────────

function VideoSection({ chapter }) {
  const videos = chapter.videos || [];
  const [activeVideo, setActiveVideo] = useState(videos[0] || null);
  const vid = activeVideo || videos[0];
  if (!vid) return null;

  const ytId = vid.youtubeId || vid.youtubeUrl?.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/
  )?.[1];

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/15">
          <Video size={14} className="text-brand-primary" />
        </div>
        <h2 className="text-sm font-bold text-white">
          Video Lectures
          <span className="ml-2 text-[11px] font-normal text-white/40">{videos.length} video{videos.length !== 1 ? "s" : ""}</span>
        </h2>
      </div>

      {videos.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {videos.map((v) => (
            <button
              key={v._id}
              onClick={() => setActiveVideo(v)}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${(activeVideo?._id || videos[0]._id) === v._id ? "bg-brand-primary/15 text-brand-primary" : "border border-white/8 text-white/60 hover:bg-white/5 hover:text-white"}`}
            >
              <Play size={11} /> {v.title}
            </button>
          ))}
        </div>
      )}

      {ytId ? (
        <div className="space-y-2">
          <YouTubePlayer youtubeId={ytId} />
          {videos.length === 1 && <p className="font-medium text-white text-sm">{vid.title}</p>}
          {vid.description && <p className="text-sm text-white/55 leading-relaxed">{vid.description}</p>}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-white/5 bg-white/1">
          <p className="text-sm text-white/30">Video URL not available</p>
        </div>
      )}
    </div>
  );
}

// ─── Notes Section ────────────────────────────────────────────────────────────

function NotesSection({ chapter }) {
  const notes = chapter.notes || [];
  const [activeNote, setActiveNote] = useState(notes[0] || null);
  const [previewNote, setPreviewNote] = useState(null);

  if (!notes.length) return null;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/15">
          <FileText size={14} className="text-brand-primary" />
        </div>
        <h2 className="text-sm font-bold text-white">
          Study Material
          <span className="ml-2 text-[11px] font-normal text-white/40">{notes.length} note{notes.length !== 1 ? "s" : ""} / PDF{notes.length !== 1 ? "s" : ""}</span>
        </h2>
      </div>

      <div className="flex gap-4">
        {notes.length > 1 && (
          <div className="w-48 shrink-0 space-y-1">
            {notes.map((note) => (
              <div
                key={note._id}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all ${activeNote?._id === note._id ? "bg-brand-primary/15 text-brand-primary" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
              >
                <button onClick={() => setActiveNote(note)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <FileText size={12} className={note.type === "pdf" ? "text-red-400 shrink-0" : "text-brand-primary shrink-0"} />
                  <span className="flex-1 truncate">{note.title}</span>
                </button>
                {note.type === "pdf" && (
                  <>
                    <button
                      onClick={() => setPreviewNote(note)}
                      className="shrink-0 rounded-lg p-1 text-white/45 hover:bg-white/5 hover:text-white"
                      aria-label={`Preview ${note.title}`}
                    >
                      <Eye size={12} />
                    </button>
                    <DownloadNoteButton
                      note={note}
                      iconOnly
                      className="shrink-0 rounded-lg p-1 text-white/45 hover:bg-white/5 hover:text-white disabled:opacity-50"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {activeNote && <RichTextNote noteId={activeNote._id} />}
        </div>
      </div>
      {previewNote && <PdfPreviewModal note={previewNote} onClose={() => setPreviewNote(null)} />}
    </div>
  );
}

// ─── Tests Section ────────────────────────────────────────────────────────────

function TestsSection({ chapter, courseId, attemptsByTest, onViewAnalysis }) {
  const navigate = useNavigate();
  const tests = chapter.linkedTests || [];
  if (!tests.length) return null;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/15">
          <BookOpen size={14} className="text-brand-primary" />
        </div>
        <h2 className="text-sm font-bold text-white">
          Related Tests
          <span className="ml-2 text-[11px] font-normal text-white/40">{tests.length} test{tests.length !== 1 ? "s" : ""}</span>
        </h2>
      </div>
      <div className="space-y-2">
        {tests.map((lt) => {
          const test = lt.test || {};
          const testId = lt.testId?._id || lt.testId;
          const attemptEntry = attemptsByTest?.[String(testId)] || null;
          const latestAttempt = attemptEntry?.latest || null;
          const completed = Boolean(latestAttempt && ["submitted", "evaluated"].includes(latestAttempt.status));
          return (
            <div
              key={String(testId)}
              className="group rounded-2xl border border-white/8 bg-white/2 p-4 transition-all hover:border-brand-primary/30 hover:bg-white/4"
            >
              <button
                onClick={() => navigate(`/student/courses/${courseId}/tests/${testId}`, { state: { returnTo: `/student/courses/${courseId}` } })}
                className="flex w-full items-center gap-4 text-left"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${test.type === "pyq" ? "bg-purple-500/15 text-purple-400" : "bg-brand-primary/15 text-brand-primary"}`}>
                  <BookOpen size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{test.title || "Untitled Test"}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-[11px] font-semibold uppercase ${test.type === "pyq" ? "text-purple-400" : "text-brand-primary"}`}>{test.type || "practice"}</span>
                    {test.duration && <span className="text-[11px] text-white/40">{test.duration} min</span>}
                    {test.totalMarks && <span className="text-[11px] text-white/40">{test.totalMarks} marks</span>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/30 group-hover:text-brand-primary transition-colors shrink-0" />
              </button>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                {attemptEntry?.count ? (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${completed ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                    {completed ? "Completed" : "Attempted"}
                  </span>
                ) : (
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Not attempted
                  </span>
                )}

                {latestAttempt?.submittedAt && (
                  <span className="text-[11px] text-white/40">
                    Last attempt: {new Date(latestAttempt.submittedAt).toLocaleString()}
                  </span>
                )}

                <div className="ml-auto flex items-center gap-2">
                  {latestAttempt?._id && (completed || attemptEntry?.count > 0) && (
                    <button
                      onClick={() => onViewAnalysis(latestAttempt._id)}
                      className="rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-primary hover:text-dark-400 transition-colors"
                    >
                      View Last Attempt Analysis
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Unlock Banner ───────────────────────────────────────────────────────────

function CourseUnlockBanner({ course, unlocking, onUnlock }) {
  const hasDiscount =
    course.discountedPrice > 0 && course.discountedPrice < course.price;
  const payable = hasDiscount ? course.discountedPrice : course.price;

  return (
    <div className="rounded-2xl border border-brand-primary/20 bg-white/3 overflow-hidden">
      {/* Top gradient bar */}
      <div className="h-1 w-full bg-linear-to-r from-amber-500 via-brand-primary to-emerald-500" />

      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/15 ring-1 ring-brand-primary/25">
            <Lock size={26} className="text-brand-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Unlock this course</h2>
            <p className="text-sm text-white/50 mt-0.5">
              Get full access to <span className="text-white/80 font-medium">{course.title}</span>
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { icon: <BookOpen size={14} />, label: "Full course content" },
            { icon: <FileText size={14} />, label: "All notes & PDFs" },
            { icon: <Video size={14} />, label: "Video lectures" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 text-white/60">
              <span className="text-brand-primary">{icon}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Price + validity + buy */}
        <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/8 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="min-w-0">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold text-white">₹{Number(payable).toLocaleString()}</span>
              {hasDiscount && (
                <span className="text-sm font-medium text-white/35 line-through mb-1">
                  ₹{Number(course.price).toLocaleString()}
                </span>
              )}
              {hasDiscount && (
                <span className="mb-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  {Math.round((1 - course.discountedPrice / course.price) * 100)}% OFF
                </span>
              )}
            </div>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand-primary/25 bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
              <Clock size={11} /> {formatValidity(course.validityMonths)}
            </p>
            <p className="mt-1 text-[11px] text-white/35">One-time payment · access from the moment you buy.</p>
          </div>
          <button
            onClick={onUnlock}
            disabled={unlocking}
            className="sm:ml-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3.5 text-sm font-bold text-dark-400 transition-all hover:opacity-90 disabled:opacity-50"
          >
            {unlocking ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
            {unlocking ? "Processing…" : `Buy Now · ₹${Number(payable).toLocaleString()}`}
          </button>
        </div>

        <p className="text-center text-[11px] text-white/25">
          Secure payment via Razorpay
        </p>
      </div>
    </div>
  );
}

// ─── Content Area ─────────────────────────────────────────────────────────────

function ContentArea({ chapter, courseId, attemptsByTest, onViewAnalysis }) {
  const videos = chapter.videos || [];
  const notes  = chapter.notes  || [];
  const tests  = chapter.linkedTests || [];

  if (!videos.length && !notes.length && !tests.length) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10">
        <BookMarked size={28} className="text-white/15" />
        <p className="text-sm text-white/40">No content added to this chapter yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {videos.length > 0 && <VideoSection key={`${chapter._id}-videos`} chapter={chapter} />}
      {notes.length  > 0 && <NotesSection key={`${chapter._id}-notes`} chapter={chapter} />}
      {tests.length  > 0 && (
        <TestsSection
          chapter={chapter}
          courseId={courseId}
          attemptsByTest={attemptsByTest}
          onViewAnalysis={onViewAnalysis}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessReason, setAccessReason] = useState(null);
  const [accessExpiresAt, setAccessExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ completedChapterIds: [], totalChapters: 0, completedCount: 0, percentage: 0 });
  const [markingComplete, setMarkingComplete] = useState(false);

  // Chapter selection lives in the URL (not plain state) so each selection is
  // a real browser-history entry — back then steps lesson → chapter list →
  // course list instead of exiting the course in one jump.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChapterId = searchParams.get("chapter");
  const [openSubjectId, setOpenSubjectId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [unlocking, setUnlocking] = useState(false);
  const [attemptsByTest, setAttemptsByTest] = useState({});
  const [activeResultId, setActiveResultId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCourseFull(courseId);
      setCourse(res.course);
      setHasAccess(res.hasAccess);
      setAccessReason(res.accessReason || null);
      setAccessExpiresAt(res.expiresAt || null);

      const prog = await getCourseProgress(courseId);
      setProgress(prog);
    } catch {
      navigate("/student/courses");
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => { load(); }, [load]);
  useResumePendingPayment("COURSE", courseId, load);

  useEffect(() => {
    let active = true;
    getMyAttempts()
      .then((res) => {
        if (!active) return;
        const attempts = res?.data || [];
        const nextMap = attempts.reduce((map, attempt) => {
          const testId = String(attempt?.testId?._id || attempt?.testId || "");
          if (!testId) return map;
          const entry = map[testId] || { latest: null, count: 0 };
          entry.count += 1;
          const currentTime = new Date(attempt?.submittedAt || attempt?.updatedAt || attempt?.createdAt || 0).getTime();
          const latestTime = entry.latest
            ? new Date(entry.latest?.submittedAt || entry.latest?.updatedAt || entry.latest?.createdAt || 0).getTime()
            : -1;
          if (!entry.latest || currentTime >= latestTime) entry.latest = attempt;
          map[testId] = entry;
          return map;
        }, {});
        setAttemptsByTest(nextMap);
      })
      .catch(() => {
        if (active) setAttemptsByTest({});
      });
    return () => { active = false; };
  }, []);

  // One-time purchase of THIS course at its own price; access lasts for the
  // course's configured validity period.
  const handleUnlockCourse = async () => {
    setUnlocking(true);
    try {
      await ensureRazorpayLoaded();
      const order = await createCourseOrder(courseId);

      if (order?.alreadyUnlocked) {
        await load();
        return;
      }

      const onSuccess = async (response) => {
        try {
          await verifyCoursePayment(courseId, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          clearPendingOrder();
          toast.success("Payment successful! Unlocking your course...");
          await load();
        } catch (err) {
          toast.error(err?.message || "Payment verification failed");
        } finally {
          setUnlocking(false);
        }
      };

      if (typeof order.orderId === "string" && order.orderId.startsWith("dev_")) {
        return onSuccess({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: `DEV_PAY_${Date.now()}`,
          razorpay_signature: "mock_signature",
        });
      }

      // Persisted before opening checkout so a lost `handler` callback (closed
      // tab, UPI app-switch inside an in-app browser) can still be resumed —
      // see useResumePendingPayment.
      savePendingOrder({ orderId: order.orderId, kind: "COURSE", refId: courseId });

      const rzp = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amountInPaise,
        currency: order.currency || "INR",
        name: "PS Classes",
        description: order.courseTitle ? `Course: ${order.courseTitle}` : "Course Access",
        order_id: order.orderId,
        prefill: {
          email: localStorage.getItem("userEmail") || "",
          contact: localStorage.getItem("userPhone") || "",
        },
        theme: { color: "#00c885" },
        handler: onSuccess,
        modal: { ondismiss: () => setUnlocking(false) },
      });
      rzp.open();
    } catch (err) {
      setUnlocking(false);
      toast.error(err?.message || "Failed to start payment");
    }
  };

  const allChapters = course?.subjects?.flatMap((s) => s.chapters || []) || [];
  const selectedChapter = allChapters.find((ch) => ch._id === selectedChapterId);
  const selectedSubject = course?.subjects?.find((s) =>
    (s.chapters || []).some((ch) => ch._id === selectedChapterId)
  );
  const isCompleted = progress.completedChapterIds.includes(selectedChapterId);

  const handleToggleComplete = async () => {
    if (markingComplete || !selectedChapterId) return;
    setMarkingComplete(true);
    try {
      const prog = isCompleted
        ? await unmarkChapterComplete(selectedChapterId)
        : await markChapterComplete(selectedChapterId);
      setProgress(prog);
      toast.success(isCompleted ? "Marked as incomplete" : "Chapter completed!");
    } catch (err) {
      toast.error(err?.message || "Failed to update progress");
    } finally {
      setMarkingComplete(false);
    }
  };

  const selectChapter = (chapterId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("chapter", chapterId);
      return next;
    });
    setSidebarOpen(false); // close mobile drawer on selection
  };

  // Auto-expand the subject containing the selected chapter (deep link, or
  // stepping across a subject boundary via Prev/Next).
  useEffect(() => {
    if (!selectedChapterId || !course) return;
    const subj = course.subjects?.find((s) => (s.chapters || []).some((ch) => ch._id === selectedChapterId));
    if (subj) setOpenSubjectId(subj._id);
  }, [selectedChapterId, course]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-primary" />
      </div>
    );
  }
  if (!course) return null;

  if (activeResultId) {
    return <TestResult attemptId={activeResultId} onBack={() => setActiveResultId(null)} />;
  }

  // Subscription lapsed (or admin-revoked) on a previously-purchased course →
  // show the dedicated renew screen instead of the generic locked preview.
  if (!hasAccess && course.isPaid && (accessReason === "expired" || accessReason === "disabled")) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <button
            onClick={() => navigate("/student/courses")}
            className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
          >
            <ArrowLeft size={15} /> Back to courses
          </button>
        </div>
        <AccessExpired
          disabled={accessReason === "disabled"}
          expiresAt={accessExpiresAt}
          busy={unlocking}
          onRenew={handleUnlockCourse}
          onBuy={handleUnlockCourse}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Course Banner ── */}
      <div className="relative overflow-hidden border-b border-white/5 bg-dark-300/50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand-primary/15 blur-3xl" />
          <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-brand-primary/8 blur-3xl" />
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-4 py-4 md:px-8 md:py-5">
          <div className="flex items-center gap-4">
            {/* Back */}
            <button
              onClick={() => navigate("/student/courses")}
              className="shrink-0 flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Courses</span>
            </button>
            <div className="w-px h-6 bg-white/10 shrink-0" />

            {/* Course info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <BookOpen size={14} className="text-brand-primary shrink-0" />
                <h1 className="text-base font-bold text-white truncate">{course.title}</h1>
                {!hasAccess && course.isPaid && (
                  <span className="shrink-0 flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                    <Lock size={9} /> Preview Only
                  </span>
                )}
                {hasAccess && progress.percentage === 100 && (
                  <span className="shrink-0 flex items-center gap-1 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-primary">
                    <Trophy size={9} /> Completed!
                  </span>
                )}
              </div>
              {/* Progress row */}
              {hasAccess && (
                <div className="mt-2 flex items-center gap-3 max-w-sm">
                  <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-primary transition-all duration-700" style={{ width: `${progress.percentage}%` }} />
                  </div>
                  <span className="text-[11px] text-white/50 shrink-0">
                    {progress.completedCount}/{progress.totalChapters} chapters · <span className="text-brand-primary font-bold">{progress.percentage}%</span>
                  </span>
                </div>
              )}
            </div>

            {/* Stats chips */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/50">
                <Layers size={11} /> {course.subjects?.length || 0} subjects
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/50">
                <BookOpen size={11} /> {allChapters.length} chapters
              </span>
            </div>

            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden shrink-0 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:text-white transition"
            >
              <Menu size={15} /> Chapters
            </button>
          </div>
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="flex flex-1 min-h-0 mx-auto w-full max-w-7xl px-4 md:px-8 py-6 gap-6">

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Chapter Tree Sidebar ── */}
        <aside className={`
          lg:relative lg:w-72 lg:shrink-0 lg:translate-x-0 lg:z-auto
          fixed inset-y-0 left-0 z-50 w-80 bg-dark-300
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <div className="lg:sticky lg:top-6 h-full lg:h-auto">
            <div
              className="rounded-2xl border border-white/8 bg-white/2 flex flex-col overflow-hidden h-full lg:h-auto"
              style={{ maxHeight: "calc(100vh - 8rem)" }}
            >
              {/* Sidebar header */}
              <div className="shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen size={13} className="text-brand-primary shrink-0" />
                  <h2 className="text-xs font-bold text-white truncate">{course.title}</h2>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Progress mini */}
              {hasAccess && (
                <div className="shrink-0 px-4 py-2.5 border-b border-white/5">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-white/40">{progress.completedCount} / {progress.totalChapters} chapters</span>
                    <span className="font-bold text-brand-primary">{progress.percentage}%</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                  </div>
                  {progress.percentage === 100 && (
                    <div className="flex items-center gap-1.5 mt-2 rounded-lg bg-brand-primary/10 px-2.5 py-1.5">
                      <Trophy size={11} className="text-brand-primary" />
                      <span className="text-[11px] font-bold text-brand-primary">Course Complete!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Sidebar unlock CTA for locked paid courses */}
              {!hasAccess && course?.isPaid && (
                <div className="shrink-0 px-3 py-3 border-b border-white/5">
                  <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/8 p-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Lock size={12} className="text-brand-primary shrink-0" />
                      <p className="text-[11px] font-bold text-brand-primary">Preview Mode</p>
                    </div>
                    <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white/50">
                      <Clock size={10} /> {formatValidity(course.validityMonths)}
                    </p>
                    <button
                      onClick={handleUnlockCourse}
                      disabled={unlocking}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-brand-primary px-3 py-2 text-[11px] font-bold text-dark-400 hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {unlocking ? <Loader2 size={11} className="animate-spin" /> : <CreditCard size={11} />}
                      {unlocking
                        ? "Processing…"
                        : `Buy Now · ₹${Number(
                            course.discountedPrice > 0 && course.discountedPrice < course.price
                              ? course.discountedPrice
                              : course.price
                          ).toLocaleString()}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Subject + chapter tree */}
              <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-3 space-y-0.5 min-h-0">
                {(course.subjects || []).length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-8">No subjects added yet</p>
                ) : (
                  (course.subjects || []).map((sub) => {
                    const isOpen = openSubjectId === sub._id;
                    const chapters = sub.chapters || [];
                    const doneInSubject = chapters.filter(ch => progress.completedChapterIds.includes(ch._id)).length;

                    return (
                      <div key={sub._id}>
                        <button
                          onClick={() => setOpenSubjectId(isOpen ? null : sub._id)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <ChevronDown size={12} className={`transition-transform text-white/30 shrink-0 ${isOpen ? "rotate-0" : "-rotate-90"}`} />
                          <span className="flex-1 truncate">{sub.title}</span>
                          <span className="text-[10px] text-white/25 shrink-0">{doneInSubject}/{chapters.length}</span>
                        </button>

                        {isOpen && (
                          <div className="ml-4 mb-1 space-y-0.5 border-l border-white/5 pl-3">
                            {chapters.length === 0 ? (
                              <p className="text-[11px] text-white/25 px-2 py-1.5">No chapters yet</p>
                            ) : (
                              chapters.map((ch) => {
                                const locked = ch.locked;
                                const done = progress.completedChapterIds.includes(ch._id);
                                const isSelected = selectedChapterId === ch._id;
                                const notesCount = ch.notes?.length || 0;
                                const videosCount = ch.videos?.length || 0;
                                const testsCount = ch.linkedTests?.length || 0;

                                return (
                                  <button
                                    key={ch._id}
                                    onClick={() => !locked && selectChapter(ch._id)}
                                    disabled={locked}
                                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-all ${locked ? "cursor-not-allowed opacity-35" : ""} ${isSelected ? "bg-brand-primary/15 text-brand-primary" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
                                  >
                                    <span className="shrink-0">
                                      {locked ? (
                                        <Lock size={9} className="text-white/25" />
                                      ) : done ? (
                                        <CheckCircle2 size={9} className="text-brand-primary" />
                                      ) : (
                                        <Circle size={9} className="text-white/20" />
                                      )}
                                    </span>
                                    <span className="flex-1 truncate leading-snug">{ch.title}</span>
                                    {!locked && (notesCount + videosCount + testsCount > 0) && (
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        {notesCount > 0 && <span className="text-[9px] text-white/25">{notesCount}📄</span>}
                                        {videosCount > 0 && <span className="text-[9px] text-white/25">{videosCount}▶</span>}
                                      </div>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 space-y-5">
          {!selectedChapter ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/1">
              <BookMarked size={36} className="text-white/10" />
              <p className="text-sm text-white/40">Select a chapter from the sidebar</p>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:text-white transition"
              >
                <Menu size={14} /> Open Chapter List
              </button>
            </div>
          ) : (
            <>
              {/* Breadcrumb + chapter title */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {selectedSubject && (
                    <p className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
                      <Layers size={10} />
                      {selectedSubject.title}
                    </p>
                  )}
                  <h1 className="text-xl font-extrabold text-white leading-tight">{selectedChapter.title}</h1>
                </div>

                {hasAccess && (
                  <button
                    onClick={handleToggleComplete}
                    disabled={markingComplete}
                    className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                      isCompleted
                        ? "bg-brand-primary/15 text-brand-primary border border-brand-primary/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                        : "border border-white/15 text-white/60 hover:border-brand-primary/40 hover:text-brand-primary"
                    }`}
                  >
                    {markingComplete ? <Loader2 size={14} className="animate-spin" /> : isCompleted ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    {isCompleted ? "Completed" : "Mark Complete"}
                  </button>
                )}
              </div>

              {/* Chapter description */}
              {selectedChapter.description && (
                <div className="text-sm text-white/55 leading-relaxed quill-content rounded-2xl border border-white/5 bg-white/2 px-5 py-4"
                  dangerouslySetInnerHTML={{ __html: selectedChapter.description }} />
              )}

              {/* Locked course — show payment CTA */}
              {!hasAccess && course?.isPaid ? (
                <CourseUnlockBanner
                  course={course}
                  unlocking={unlocking}
                  onUnlock={handleUnlockCourse}
                />
              ) : selectedChapter.locked ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                  <Lock size={32} className="text-amber-400/60" />
                  <p className="font-semibold text-white/80">This chapter is locked</p>
                  <p className="text-sm text-white/40">Purchase the course to access all content</p>
                </div>
              ) : (
                <ContentArea
                  chapter={selectedChapter}
                  courseId={courseId}
                  attemptsByTest={attemptsByTest}
                  onViewAnalysis={setActiveResultId}
                />
              )}

              {/* Prev / Next navigation */}
              {(() => {
                const idx = allChapters.findIndex((c) => c._id === selectedChapterId);
                const prev = allChapters[idx - 1];
                const next = allChapters[idx + 1];
                return (
                  <div className="flex items-center justify-between border-t border-white/5 pt-5 mt-2">
                    <div>
                      {prev && !prev.locked && (
                        <button onClick={() => selectChapter(prev._id)} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                          <ArrowLeft size={14} />
                          <span className="truncate max-w-44">{prev.title}</span>
                        </button>
                      )}
                    </div>
                    <div>
                      {next && !next.locked ? (
                        <button onClick={() => selectChapter(next._id)} className="flex items-center gap-2 text-sm text-brand-primary hover:opacity-80 transition-opacity font-medium">
                          <span className="truncate max-w-44">{next.title}</span>
                          <ChevronRight size={14} />
                        </button>
                      ) : !isCompleted && hasAccess ? (
                        <button onClick={handleToggleComplete} disabled={markingComplete} className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-dark-400 hover:opacity-90 transition-opacity">
                          <CheckCircle2 size={14} /> Complete Chapter
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
