import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import {
  getAvailableTests,
  getMyAttempts,
  startTest,
  getStudentSubscription,
} from "../../services/studentService";
import TestPlayer from "./TestPlayer";
import TestResult from "./TestResult";

export default function SeriesDetail() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [view, setView] = useState("series"); // 'series' | 'player' | 'result'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [topic, setTopic] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const [activeAttemptData, setActiveAttemptData] = useState(null);
  const [activeResultId, setActiveResultId] = useState(null);

  useEffect(() => {
    if (view !== "series") return;
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      getAvailableTests().catch(() => ({ topics: [] })),
      getMyAttempts().catch(() => ({ data: [] })),
      getStudentSubscription().catch(() => null),
    ]).then(([testsRes, attemptsRes, sub]) => {
      if (!active) return;
      const found = (testsRes.topics || []).find((t) => t._id === topicId);
      if (!found) {
        setError("This test series isn't available.");
      } else {
        setTopic(found);
      }
      setAttempts(attemptsRes.data || []);
      setSubscription(sub || null);
      setLoading(false);
    });

    return () => { active = false; };
  }, [topicId, view]);

  const tests = useMemo(() => flattenTopicTests(topic), [topic]);

  // Map of testId → { latestAttempt, count } so we can show re-attempt CTA correctly.
  const attemptsByTest = useMemo(() => attempts.reduce((map, attempt) => {
    const tid = typeof attempt?.testId === "object" ? attempt?.testId?._id : attempt?.testId;
    if (!tid) return map;
    const entry = map[tid] || { latest: null, count: 0 };
    entry.count += 1;
    const curT = new Date(attempt?.submittedAt || attempt?.updatedAt || attempt?.createdAt || 0).getTime();
    const prevT = entry.latest ? new Date(entry.latest?.submittedAt || entry.latest?.updatedAt || entry.latest?.createdAt || 0).getTime() : -1;
    if (!entry.latest || curT >= prevT) entry.latest = attempt;
    map[tid] = entry;
    return map;
  }, {}), [attempts]);

  const isUnlocked = !topic?.isPaid || (subscription?.status === "ACTIVE" && subscription?.plan && subscription.plan !== "FREE");

  const handleStartTest = async (testId) => {
    try {
      setLoading(true);
      const res = await startTest(testId);
      setActiveAttemptData(res.data);
      setView("player");
    } catch (err) {
      setError(err.message || "Failed to start test.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = (attemptId) => {
    setActiveResultId(attemptId);
    setView("result");
  };

  const backToSeries = () => {
    setView("series");
    setActiveAttemptData(null);
    setActiveResultId(null);
  };

  if (view === "player" && activeAttemptData) {
    return <TestPlayer attemptData={activeAttemptData} onFinish={(id) => handleViewResult(id)} onExit={backToSeries} />;
  }
  if (view === "result" && activeResultId) {
    return <TestResult attemptId={activeResultId} onBack={backToSeries} />;
  }

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen pb-16" style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
          <Link
            to="/student/tests"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to all series
          </Link>

          {loading ? (
            <div className="mt-12 flex items-center justify-center text-white/60">
              <Loader2 size={20} className="animate-spin mr-2" /> Loading series…
            </div>
          ) : error ? (
            <div className="mt-12 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          ) : (
            <>
              {/* Hero */}
              <div className="relative mt-5 overflow-hidden rounded-3xl glass-panel ambient-glow p-6 md:p-8 animate-fade-up">
                <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {topic.isPaid ? (
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                          Premium · ₹{Number(topic.price || 0).toLocaleString()}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                          Free Series
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold text-white/60">
                          <Lock size={11} /> Locked Preview
                        </span>
                      )}
                    </div>
                    <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl break-words">{topic.title}</h1>
                    {topic.description && (
                      <p className="mt-2 max-w-2xl text-sm text-white/60 break-words">{topic.description}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
                      <Pill label="Subjects" value={topic.subjects?.length || 0} />
                      <Pill label="Chapters" value={(topic.subjects || []).reduce((n, s) => n + (s.chapters?.length || 0), 0)} />
                      <Pill label="Tests" value={tests.length} />
                    </div>
                  </div>

                  {topic.isPaid && !isUnlocked && (
                    <button
                      onClick={() => navigate("/#pricing")}
                      className="self-start inline-flex items-center gap-2 rounded-xl btn-gradient px-5 py-2.5 text-sm font-bold whitespace-nowrap"
                    >
                      Unlock for ₹{Number(topic.price || 0).toLocaleString()}
                    </button>
                  )}
                </div>
              </div>

              {/* Subjects / chapters / tests */}
              <div className="mt-8 space-y-8">
                {(topic.subjects || []).map((subject, sIdx) => (
                  <section key={subject._id} className="animate-fade-up" style={{ animationDelay: `${sIdx * 50}ms` }}>
                    <div className="mb-3 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Subject</p>
                        <h2 className="mt-0.5 text-lg font-bold text-white break-words">{subject.title}</h2>
                      </div>
                    </div>

                    {(subject.chapters || []).map((chapter) => (
                      <div key={chapter._id} className="mt-4 rounded-2xl glass-card p-5">
                        <div className="mb-3 flex items-center justify-between flex-wrap gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Chapter</p>
                            <h3 className="mt-0.5 text-base font-semibold text-white break-words">{chapter.title}</h3>
                            {chapter.description && (
                              <p className="mt-1 text-xs text-white/50 break-words">{chapter.description}</p>
                            )}
                          </div>
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60 whitespace-nowrap">
                            {chapter.tests?.length || 0} {(chapter.tests?.length || 0) === 1 ? "test" : "tests"}
                          </span>
                        </div>

                        {(chapter.tests || []).length === 0 ? (
                          <p className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-6 text-center text-xs text-white/40">
                            No tests in this chapter yet.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {(chapter.tests || []).map((test) => (
                              <TestRow
                                key={test._id}
                                test={test}
                                isUnlocked={isUnlocked}
                                attemptInfo={attemptsByTest[test._id]}
                                onStartTest={handleStartTest}
                                onViewResult={handleViewResult}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </section>
                ))}
              </div>

              {topic.isPaid && !isUnlocked && (
                <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100 flex items-start gap-3">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-300" />
                  <div>
                    <p className="font-semibold text-amber-200">This is a premium test series</p>
                    <p className="mt-1 text-amber-100/80">
                      You can browse the chapter outline above. Unlock the full series for{" "}
                      <strong className="text-white">₹{Number(topic.price || 0).toLocaleString()}</strong> to start tests, see solutions, and earn All-India Ranks.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

const flattenTopicTests = (topic) => {
  if (!topic) return [];
  const out = [];
  topic.subjects?.forEach((s) => s.chapters?.forEach((c) => c.tests?.forEach((t) => out.push(t))));
  return out;
};

function Pill({ label, value }) {
  return (
    <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px]">
      <span className="font-bold text-white">{value}</span>{" "}
      <span className="text-white/50">{label}</span>
    </span>
  );
}

function TestRow({ test, isUnlocked, attemptInfo, onStartTest, onViewResult }) {
  const latestAttempt = attemptInfo?.latest;
  const attemptCount = attemptInfo?.count || 0;
  const attemptLimit = Number(test.attemptLimit) || 0; // 0 = unlimited
  const limitReached = attemptLimit > 0 && attemptCount >= attemptLimit;

  const isCompleted = latestAttempt && (
    ["submitted", "evaluated"].includes(latestAttempt?.status) ||
    Boolean(latestAttempt?.autoSubmitted) ||
    Boolean(latestAttempt?.isCompleted)
  );
  // Re-attempt is allowed when the latest attempt is finished AND the student
  // hasn't hit the attempt limit (or the limit is 0/unlimited).
  const canRetake = isCompleted && !limitReached && isUnlocked;

  return (
    <div className="rounded-xl border border-white/10 bg-dark-300/40 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-white break-words">{test.title}</h4>
        {test.description && <p className="mt-0.5 text-xs text-white/50 break-words line-clamp-1">{test.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/40">
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList size={11} className="text-brand-primary/70" />
            {test.questions?.length || 0} Questions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={11} className="text-brand-primary/70" />
            {test.duration || 0} min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-white/30">·</span>
            {attemptLimit === 0 ? "Unlimited attempts" : `${attemptCount}/${attemptLimit} used`}
          </span>
          {test.isProctored && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Proctored
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!isUnlocked ? (
          <button disabled className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-white/40 cursor-not-allowed">
            <Lock size={12} /> Locked
          </button>
        ) : (
          <>
            {isCompleted && (
              <button
                onClick={() => onViewResult(latestAttempt._id)}
                className="rounded-lg bg-blue-500/15 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/25"
              >
                View Result
              </button>
            )}
            {canRetake ? (
              <button
                onClick={() => onStartTest(test._id)}
                className="rounded-lg btn-gradient px-3 py-2 text-xs font-bold"
              >
                Retake
              </button>
            ) : !isCompleted ? (
              <button
                onClick={() => onStartTest(test._id)}
                className="rounded-lg btn-gradient px-3 py-2 text-xs font-bold"
              >
                Start Test
              </button>
            ) : limitReached ? (
              <span className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-white/40">
                Limit reached
              </span>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
