import { useState, useEffect, useCallback, useRef } from "react";
import { submitAnswer, submitTest } from "../../services/studentService";
import { Clock, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, X } from "lucide-react";

export default function TestPlayer({ attemptData, onFinish, onExit }) {
  const { attempt, questions, duration, isProctored } = attemptData;
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(attempt.answers || []);
  const [timeLeft, setTimeLeft] = useState((duration || 120) * 60); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proctorMessage, setProctorMessage] = useState("");
  const [isPausedForFullscreen, setIsPausedForFullscreen] = useState(false);
  const tabSwitchCountRef = useRef(0);
  const autoSubmittingRef = useRef(false);
  const lastViolationAtRef = useRef(0);
  const handleFinalSubmitRef = useRef(() => {});

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion._id);

  const handleFinalSubmit = useCallback(async ({ force = false, reason = "" } = {}) => {
    if (autoSubmittingRef.current) return;

    if (!force) {
      const confirmed = window.confirm(
        "Are you sure you want to submit the test? You cannot change your answers after this."
      );
      if (!confirmed) return;
    }

    autoSubmittingRef.current = true;
    if (reason) {
      setProctorMessage(reason);
    }

    setIsSubmitting(true);
    try {
      // API requires an array of answers for final submission mapping
      // Pass an `autoSubmitted` flag when submission is forced (proctoring/time expiry)
      await submitTest(attempt._id, { answers, autoSubmitted: Boolean(force) });
      onFinish(attempt._id);
    } catch {
      alert("Error submitting test. Please check connection.");
      setIsSubmitting(false);
      autoSubmittingRef.current = false;
    }
  }, [attempt._id, answers, onFinish]);

  useEffect(() => {
    handleFinalSubmitRef.current = handleFinalSubmit;
  }, [handleFinalSubmit]);

  // Timer Logic
  useEffect(() => {
    if (isPausedForFullscreen) {
      return;
    }

    if (timeLeft <= 0) {
      const timer = setTimeout(() => {
        handleFinalSubmitRef.current({ force: true, reason: "Time is over. Auto-submitting your test." });
      }, 0);
      return () => clearTimeout(timer);
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isPausedForFullscreen]);

  useEffect(() => {
    if (!isProctored) {
      return () => {};
    }

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

    const blockClipboard = (event) => {
      event.preventDefault();
      setProctorMessage("Copy, cut, and paste are disabled during the test.");
    };

    const blockContextMenu = (event) => {
      event.preventDefault();
      setProctorMessage("Right-click is disabled during the test.");
    };

    const blockShortcutKeys = (event) => {
      const lowerKey = event.key?.toLowerCase();
      const isClipboardShortcut =
        (event.ctrlKey || event.metaKey) && ["c", "v", "x", "a"].includes(lowerKey);
      if (isClipboardShortcut) {
        event.preventDefault();
        setProctorMessage("Clipboard shortcuts are disabled during the test.");
      }
    };

    const handleVisibilityViolation = () => {
      const now = Date.now();
      if (now - lastViolationAtRef.current < 800) {
        return;
      }
      lastViolationAtRef.current = now;

      tabSwitchCountRef.current += 1;
      const remaining = 2 - tabSwitchCountRef.current;

      if (tabSwitchCountRef.current >= 2) {
        setTimeout(() => {
          handleFinalSubmitRef.current({ force: true, reason: "Two tab switches detected. Auto-submitting your test." });
        }, 0);
        return;
      }

      setProctorMessage(`Tab switch detected. ${remaining} attempt left before auto-submit.`);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleVisibilityViolation();
      }
    };

    const handleWindowBlur = () => {
      if (document.visibilityState === "visible") {
        handleVisibilityViolation();
      }
    };

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
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isProctored]);

  // Format Time
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Select Option & Sync to Backend
  const handleOptionSelect = async (optionIndex) => {
    if (isPausedForFullscreen) {
      return;
    }

    const newAnswer = {
      questionId: currentQuestion._id,
      selectedOptionIndex: optionIndex,
      timeTaken: 0 // Ideally tracked per question, simplified here
    };

    // Optimistic UI update
    setAnswers((prev) => {
      const exists = prev.find(a => a.questionId === currentQuestion._id);
      if (exists) return prev.map(a => a.questionId === currentQuestion._id ? newAnswer : a);
      return [...prev, newAnswer];
    });

    try {
      await submitAnswer(attempt._id, newAnswer);
    } catch (err) {
      console.error("Failed to sync answer:", err);
    }
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

  if (isSubmitting) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-dark-400 text-white">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
        <h2 className="text-xl font-bold">Submitting your test...</h2>
        <p className="mt-2 text-gray-400">Please do not close this window.</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col bg-dark-400">
      
      {/* HEADER */}
      <header className="flex shrink-0 items-center justify-between border-b border-dark-100 bg-dark-300 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-dark-200 hover:text-white">
            <X size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-white">Test in Progress</h1>
            <p className="text-xs text-gray-400">Question {currentIndex + 1} of {questions.length}</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold ${timeLeft < 300 ? "bg-red-500/10 text-red-400" : "bg-dark-200 text-brand-primary"}`}>
          <Clock size={18} />
          {formatTime(timeLeft)}
        </div>
      </header>

      {proctorMessage && (
        <div className="mx-6 mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300">
          {proctorMessage}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 overflow-y-auto p-6 custom-scrollbar">
        
        {/* QUESTION CARD */}
        <div className="rounded-2xl border border-dark-100 bg-dark-300 p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between border-b border-dark-100 pb-4">
            <h2 className="text-lg font-medium leading-relaxed text-white">
              <span className="mr-2 font-bold text-gray-500">{currentIndex + 1}.</span>
              {currentQuestion.questionText}
            </h2>
            <div className="shrink-0 text-right">
              <span className="rounded-md bg-dark-100 px-2.5 py-1 text-xs font-bold text-gray-400">
                {currentQuestion.marks} Marks
              </span>
            </div>
          </div>

          {/* OPTIONS */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = currentAnswer?.selectedOptionIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isPausedForFullscreen}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                    isSelected 
                      ? "border-brand-primary bg-brand-primary/10" 
                      : "border-dark-100 bg-dark-200 hover:border-gray-600"
                  }`}
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-brand-primary bg-brand-primary text-dark-400" : "border-gray-500 text-transparent"
                  }`}>
                    <CheckCircle2 size={14} />
                  </div>
                  <span className={`text-base ${isSelected ? "font-semibold text-white" : "text-gray-300"}`}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </main>

      {/* FOOTER NAVIGATION */}
      <footer className="shrink-0 border-t border-dark-100 bg-dark-300 p-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button
            disabled={isPausedForFullscreen || currentIndex === 0}
            onClick={() => setCurrentIndex(prev => prev - 1)}
            className="flex items-center gap-2 rounded-xl bg-dark-100 px-5 py-3 text-sm font-bold text-white transition disabled:opacity-30"
          >
            <ChevronLeft size={18} /> Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleFinalSubmit}
              disabled={isPausedForFullscreen}
              className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              <AlertTriangle size={18} /> Submit Test
            </button>

            <button
              disabled={isPausedForFullscreen || currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-dark-400 transition disabled:opacity-30"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </footer>

      {isPausedForFullscreen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-400/95 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-dark-300 p-6 text-center shadow-2xl">
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

    </div>
  );
}