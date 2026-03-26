import { useState, useEffect, useCallback } from "react";
import { submitAnswer, submitTest } from "../../services/studentService";
import { Clock, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, X } from "lucide-react";

export default function TestPlayer({ attemptData, onFinish, onExit }) {
  const { attempt, questions, duration } = attemptData;
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(attempt.answers || []);
  const [timeLeft, setTimeLeft] = useState((duration || 120) * 60); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion._id);

  // Timer Logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

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

  // Final Submit
  const handleFinalSubmit = useCallback(async () => {
    if (!window.confirm("Are you sure you want to submit the test? You cannot change your answers after this.")) return;
    
    setIsSubmitting(true);
    try {
      // API requires an array of answers for final submission mapping
      await submitTest(attempt._id, { answers });
      onFinish(attempt._id);
    } catch (err) {
      alert("Error submitting test. Please check connection.");
      setIsSubmitting(false);
    }
  }, [attempt._id, answers, onFinish]);

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
    <div className="flex h-screen flex-col bg-dark-400">
      
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
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => prev - 1)}
            className="flex items-center gap-2 rounded-xl bg-dark-100 px-5 py-3 text-sm font-bold text-white transition disabled:opacity-30"
          >
            <ChevronLeft size={18} /> Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleFinalSubmit}
              className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              <AlertTriangle size={18} /> Submit Test
            </button>

            <button
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-dark-400 transition disabled:opacity-30"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}