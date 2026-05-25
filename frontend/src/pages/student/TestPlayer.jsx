import { useState, useEffect, useCallback, useRef } from "react";
import { submitAnswer, submitTest } from "../../services/studentService";
import {
  Clock, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, X,
  Flag, RotateCcw, PanelRight, Send, Keyboard, CheckCheck,
} from "lucide-react";

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS = {
  NOT_VISITED: "not-visited",
  VISITED: "visited",
  ANSWERED: "answered",
  MARKED: "marked",
  ANSWERED_MARKED: "answered-marked",
};

const STATUS_STYLE = {
  [STATUS.NOT_VISITED]: "bg-dark-200 border-dark-100 text-white/40",
  [STATUS.VISITED]: "bg-red-500/20 border-red-500/40 text-red-300",
  [STATUS.ANSWERED]: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  [STATUS.MARKED]: "bg-purple-500/20 border-purple-500/40 text-purple-300",
  [STATUS.ANSWERED_MARKED]: "bg-purple-500/30 border-purple-400/60 text-purple-200",
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function TestPlayer({ attemptData, onFinish, onExit }) {
  const { attempt, questions, duration, isProctored } = attemptData || {};

  if (!attempt?._id || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-400 px-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <AlertTriangle size={40} className="text-amber-400" />
          <p className="text-base font-semibold text-white">This test has no available questions yet.</p>
          <button
            onClick={onExit}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft size={15} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(attempt.answers || []);
  const [timeLeft, setTimeLeft] = useState((duration || 120) * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proctorMessage, setProctorMessage] = useState("");
  const [isPausedForFullscreen, setIsPausedForFullscreen] = useState(false);

  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [visited, setVisited] = useState(new Set([0]));
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const tabSwitchCountRef = useRef(0);
  const autoSubmittingRef = useRef(false);
  const lastViolationAtRef = useRef(0);
  const handleFinalSubmitRef = useRef(() => {});

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion._id);
  const isMarked = markedForReview.has(currentQuestion._id);

  // ─── Stats ───────────────────────────────────────────────────────────────────

  const answeredCount = answers.length;
  const markedCount = markedForReview.size;
  const notVisitedCount = questions.length - visited.size;
  const visitedUnansweredCount = [...visited].filter((idx) => {
    const q = questions[idx];
    return !answers.find((a) => a.questionId === q._id);
  }).length;

  const getQuestionStatus = (idx) => {
    const q = questions[idx];
    const isAnswered = answers.some((a) => a.questionId === q._id);
    const isMark = markedForReview.has(q._id);
    const isVisited = visited.has(idx);
    if (isMark && isAnswered) return STATUS.ANSWERED_MARKED;
    if (isMark) return STATUS.MARKED;
    if (isAnswered) return STATUS.ANSWERED;
    if (isVisited) return STATUS.VISITED;
    return STATUS.NOT_VISITED;
  };

  // ─── Navigation ──────────────────────────────────────────────────────────────

  const goToQuestion = useCallback(
    (idx) => {
      if (idx < 0 || idx >= questions.length || isPausedForFullscreen) return;
      setCurrentIndex(idx);
      setVisited((prev) => new Set([...prev, idx]));
    },
    [questions.length, isPausedForFullscreen]
  );

  // ─── Submit ───────────────────────────────────────────────────────────────────

  const handleFinalSubmit = useCallback(
    async ({ force = false, reason = "" } = {}) => {
      if (autoSubmittingRef.current) return;
      autoSubmittingRef.current = true;
      if (reason) setProctorMessage(reason);
      setIsSubmitting(true);
      try {
        await submitTest(attempt._id, { answers, autoSubmitted: Boolean(force) });
        onFinish(attempt._id);
      } catch {
        alert("Error submitting test. Please check connection.");
        setIsSubmitting(false);
        autoSubmittingRef.current = false;
      }
    },
    [attempt._id, answers, onFinish]
  );

  useEffect(() => {
    handleFinalSubmitRef.current = handleFinalSubmit;
  }, [handleFinalSubmit]);

  // ─── Timer ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isPausedForFullscreen) return;
    if (timeLeft <= 0) {
      setTimeout(() => {
        handleFinalSubmitRef.current({ force: true, reason: "Time is over. Auto-submitting your test." });
      }, 0);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isPausedForFullscreen]);

  // ─── Proctoring ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isProctored) return () => {};

    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        setProctorMessage("Please enable fullscreen mode for proctored test.");
      }
    };
    enterFullscreen();

    const blockClipboard = (e) => { e.preventDefault(); setProctorMessage("Copy, cut, and paste are disabled during the test."); };
    const blockContextMenu = (e) => { e.preventDefault(); setProctorMessage("Right-click is disabled during the test."); };
    const blockShortcutKeys = (e) => {
      const lowerKey = e.key?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "a"].includes(lowerKey)) {
        e.preventDefault();
        setProctorMessage("Clipboard shortcuts are disabled during the test.");
      }
    };

    const handleVisibilityViolation = () => {
      const now = Date.now();
      if (now - lastViolationAtRef.current < 800) return;
      lastViolationAtRef.current = now;
      tabSwitchCountRef.current += 1;
      const remaining = 2 - tabSwitchCountRef.current;
      if (tabSwitchCountRef.current >= 2) {
        setTimeout(() => handleFinalSubmitRef.current({ force: true, reason: "Two tab switches detected. Auto-submitting your test." }), 0);
        return;
      }
      setProctorMessage(`Tab switch detected. ${remaining} attempt left before auto-submit.`);
    };

    const handleVisibilityChange = () => { if (document.visibilityState === "hidden") handleVisibilityViolation(); };
    const handleWindowBlur = () => { if (document.visibilityState === "visible") handleVisibilityViolation(); };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsPausedForFullscreen(true);
        setProctorMessage("Fullscreen exited. Please return to fullscreen immediately.");
      } else {
        setIsPausedForFullscreen(false);
        setProctorMessage("");
      }
    };

    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    document.addEventListener("paste", blockClipboard);
    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockShortcutKeys);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockShortcutKeys);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    };
  }, [isProctored]);

  // ─── Actions ──────────────────────────────────────────────────────────────────

  const handleOptionSelect = useCallback(async (optionIndex) => {
    if (isPausedForFullscreen) return;
    const newAnswer = { questionId: currentQuestion._id, selectedOptionIndex: optionIndex, timeTaken: 0 };
    setAnswers((prev) => {
      const exists = prev.find((a) => a.questionId === currentQuestion._id);
      if (exists) return prev.map((a) => (a.questionId === currentQuestion._id ? newAnswer : a));
      return [...prev, newAnswer];
    });
    try { await submitAnswer(attempt._id, newAnswer); }
    catch (err) { console.error("Failed to sync answer:", err); }
  }, [isPausedForFullscreen, currentQuestion._id, attempt._id]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e) => {
      if (isPausedForFullscreen || showSubmitConfirm) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") goToQuestion(currentIndex + 1);
      else if (e.key === "ArrowLeft") goToQuestion(currentIndex - 1);
      else if (!e.ctrlKey && !e.metaKey && ["1", "2", "3", "4"].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (idx < currentQuestion.options.length) handleOptionSelect(idx);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPausedForFullscreen, showSubmitConfirm, currentIndex, currentQuestion, goToQuestion, handleOptionSelect]);

  const handleClearResponse = () => {
    if (isPausedForFullscreen) return;
    setAnswers((prev) => prev.filter((a) => a.questionId !== currentQuestion._id));
  };

  const toggleMarkForReview = () => {
    if (isPausedForFullscreen) return;
    const qId = currentQuestion._id;
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleResumeFullscreen = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsPausedForFullscreen(false);
      setProctorMessage("");
    } catch {
      setProctorMessage("Fullscreen is required. Please allow fullscreen to continue the test.");
    }
  };

  // ─── Timer helpers ────────────────────────────────────────────────────────────

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const timerColor =
    timeLeft < 300 ? "text-red-400 bg-red-500/10 border-red-500/30"
    : timeLeft < 900 ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
    : "text-brand-primary bg-brand-primary/10 border-brand-primary/30";

  const timerPulse = timeLeft < 60;

  // ─── Submitting screen ────────────────────────────────────────────────────────

  if (isSubmitting) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-dark-400 text-white">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        <h2 className="text-xl font-bold">Submitting your test…</h2>
        <p className="mt-2 text-gray-400">Please do not close this window.</p>
      </div>
    );
  }

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);

  return (
    <div className="relative flex h-screen flex-col bg-dark-400 overflow-hidden">

      {/* ── HEADER ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-dark-100 bg-dark-300 px-4 py-3 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onExit}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-dark-200 hover:text-white shrink-0"
          >
            <X size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">Test in Progress</h1>
            <p className="text-[11px] text-gray-400">
              Q {currentIndex + 1}/{questions.length} &nbsp;·&nbsp;
              <span className="text-emerald-400">{answeredCount} answered</span>
              {markedCount > 0 && (
                <span className="text-purple-400"> &nbsp;·&nbsp; {markedCount} marked</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Keyboard hint */}
          <button
            onClick={() => setShowShortcuts((v) => !v)}
            title="Keyboard shortcuts"
            className="hidden sm:flex items-center gap-1.5 rounded-lg p-2 text-gray-500 hover:text-gray-300 hover:bg-dark-200 transition-colors"
          >
            <Keyboard size={15} />
          </button>

          {/* Toggle sidebar */}
          <button
            onClick={() => setShowSidebar((v) => !v)}
            title="Toggle question panel"
            className="flex items-center gap-1.5 rounded-lg p-2 text-gray-500 hover:text-gray-300 hover:bg-dark-200 transition-colors"
          >
            <PanelRight size={15} />
          </button>

          {/* Timer */}
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-base font-bold transition-all ${timerColor} ${timerPulse ? "animate-pulse" : ""}`}
          >
            <Clock size={15} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* ── PROCTOR BANNER ── */}
      {proctorMessage && (
        <div className="shrink-0 mx-4 mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-300 flex items-start gap-2 z-10">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {proctorMessage}
        </div>
      )}

      {/* ── KEYBOARD SHORTCUTS TOOLTIP ── */}
      {showShortcuts && (
        <div className="absolute top-16 right-4 z-50 rounded-xl border border-dark-100 bg-dark-300 p-4 shadow-2xl text-xs text-gray-300 space-y-2 w-52">
          <p className="font-bold text-white text-sm mb-3">Keyboard Shortcuts</p>
          <ShortcutRow keys={["←", "→"]} label="Navigate questions" />
          <ShortcutRow keys={["1","2","3","4"]} label="Select option" />
          <button onClick={() => setShowShortcuts(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── QUESTION AREA ── */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          <div className="mx-auto max-w-3xl space-y-4">

            {/* Question card */}
            <div className="rounded-2xl border border-dark-100 bg-dark-300 p-5 md:p-7">
              {/* Q header */}
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-dark-100 pb-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Question {currentIndex + 1}
                  </p>
                  <h2 className="text-base font-medium leading-relaxed text-white">
                    {currentQuestion.questionText}
                  </h2>
                </div>
                <div className="shrink-0 text-right">
                  <span className="rounded-md bg-dark-100 px-2.5 py-1 text-xs font-bold text-gray-400">
                    {currentQuestion.marks} {currentQuestion.marks === 1 ? "Mark" : "Marks"}
                  </span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = currentAnswer?.selectedOptionIndex === idx;
                  const optLabel = ["A", "B", "C", "D"][idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={isPausedForFullscreen}
                      className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-150 ${
                        isSelected
                          ? "border-brand-primary bg-brand-primary/10 shadow-[0_0_0_1px_rgba(0,200,133,0.3)]"
                          : "border-dark-100 bg-dark-200 hover:border-gray-600 hover:bg-dark-100"
                      } ${isPausedForFullscreen ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {/* Option label circle */}
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                          isSelected
                            ? "border-brand-primary bg-brand-primary text-dark-400"
                            : "border-gray-600 text-gray-500 group-hover:border-gray-400 group-hover:text-gray-300"
                        }`}
                      >
                        {isSelected ? <CheckCircle2 size={14} /> : optLabel}
                      </div>
                      <span className={`text-sm leading-relaxed ${isSelected ? "font-semibold text-white" : "text-gray-300"}`}>
                        {opt.text}
                      </span>
                      {/* Keyboard hint */}
                      <span className="ml-auto shrink-0 hidden sm:block rounded border border-dark-100 px-1.5 py-0.5 text-[10px] text-gray-600 font-mono">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── FOOTER ACTIONS ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dark-100 bg-dark-300 p-3 md:p-4">
              {/* Left actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleClearResponse}
                  disabled={isPausedForFullscreen || !currentAnswer}
                  className="flex items-center gap-1.5 rounded-lg border border-dark-100 bg-dark-200 px-3 py-2 text-xs font-semibold text-gray-400 transition hover:border-gray-600 hover:text-white disabled:opacity-30"
                >
                  <RotateCcw size={13} /> Clear
                </button>
                <button
                  onClick={toggleMarkForReview}
                  disabled={isPausedForFullscreen}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-30 ${
                    isMarked
                      ? "border-purple-500/50 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                      : "border-dark-100 bg-dark-200 text-gray-400 hover:border-purple-500/40 hover:text-purple-300"
                  }`}
                >
                  <Flag size={13} /> {isMarked ? "Unmark" : "Mark for Review"}
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button
                  disabled={isPausedForFullscreen || currentIndex === 0}
                  onClick={() => goToQuestion(currentIndex - 1)}
                  className="flex items-center gap-1.5 rounded-xl bg-dark-100 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-dark-200 disabled:opacity-30"
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {currentIndex === questions.length - 1 ? (
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    disabled={isPausedForFullscreen}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-dark-400 transition hover:brightness-110 disabled:opacity-30"
                  >
                    Submit <Send size={14} />
                  </button>
                ) : (
                  <button
                    disabled={isPausedForFullscreen}
                    onClick={() => goToQuestion(currentIndex + 1)}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-dark-400 transition hover:brightness-110 disabled:opacity-30"
                  >
                    Save & Next <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>

          </div>
        </main>

        {/* ── QUESTION PALETTE SIDEBAR ── */}
        {showSidebar && (
          <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-dark-100 bg-dark-300 overflow-y-auto custom-scrollbar">

            {/* Palette header */}
            <div className="border-b border-dark-100 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Question Palette</p>
            </div>

            {/* Status legend */}
            <div className="border-b border-dark-100 px-4 py-3 space-y-1.5">
              <LegendItem color="bg-emerald-500/20 border-emerald-500/40" label={`Answered (${answeredCount})`} />
              <LegendItem color="bg-red-500/20 border-red-500/40" label={`Not Answered (${visitedUnansweredCount})`} />
              <LegendItem color="bg-purple-500/20 border-purple-500/40" label={`Marked for Review (${markedCount})`} />
              <LegendItem color="bg-dark-200 border-dark-100" label={`Not Visited (${notVisitedCount})`} />
            </div>

            {/* Question grid */}
            <div className="flex-1 px-4 py-3">
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((_, idx) => {
                  const status = getQuestionStatus(idx);
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => goToQuestion(idx)}
                      title={`Question ${idx + 1}`}
                      className={`relative flex h-9 w-full items-center justify-center rounded-lg border text-xs font-bold transition-all ${STATUS_STYLE[status]} ${
                        isCurrent ? "ring-2 ring-white/60 ring-offset-1 ring-offset-dark-300 scale-110 z-10" : "hover:scale-105"
                      }`}
                    >
                      {idx + 1}
                      {markedForReview.has(questions[idx]._id) && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-purple-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar submit */}
            <div className="border-t border-dark-100 p-4">
              <div className="mb-3 rounded-lg bg-dark-200 p-3 text-[11px] text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Total Questions</span>
                  <span className="font-bold text-white">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Answered</span>
                  <span className="font-bold text-emerald-400">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Marks</span>
                  <span className="font-bold text-white">{totalMarks}</span>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={isPausedForFullscreen}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-30"
              >
                <AlertTriangle size={15} /> Submit Test
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── MOBILE PALETTE BAR ── */}
      <div className="md:hidden shrink-0 border-t border-dark-100 bg-dark-300 px-3 py-2">
        <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
          {questions.map((_, idx) => {
            const status = getQuestionStatus(idx);
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={() => goToQuestion(idx)}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold transition-all ${STATUS_STYLE[status]} ${
                  isCurrent ? "ring-2 ring-white/60 ring-offset-1 ring-offset-dark-300" : ""
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FULLSCREEN PAUSED OVERLAY ── */}
      {isPausedForFullscreen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-400/95 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-dark-300 p-6 text-center shadow-2xl">
            <AlertTriangle size={32} className="mx-auto mb-3 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Test Paused</h2>
            <p className="mt-2 text-sm text-gray-300">
              Fullscreen is required for this proctored test. Please re-enter fullscreen to continue.
            </p>
            <button
              onClick={handleResumeFullscreen}
              className="mt-5 w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-dark-400 transition hover:brightness-110"
            >
              Resume in Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* ── SUBMIT CONFIRMATION MODAL ── */}
      {showSubmitConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-400/90 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-dark-100 bg-dark-300 p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Submit Test?</h2>
                <p className="text-xs text-gray-400 mt-0.5">You cannot change answers after submission.</p>
              </div>
              <button onClick={() => setShowSubmitConfirm(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatBox label="Total Questions" value={questions.length} color="text-white" />
              <StatBox label="Answered" value={answeredCount} color="text-emerald-400" />
              <StatBox label="Not Answered" value={questions.length - answeredCount} color="text-red-400" />
              <StatBox label="Marked for Review" value={markedCount} color="text-purple-400" />
            </div>

            {questions.length - answeredCount > 0 && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  You have <strong>{questions.length - answeredCount} unanswered</strong> question{questions.length - answeredCount !== 1 ? "s" : ""}.
                  Are you sure you want to submit?
                </span>
              </div>
            )}

            {answeredCount === questions.length && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300">
                <CheckCheck size={14} className="mt-0.5 shrink-0" />
                All questions answered. Good job!
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 rounded-xl border border-dark-100 bg-dark-200 py-3 text-sm font-bold text-white transition hover:bg-dark-100"
              >
                Continue Test
              </button>
              <button
                onClick={() => { setShowSubmitConfirm(false); handleFinalSubmit(); }}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-4 w-4 shrink-0 rounded border ${color}`} />
      <span className="text-[11px] text-gray-400">{label}</span>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="rounded-xl bg-dark-200 border border-dark-100 px-4 py-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function ShortcutRow({ keys, label }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <div className="flex gap-1">
        {keys.map((k) => (
          <kbd key={k} className="rounded border border-dark-100 bg-dark-200 px-1.5 py-0.5 font-mono text-[10px] text-white">
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
