import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  ClipboardList,
  TrendingUp,
  Trophy,
  Flame,
  Loader2,
  Layers,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Crown,
} from "lucide-react";
import { getTopicAnalytics } from "../../services/teacherService";

const PAGE_SIZE = 10;

export default function TestSeriesAnalytics() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lbPage, setLbPage] = useState(1);
  const [testPage, setTestPage] = useState(1);

  useEffect(() => {
    let active = true;
    getTopicAnalytics(topicId)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [topicId]);

  const lbPaged = useMemo(() => {
    const list = data?.leaderboard || [];
    const start = (lbPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [data, lbPage]);
  const lbTotalPages = Math.max(1, Math.ceil((data?.leaderboard?.length || 0) / PAGE_SIZE));

  const testPaged = useMemo(() => {
    const list = data?.testBreakdown || [];
    const start = (testPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [data, testPage]);
  const testTotalPages = Math.max(1, Math.ceil((data?.testBreakdown?.length || 0) / PAGE_SIZE));

  const peakTests = (data?.testBreakdown || []).slice(0, 3);
  const maxAttempts = Math.max(1, ...(data?.testBreakdown || []).map((t) => t.attempts));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-white/60">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading analytics…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        Failed to load analytics for this test series.{" "}
        <Link to="/admin/test-series" className="underline">Go back</Link>
      </div>
    );
  }

  const { topic, summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={() => navigate("/admin/test-series")}
            className="rounded-xl glass-pill p-2.5 text-white/70 hover:text-white shrink-0"
            title="Back to test series"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Analytics</p>
            <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl wrap-break-word">{topic.title}</h1>
            <p className="mt-1 text-xs text-white/50 wrap-break-word">
              {topic.isPaid ? `Premium · ₹${Number(topic.price || 0).toLocaleString()}` : "Free Series"}
              {topic.description && <> &nbsp;·&nbsp; {topic.description}</>}
            </p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={Layers} label="Tests" value={summary.tests} hint={`${summary.publishedTests} published`} />
        <Kpi icon={ClipboardList} label="Attempts" value={summary.totalAttempts} hint={`${summary.totalCompleted} completed`} />
        <Kpi icon={Users} label="Unique Students" value={summary.totalUniqueStudents} hint={`${summary.subjects} subj · ${summary.chapters} ch`} />
        <Kpi
          icon={TrendingUp}
          label="Avg Score"
          value={`${summary.overallAvgPercent}%`}
          hint={topic.isPaid ? `₹${Number(summary.revenue || 0).toLocaleString()} from ${summary.unlocks} unlocks` : "Engagement-weighted"}
          accent="primary"
        />
      </div>

      {/* Two-up: peak tests + 30-day activity bars */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Peak / High-Demand Tests" icon={Flame}>
          {peakTests.length === 0 ? (
            <p className="text-sm text-white/40">Nothing attempted yet.</p>
          ) : (
            <div className="space-y-3">
              {peakTests.map((t, idx) => (
                <div key={t._id} className="rounded-xl border border-white/10 bg-white/3 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white wrap-break-word">
                        <span className="mr-2 text-brand-primary">#{idx + 1}</span>
                        {t.title}
                      </p>
                      <p className="text-[11px] text-white/50">
                        {t.attempts} attempts · {t.uniqueStudents} students · avg {t.avgPercent}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-brand-primary"
                      style={{ width: `${(t.attempts / maxAttempts) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Last 30 Days Activity" icon={BarChart2}>
          <ActivityChart data={data.dailyActivity} />
        </Card>
      </div>

      {/* Subject roll-up */}
      <Card title="By Subject" icon={Layers}>
        {data.subjectBreakdown.length === 0 ? (
          <p className="text-sm text-white/40">No subjects.</p>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Subject</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Chapters</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Tests</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.subjectBreakdown.map((s) => (
                  <tr key={s._id} className="hover:bg-white/4">
                    <td className="px-4 py-3 text-sm font-semibold text-white wrap-break-word">{s.title}</td>
                    <td className="px-4 py-3 text-sm text-white/70">{s.chapters}</td>
                    <td className="px-4 py-3 text-sm text-white/70">{s.tests}</td>
                    <td className="px-4 py-3 text-sm font-bold text-brand-primary">{s.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* All tests breakdown — paginated */}
      <Card title="All Tests" icon={ClipboardList}>
        {data.testBreakdown.length === 0 ? (
          <p className="text-sm text-white/40">No tests in this series yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Test</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Attempts</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Students</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Avg %</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Best %</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Avg Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {testPaged.map((t) => (
                    <tr key={t._id} className="hover:bg-white/4">
                      <td className="px-4 py-3 text-sm font-semibold text-white wrap-break-word">
                        <Link
                          to={`/admin/test-series/test/${t._id}`}
                          className="hover:text-brand-primary"
                        >
                          {t.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-brand-primary">{t.attempts}</td>
                      <td className="px-4 py-3 text-sm text-white/70">{t.uniqueStudents}</td>
                      <td className="px-4 py-3 text-sm text-white/70">{t.avgPercent}%</td>
                      <td className="px-4 py-3 text-sm text-white/70">{t.maxPercent}%</td>
                      <td className="px-4 py-3 text-sm text-white/70">{t.avgTimeMin}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.testBreakdown.length > PAGE_SIZE && (
              <Pager page={testPage} totalPages={testTotalPages} totalCount={data.testBreakdown.length} pageSize={PAGE_SIZE} onChange={setTestPage} />
            )}
          </>
        )}
      </Card>

      {/* Leaderboard — top students across the series */}
      <Card title="Leaderboard — Top Students in Series" icon={Trophy}>
        {data.leaderboard.length === 0 ? (
          <p className="text-sm text-white/40">No completed attempts yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Rank</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Student</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Attempts</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Total Marks</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Avg %</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Best %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {lbPaged.map((row, idx) => {
                    const rank = (lbPage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr key={row.studentId} className="hover:bg-white/4">
                        <td className="px-4 py-3 text-sm font-bold text-white">
                          <span className="inline-flex items-center gap-1.5">
                            {rank === 1 ? <Crown size={14} className="text-amber-300" /> : null}
                            #{rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          <p className="font-semibold wrap-break-word">{row.studentName || "—"}</p>
                          <p className="text-[11px] text-white/50 wrap-break-word">{row.studentEmail || ""}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/70">{row.attempts}</td>
                        <td className="px-4 py-3 text-sm font-bold text-brand-primary">{row.totalMarks}</td>
                        <td className="px-4 py-3 text-sm text-white/70">{row.avgPercent}%</td>
                        <td className="px-4 py-3 text-sm text-white/70">{row.bestPercent}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.leaderboard.length > PAGE_SIZE && (
              <Pager page={lbPage} totalPages={lbTotalPages} totalCount={data.leaderboard.length} pageSize={PAGE_SIZE} onChange={setLbPage} />
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="rounded-2xl glass-card p-4 transition-colors hover:border-brand-primary/30">
      <div className="flex items-center gap-2 text-white/60">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
            accent === "primary" ? "bg-brand-primary/15 text-brand-primary" : "bg-white/5 text-white/70"
          }`}
        >
          <Icon size={14} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/15 text-brand-primary">
          <Icon size={14} />
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/80">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ActivityChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-white/40">No activity in the last 30 days.</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.attempts));
  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map((d) => (
        <div key={d._id} className="group flex flex-1 min-w-1.5 flex-col items-center justify-end" title={`${d._id}: ${d.attempts}`}>
          <div
            className="w-full rounded-t-md bg-brand-primary/60 transition-colors group-hover:bg-brand-primary"
            style={{ height: `${(d.attempts / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function Pager({ page, totalPages, totalCount, pageSize, onChange }) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
      <span>
        Showing <span className="font-bold text-white">{start}</span>–
        <span className="font-bold text-white">{end}</span> of{" "}
        <span className="font-bold text-white">{totalCount}</span>
      </span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="inline-flex items-center gap-1 rounded-lg glass-pill px-3 py-1.5 font-semibold disabled:opacity-30">
          <ChevronLeft size={12} /> Prev
        </button>
        <span className="px-2 font-semibold text-white">{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="inline-flex items-center gap-1 rounded-lg glass-pill px-3 py-1.5 font-semibold disabled:opacity-30">
          Next <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
