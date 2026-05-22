import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen, ChevronRight, ChevronDown, Loader2, Lock, FileText,
  Video, Link2, Download, ArrowLeft, Play, BookMarked,
  CheckCircle2, Circle, Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getCourseFull, getNoteById,
  markChapterComplete, unmarkChapterComplete, getCourseProgress,
} from "../../services/courseService";

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ percentage, label, className = "" }) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        {label && <span className="text-xs text-white/50">{label}</span>}
        <span className="text-xs font-bold text-brand-primary ml-auto">{percentage}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ─── YouTube Embed ────────────────────────────────────────────────────────────

function YouTubePlayer({ youtubeId }) {
  if (!youtubeId) return null;
  return (
    <div className="w-full overflow-hidden rounded-2xl aspect-video bg-black">
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

// ─── Rich Text Viewer ─────────────────────────────────────────────────────────

function RichTextNote({ noteId }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getNoteById(noteId)
      .then((n) => { if (active) setNote(n); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [noteId]);

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 size={22} className="animate-spin text-brand-primary" /></div>;
  if (!note) return <p className="text-sm text-white/40 py-6 text-center">Note not found</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-white">{note.title}</h2>
        {note.type === "pdf" && note.fileUrl && note.allowDownload && (
          <a
            href={note.fileUrl}
            download={note.fileName || "note.pdf"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Download size={13} /> Download PDF
          </a>
        )}
      </div>

      {note.type === "rich_text" && note.content ? (
        <div
          className="quill-content rounded-2xl border border-white/5 bg-white/2 p-6"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      ) : note.type === "pdf" && note.fileUrl ? (
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden" style={{ height: "80vh" }}>
          <iframe
            src={`${note.fileUrl}#toolbar=1`}
            title={note.title}
            className="h-full w-full"
            frameBorder="0"
          />
        </div>
      ) : (
        <p className="text-sm text-white/40 py-6 text-center">No content available</p>
      )}
    </div>
  );
}

// ─── Content Area ─────────────────────────────────────────────────────────────

function ContentArea({ chapter, initialTab }) {
  const [tab, setTab] = useState(initialTab || "notes");
  const [activeNote, setActiveNote] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    if (tab === "notes" && chapter.notes?.length > 0) {
      setActiveNote(chapter.notes[0]);
    }
    if (tab === "videos" && chapter.videos?.length > 0) {
      setActiveVideo(chapter.videos[0]);
    }
  }, [tab, chapter._id]);

  const autoTab = chapter.notes?.length > 0 ? "notes"
    : chapter.videos?.length > 0 ? "videos" : "tests";

  const tabs = [
    { id: "notes", label: "Notes", count: chapter.notes?.length || 0, icon: FileText },
    { id: "videos", label: "Videos", count: chapter.videos?.length || 0, icon: Video },
    { id: "tests", label: "Tests", count: chapter.linkedTests?.length || 0, icon: Link2 },
  ].filter((t) => t.count > 0);

  if (tabs.length === 0) return <p className="text-sm text-white/40 py-8 text-center">No content in this chapter yet.</p>;

  return (
    <div className="space-y-4">
      {tabs.length > 1 && (
        <div className="flex gap-1 border-b border-white/5 pb-3">
          {tabs.map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${tab === id ? "bg-brand-primary/15 text-brand-primary" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={13} />
              {label}
              <span className={`rounded-full px-1.5 text-[10px] font-bold ${tab === id ? "bg-brand-primary/20 text-brand-primary" : "bg-white/5 text-white/40"}`}>{count}</span>
            </button>
          ))}
        </div>
      )}

      {tab === "notes" && (
        <div className="flex gap-4 min-h-64">
          {chapter.notes?.length > 1 && (
            <div className="w-52 shrink-0 space-y-1">
              {chapter.notes.map((note) => (
                <button
                  key={note._id}
                  onClick={() => setActiveNote(note)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-all ${activeNote?._id === note._id ? "bg-brand-primary/15 text-brand-primary" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                >
                  <FileText size={13} className={note.type === "pdf" ? "text-red-400" : "text-brand-primary"} />
                  <span className="flex-1 truncate">{note.title}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {activeNote
              ? <RichTextNote noteId={activeNote._id} />
              : chapter.notes?.length === 1
                ? <RichTextNote noteId={chapter.notes[0]._id} />
                : null}
          </div>
        </div>
      )}

      {tab === "videos" && (
        <div className="space-y-4">
          {chapter.videos?.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {chapter.videos.map((vid) => (
                <button
                  key={vid._id}
                  onClick={() => setActiveVideo(vid)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all ${activeVideo?._id === vid._id ? "bg-brand-primary/15 text-brand-primary" : "border border-white/8 text-white/60 hover:bg-white/5 hover:text-white"}`}
                >
                  <Play size={12} /> {vid.title}
                </button>
              ))}
            </div>
          )}
          {(activeVideo || chapter.videos?.[0]) && (() => {
            const vid = activeVideo || chapter.videos[0];
            const ytId = vid.youtubeId || vid.youtubeUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/)?.[1];
            return (
              <div className="space-y-3">
                <YouTubePlayer youtubeId={ytId} />
                <h3 className="font-semibold text-white">{vid.title}</h3>
                {vid.description && <p className="text-sm text-white/60">{vid.description}</p>}
              </div>
            );
          })()}
        </div>
      )}

      {tab === "tests" && (
        <div className="space-y-2">
          {(chapter.linkedTests || []).map((lt) => (
            <LinkedTestCard key={String(lt.testId?._id || lt.testId)} test={lt.test || {}} testId={lt.testId?._id || lt.testId} />
          ))}
        </div>
      )}
    </div>
  );
}

function LinkedTestCard({ test, testId }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/student/tests?startTest=${testId}`)}
      className="group flex w-full items-center gap-4 rounded-2xl border border-white/8 bg-white/2 p-4 text-left transition-all hover:border-brand-primary/30 hover:bg-white/4"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${test.type === "pyq" ? "bg-purple-500/15 text-purple-400" : "bg-brand-primary/15 text-brand-primary"}`}>
        <BookOpen size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{test.title || "Untitled Test"}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`text-[11px] font-semibold uppercase ${test.type === "pyq" ? "text-purple-400" : "text-brand-primary"}`}>{test.type || "practice"}</span>
          {test.duration && <span className="text-[11px] text-white/40">{test.duration} min</span>}
          {test.totalMarks && <span className="text-[11px] text-white/40">{test.totalMarks} marks</span>}
        </div>
      </div>
      <ChevronRight size={16} className="text-white/30 group-hover:text-brand-primary transition-colors" />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ completedChapterIds: [], totalChapters: 0, completedCount: 0, percentage: 0 });
  const [markingComplete, setMarkingComplete] = useState(false);

  // Navigation state
  const [openSubjectId, setOpenSubjectId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCourseFull(courseId);
      setCourse(res.course);
      setHasAccess(res.hasAccess);

      const firstSubject = res.course?.subjects?.[0];
      if (firstSubject) {
        setOpenSubjectId(firstSubject._id);
        const firstChapter = firstSubject.chapters?.[0];
        if (firstChapter) setSelectedChapterId(firstChapter._id);
      }

      // Load progress
      const prog = await getCourseProgress(courseId);
      setProgress(prog);
    } catch {
      navigate("/student/courses");
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => { load(); }, [load]);

  const selectedChapter = course?.subjects
    ?.flatMap((s) => s.chapters || [])
    .find((ch) => ch._id === selectedChapterId);

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-primary" />
      </div>
    );
  }
  if (!course) return null;

  const allChapters = course.subjects?.flatMap((s) => s.chapters || []) || [];

  return (
    <div className="flex gap-6">
      {/* ── Sidebar: Chapter Tree ── */}
      <aside className="w-64 shrink-0">
        <div className="sticky top-6 space-y-3">
          <button
            onClick={() => navigate("/student/courses")}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> All Courses
          </button>

          <div className="rounded-2xl border border-white/8 bg-white/2 p-4 space-y-2">
            {/* Course title + progress */}
            <div className="pb-3 mb-1 border-b border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} className="text-brand-primary shrink-0" />
                <h2 className="text-sm font-bold text-white line-clamp-2">{course.title}</h2>
              </div>
              <ProgressBar percentage={progress.percentage} />
              <p className="mt-1 text-[11px] text-white/40">
                {progress.completedCount} / {progress.totalChapters} chapters done
              </p>
              {progress.percentage === 100 && (
                <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-brand-primary/10 px-3 py-1.5">
                  <Trophy size={12} className="text-brand-primary" />
                  <span className="text-xs font-bold text-brand-primary">Course Complete!</span>
                </div>
              )}
            </div>

            {/* Access badge */}
            {!hasAccess && course.isPaid && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2">
                <Lock size={12} className="text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-400">Preview only</p>
              </div>
            )}

            {/* Subjects → Chapters */}
            {(course.subjects || []).map((sub) => (
              <div key={sub._id}>
                <button
                  onClick={() => setOpenSubjectId(openSubjectId === sub._id ? null : sub._id)}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <ChevronDown size={13} className={`transition-transform text-white/30 shrink-0 ${openSubjectId === sub._id ? "" : "-rotate-90"}`} />
                  <span className="flex-1 truncate font-medium">{sub.title}</span>
                  <span className="text-[10px] text-white/30">{sub.chapters?.length || 0}</span>
                </button>

                {openSubjectId === sub._id && (
                  <div className="ml-5 space-y-0.5 border-l border-white/5 pl-2">
                    {(sub.chapters || []).map((ch) => {
                      const locked = ch.locked;
                      const done = progress.completedChapterIds.includes(ch._id);
                      return (
                        <button
                          key={ch._id}
                          onClick={() => !locked && setSelectedChapterId(ch._id)}
                          disabled={locked}
                          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-all ${locked ? "cursor-not-allowed opacity-40" : ""} ${selectedChapterId === ch._id ? "bg-brand-primary/15 text-brand-primary" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                        >
                          {locked ? (
                            <Lock size={10} className="shrink-0 text-white/30" />
                          ) : done ? (
                            <CheckCircle2 size={10} className="shrink-0 text-brand-primary" />
                          ) : (
                            <Circle size={10} className="shrink-0 text-white/20" />
                          )}
                          <span className="flex-1 truncate">{ch.title}</span>
                          {!locked && (
                            <div className="flex gap-1 ml-auto">
                              {(ch.notes?.length || 0) > 0 && <span className="text-[9px] text-white/30">{ch.notes.length}📄</span>}
                              {(ch.videos?.length || 0) > 0 && <span className="text-[9px] text-white/30">{ch.videos.length}▶</span>}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0 space-y-4">
        {!selectedChapter ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/1">
            <BookMarked size={32} className="text-white/15" />
            <p className="text-sm text-white/40">Select a chapter from the sidebar</p>
          </div>
        ) : selectedChapter.locked ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5">
            <Lock size={32} className="text-amber-400/50" />
            <p className="font-semibold text-white/80">This content is locked</p>
            <p className="text-sm text-white/40">Purchase the course to access all chapters</p>
          </div>
        ) : (
          <>
            {/* Chapter header + complete button */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-amber-400 shrink-0" />
                <h1 className="text-xl font-extrabold text-white truncate">{selectedChapter.title}</h1>
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
                  {markingComplete ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Circle size={14} />
                  )}
                  {isCompleted ? "Completed" : "Mark Complete"}
                </button>
              )}
            </div>

            {selectedChapter.description && (
              <div className="text-sm text-white/60 quill-content" dangerouslySetInnerHTML={{ __html: selectedChapter.description }} />
            )}

            <ContentArea chapter={selectedChapter} />

            {/* Chapter navigation */}
            {(() => {
              const idx = allChapters.findIndex((c) => c._id === selectedChapterId);
              const prev = allChapters[idx - 1];
              const next = allChapters[idx + 1];
              return (
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                  <div>
                    {prev && !prev.locked && (
                      <button onClick={() => setSelectedChapterId(prev._id)} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                        <ArrowLeft size={14} />
                        <span className="truncate max-w-40">{prev.title}</span>
                      </button>
                    )}
                  </div>
                  <div>
                    {next && !next.locked ? (
                      <button onClick={() => setSelectedChapterId(next._id)} className="flex items-center gap-2 text-sm text-brand-primary hover:opacity-80 transition-opacity">
                        <span className="truncate max-w-40">{next.title}</span>
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
  );
}
