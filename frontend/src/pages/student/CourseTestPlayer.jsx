import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft, Clock, ClipboardList, ShieldAlert, Play, FileText, Layers } from "lucide-react";
import { getTestPreview, startTest } from "../../services/studentService";
import TestPlayer from "./TestPlayer";
import TestResult from "./TestResult";

export default function CourseTestPlayer() {
  const { courseId, testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || (courseId ? `/student/courses/${courseId}` : "/student/courses");
  const token = localStorage.getItem("token");

  const [phase, setPhase] = useState(token ? "loading" : "error"); // "loading" | "preview" | "player" | "result" | "error"
  const [previewData, setPreviewData] = useState(null);
  const [attemptData, setAttemptData] = useState(null);
  const [resultId, setResultId] = useState(null);
  const [error, setError] = useState(
    token ? "" : "Authorization token is missing. Please sign in again to start this test."
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    getTestPreview(testId)
      .then((res) => {
        if (!active) return;
        setPreviewData(res.data?.data || res.data);
        setPhase("preview");
      })
      .catch((err) => {
        if (!active) return;
        if (err?.response?.status === 401) {
          setError("Your session is not valid for this test. Please sign in again.");
        } else {
          setError(err?.message || "Failed to load test details.");
        }
        setPhase("error");
      });
    return () => { active = false; };
  }, [testId, token]);

  const handleStart = async () => {
    try {
      setPhase("loading");
      const res = await startTest(testId);
      setAttemptData(res.data?.data || res.data);
      setPhase("player");
    } catch (err) {
      setError(err?.message || "Failed to start test.");
      setPhase("error");
    }
  };

  const handleFinish = (attemptId) => {
    setResultId(attemptId);
    setPhase("result");
  };

  const handleExit = () => navigate(returnTo);

  if (phase === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-400">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin text-brand-primary" />
          <p className="text-sm text-white/60">Starting test…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-400 px-6">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-base font-semibold text-white">{error}</p>
          <button
            onClick={handleExit}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (phase === "preview" && previewData) {
    const test = previewData.test || {};

    return (
      <div className="min-h-screen bg-dark-400 pb-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
          <button
            onClick={handleExit}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to course
          </button>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-2xl">
            <div className="border-b border-white/5 bg-linear-to-r from-brand-primary/15 via-white/3 to-transparent px-6 py-5 md:px-8">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/45">
                <span className="rounded-full bg-brand-primary/15 px-2.5 py-1 text-brand-primary">Course Test</span>
                {test.type && <span>{test.type}</span>}
              </div>
              <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">{test.title}</h1>
              {test.description && <p className="mt-2 max-w-3xl text-sm text-white/60">{test.description}</p>}
            </div>

            <div className="grid gap-4 border-b border-white/5 px-6 py-5 md:grid-cols-4 md:px-8">
              <PreviewStat icon={<ClipboardList size={15} />} label="Questions" value={test.questionsCount || 0} />
              <PreviewStat icon={<Clock size={15} />} label="Duration" value={test.duration ? `${test.duration} min` : "—"} />
              <PreviewStat icon={<Layers size={15} />} label="Marks" value={test.totalMarks || 0} />
              <PreviewStat icon={<ShieldAlert size={15} />} label="Attempts" value={test.attemptLimit === 0 ? "Unlimited" : `${previewData.attemptCount || 0}/${test.attemptLimit}`} />
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2 md:px-8">
              <InfoChip label="Passing Marks" value={test.passingMarks || 0} />
              <InfoChip label="Negative Marking" value={test.negativeMarking || 0} />
              <InfoChip label="Proctored" value={test.isProctored ? "Yes" : "No"} />
              <InfoChip label="Review Allowed" value={test.allowReview ? "Yes" : "No"} />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/5 px-6 py-5 md:px-8">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <FileText size={14} className="text-brand-primary" />
                This is the test details screen. Start when ready.
              </div>
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 rounded-xl btn-gradient px-5 py-2.5 text-sm font-bold"
              >
                <Play size={14} /> Start Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result" && resultId) {
    return <TestResult attemptId={resultId} onBack={handleExit} />;
  }

  if (phase === "player" && attemptData) {
    return <TestPlayer attemptData={attemptData} onFinish={handleFinish} onExit={handleExit} />;
  }

  return null;
}

function PreviewStat({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/40">
        <span className="text-brand-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-xl font-bold text-white">{value}</div>
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-white/35">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
