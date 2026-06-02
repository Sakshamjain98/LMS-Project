import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  GraduationCap,
  Tag,
  FileText,
  Lock,
  Search,
  ArrowRight,
  Sparkles,
  Zap,
  Layers,
  ClipboardList,
  X,
  Loader2,
} from "lucide-react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { getAvailableTests } from "../../services/studentService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatPill({ icon, label, value, color }) {
  const colors = {
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    sky:    "bg-brand-primary/10 border-brand-primary/20 text-brand-primary",
    emerald:"bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    amber:  "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 ${colors[color] || "border-white/10 bg-white/5 text-white/60"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[10px] uppercase tracking-widest font-semibold">{label}</p>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

// ─── AITS Card — matches ExamCard / CategoryCard style exactly ────────────────

function AITSCard({ aits, examTitle, categoryTitle, idx, onClick }) {
  const testCount = aits.tests?.length || 0;

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl glass-card p-5 transition-all duration-300 hover:border-amber-500/40 hover:bg-white/5 hover:shadow-[0_8px_32px_rgba(251,191,36,0.15)] hover:-translate-y-0.5 animate-fade-up"
      style={{ animationDelay: `${idx * 40}ms` }}
    >
      {/* Icon row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-amber-500/25 to-amber-600/10 text-amber-400 ring-1 ring-amber-500/20 group-hover:ring-amber-500/40 transition-all">
          <Trophy size={20} />
        </div>
        <div className="flex flex-col items-end gap-1">
          {aits.isPaid ? (
            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-300 inline-flex items-center gap-1">
              <Lock size={8} />
              {aits.discountedPrice > 0 && aits.discountedPrice < aits.price ? (
                <>
                  <span className="line-through opacity-60">₹{Number(aits.price || 0).toLocaleString()}</span>
                  <span>₹{Number(aits.discountedPrice).toLocaleString()}</span>
                </>
              ) : (
                <span>₹{Number(aits.price || 0).toLocaleString()}</span>
              )}
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 inline-flex items-center gap-1">
              <Zap size={8} /> Free
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
        {aits.title}
      </h3>

      {/* Exam + category tags */}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="flex items-center gap-1 text-[10px] text-white/40">
          <GraduationCap size={9} className="text-sky-400" /> {examTitle}
        </span>
        <span className="text-white/20 text-[9px]">·</span>
        <span className="flex items-center gap-1 text-[10px] text-white/40">
          <Tag size={9} className="text-purple-400" /> {categoryTitle}
        </span>
      </div>

      {aits.description && (
        <p className="mt-2 text-xs text-white/50 line-clamp-2">{aits.description}</p>
      )}

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/3 border border-white/5 px-3 py-2 text-center">
          <p className="text-xs font-bold text-white">{testCount}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Tests</p>
        </div>
        <div className="rounded-lg bg-white/3 border border-white/5 px-3 py-2 text-center">
          <p className="text-xs font-bold text-white">{aits.isPaid ? "Paid" : "Free"}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Access</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-end text-[11px] text-amber-400 group-hover:text-amber-300">
        <span className="flex items-center gap-1 group-hover:gap-2 transition-all">
          View Tests <ArrowRight size={11} />
        </span>
      </div>
    </button>
  );
}

// ─── Exam Group Header ────────────────────────────────────────────────────────

function ExamGroupHeader({ examTitle, categoryTitle, count }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-sky-500/20 to-sky-600/5 ring-1 ring-sky-500/20">
        <GraduationCap size={13} className="text-sky-400" />
      </div>
      <div>
        <span className="text-sm font-bold text-white">{examTitle}</span>
        <span className="ml-2 text-[10px] text-white/40">{categoryTitle}</span>
      </div>
      <span className="ml-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
        {count} series
      </span>
      <div className="ml-2 h-px flex-1 bg-white/5" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentAITS() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterExam, setFilterExam] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");

  useEffect(() => {
    let active = true;
    getAvailableTests()
      .then((res) => { if (active) setCategories(res?.categories || []); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Flatten all AITS with context
  const allAITS = useMemo(() => {
    const out = [];
    for (const cat of categories) {
      for (const exam of cat.exams || []) {
        for (const a of exam.allIndiaTestSeries || []) {
          out.push({
            ...a,
            examTitle: exam.title,
            examId: exam._id,
            categoryTitle: cat.title,
            categoryId: cat._id,
          });
        }
      }
    }
    return out;
  }, [categories]);

  // Exam options for dropdown
  const examOptions = useMemo(() => {
    const seen = new Set();
    return allAITS.reduce((acc, a) => {
      if (!seen.has(a.examId)) { seen.add(a.examId); acc.push({ id: a.examId, title: a.examTitle }); }
      return acc;
    }, []);
  }, [allAITS]);

  // Filter + search
  const filtered = useMemo(() => {
    let list = allAITS;
    if (filterExam !== "all") list = list.filter((a) => a.examId === filterExam);
    if (filterPaid === "free") list = list.filter((a) => !a.isPaid);
    if (filterPaid === "paid") list = list.filter((a) => a.isPaid);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.examTitle.toLowerCase().includes(q) ||
        a.categoryTitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allAITS, filterExam, filterPaid, search]);

  // Group by exam
  const grouped = useMemo(() => {
    const map = new Map();
    for (const a of filtered) {
      if (!map.has(a.examId)) {
        map.set(a.examId, { examTitle: a.examTitle, categoryTitle: a.categoryTitle, items: [] });
      }
      map.get(a.examId).items.push(a);
    }
    return [...map.values()];
  }, [filtered]);

  const totalTests  = allAITS.reduce((s, a) => s + (a.tests?.length || 0), 0);
  const freeCount   = allAITS.filter((a) => !a.isPaid).length;
  const examCount   = examOptions.length;
  const clearFilters = () => { setSearch(""); setFilterExam("all"); setFilterPaid("all"); };

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen pb-16" style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden border-b border-white/5">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-amber-500/8 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-yellow-500/5 blur-3xl" />

          <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-400/80">
              <Sparkles size={12} className="text-amber-400" />
              All India Test Series
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">
              AITS <span className="bg-linear-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">Hub</span>
            </h1>
            <p className="mt-2 text-sm text-gray-400 md:text-base">
              Compete at a national level, benchmark yourself, and track your All-India Rank.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatPill icon={<Trophy size={14} />}       label="Series"   value={allAITS.length} color="amber"   />
              <StatPill icon={<GraduationCap size={14} />} label="Exams"   value={examCount}      color="sky"     />
              <StatPill icon={<ClipboardList size={14} />} label="Tests"   value={totalTests}     color="emerald" />
              <StatPill icon={<Zap size={14} />}           label="Free"    value={freeCount}      color="purple"  />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">

          {/* ── Search + filters bar (same style as BrowseView) ──────────── */}
          {!loading && allAITS.length > 0 && (
            <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl glass-card p-4">
              {/* Search */}
              <div className="relative min-w-52 flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search AITS series…"
                  className="w-full rounded-xl border border-white/10 bg-dark-300/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Exam filter */}
              {examOptions.length > 1 && (
                <select
                  value={filterExam}
                  onChange={(e) => setFilterExam(e.target.value)}
                  className="rounded-xl border border-white/10 bg-dark-300/70 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                >
                  <option value="all">All Exams</option>
                  {examOptions.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
              )}

              {/* Paid/Free filter */}
              <div className="flex rounded-xl border border-white/10 overflow-hidden text-sm">
                {[
                  { val: "all",  label: "All" },
                  { val: "free", label: "Free" },
                  { val: "paid", label: "Paid" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setFilterPaid(opt.val)}
                    className={`px-4 py-2.5 font-medium transition-colors ${
                      filterPaid === opt.val
                        ? "bg-brand-primary/20 text-brand-primary"
                        : "bg-dark-300/70 text-white/50 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Loading ────────────────────────────────────────────────── */}
          {loading && (
            <div className="flex h-64 items-center justify-center text-white/60">
              <Loader2 size={20} className="animate-spin text-brand-primary mr-2" /> Loading…
            </div>
          )}

          {/* ── Empty (no AITS at all) ─────────────────────────────────── */}
          {!loading && allAITS.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Trophy size={40} className="mb-3 text-white/20" />
              <p className="text-sm text-white/40 font-medium">No AITS available yet</p>
              <p className="mt-1 text-xs text-white/25">Check back soon for upcoming All India Test Series.</p>
            </div>
          )}

          {/* ── No filter results ─────────────────────────────────────── */}
          {!loading && allAITS.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FileText size={36} className="mb-3 text-white/20" />
              <p className="text-sm font-medium text-white/40">No series match your filters</p>
              <button onClick={clearFilters} className="mt-2 text-sm text-brand-primary hover:underline">
                Clear filters
              </button>
            </div>
          )}

          {/* ── Results grouped by exam ────────────────────────────────── */}
          {!loading && grouped.length > 0 && (
            <div className="space-y-10">
              {/* Level header (same pattern as BrowseView) */}
              <div className="flex items-center gap-2 px-1">
                <Trophy size={16} className="text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  {filterExam !== "all" || filterPaid !== "all" || search
                    ? "Filtered Results"
                    : "All Series"}
                </h2>
                <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/40">
                  {filtered.length}
                </span>
              </div>

              {grouped.map((group) => (
                <div key={group.examTitle} className="space-y-4">
                  <ExamGroupHeader
                    examTitle={group.examTitle}
                    categoryTitle={group.categoryTitle}
                    count={group.items.length}
                  />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((aits, idx) => (
                      <AITSCard
                        key={aits._id}
                        aits={aits}
                        examTitle={aits.examTitle}
                        categoryTitle={aits.categoryTitle}
                        idx={idx}
                        onClick={() => navigate(`/student/tests/${aits._id}`)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
