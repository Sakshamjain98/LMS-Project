import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { startTest } from "../../services/studentService";
import TestPlayer from "./TestPlayer";
import TestResult from "./TestResult";

export default function CourseTestPlayer() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/student/courses";

  const [phase, setPhase] = useState("loading"); // "loading" | "player" | "result" | "error"
  const [attemptData, setAttemptData] = useState(null);
  const [resultId, setResultId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    startTest(testId)
      .then((res) => {
        if (!active) return;
        setAttemptData(res.data);
        setPhase("player");
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Failed to start test.");
        setPhase("error");
      });
    return () => { active = false; };
  }, [testId]);

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

  if (phase === "result" && resultId) {
    return <TestResult attemptId={resultId} onBack={handleExit} />;
  }

  if (phase === "player" && attemptData) {
    return <TestPlayer attemptData={attemptData} onFinish={handleFinish} onExit={handleExit} />;
  }

  return null;
}
