import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Tag, GraduationCap, ChevronRight, Loader2, Lock,
  DollarSign, Search, BookMarked, CheckCircle2, ArrowRight,
  Sparkles, Layers, Play,
} from "lucide-react";
import { getPublicCourses, getMultipleCourseProgress } from "../../services/courseService";
import { getPublicExamCategories } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";

function cloudinaryOptimize(url, w = 500, h = 280) {
  if (!url || !url.includes("cloudinary.com/")) return url;
  return url.replace("/upload/", `/upload/w_${w},h_${h},c_fill,q_auto,f_auto/`);
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1 text-brand-primary">{icon}
        <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-primary">{label}</p>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

// ─── Category Card (level 0) ──────────────────────────────────────────────────

function CategoryCard({ category, idx, onClick }) {
  const examCount = category.exams?.length || 0;
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${idx * 40}ms` }}
      className="group text-left rounded-2xl border border-white/8 bg-white/2 p-6 transition-all duration-200 hover:border-brand-primary/40 hover:bg-white/4 hover:shadow-xl hover:shadow-brand-primary/10 hover:-translate-y-0.5 animate-fade-up"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand-primary/25 to-brand-primary/5 text-brand-primary ring-1 ring-brand-primary/20 group-hover:ring-brand-primary/40 transition-all">
          <Tag size={22} />
        </div>
        <span className="rounded-full bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 text-[10px] font-bold text-brand-primary">
          {examCount} Exam{examCount !== 1 ? "s" : ""}
        </span>
      </div>
      <h3 className="font-bold text-white text-base group-hover:text-brand-primary transition-colors mb-1.5 leading-snug line-clamp-2">
        {category.title}
      </h3>
      {category.description && (
        <p className="text-xs text-white/50 line-clamp-2 mb-4">{category.description}</p>
      )}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <BookOpen size={11} />
          <span>{examCount} exams available</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-primary opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200">
          Explore <ArrowRight size={11} />
        </span>
      </div>
    </button>
  );
}

// ─── Exam Card (level 1) ──────────────────────────────────────────────────────

function ExamCard({ exam, idx, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${idx * 40}ms` }}
      className="group rounded-2xl border border-white/8 bg-white/2 p-6 text-left transition-all duration-200 hover:border-brand-primary/30 hover:bg-white/4 hover:shadow-xl hover:shadow-brand-primary/8 hover:-translate-y-0.5 animate-fade-up"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary">
          <GraduationCap size={22} />
        </div>
        <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/50">
          View Courses →
        </span>
      </div>
      <h3 className="font-bold text-white text-base mb-1.5 group-hover:text-brand-primary transition-colors line-clamp-2 leading-snug">
        {exam.title}
      </h3>
      {exam.description && (
        <p className="text-xs text-white/50 line-clamp-2 mb-4">{exam.description}</p>
      )}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Layers size={11} />
          <span>Courses in this exam</span>
        </div>
        <ChevronRight size={14} className="text-white/30 group-hover:text-brand-primary transition-colors" />
      </div>
    </button>
  );
}

// ─── Course Card (level 2) ────────────────────────────────────────────────────

function CourseCard({ course, progress, onClick }) {
  const pct = progress?.percentage ?? null;
  const thumbUrl = cloudinaryOptimize(course.thumbnail?.url);
  return (
    <button
      onClick={onClick}
      className="group w-full flex flex-col rounded-2xl border border-white/8 bg-white/2 overflow-hidden text-left transition-all hover:border-brand-primary/30 hover:bg-white/4 hover:shadow-xl hover:shadow-brand-primary/5 hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="relative h-40 shrink-0 overflow-hidden bg-white/3">
        {thumbUrl ? (
          <img src={thumbUrl} alt={course.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen size={36} className="text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-dark-400/60 to-transparent" />
        {course.isPaid ? (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">
            <DollarSign size={9} />
            {course.discountedPrice > 0 && course.discountedPrice < course.price ? (
              <>
                <span className="line-through opacity-70">₹{course.price}</span>
                <span>₹{course.discountedPrice}</span>
              </>
            ) : (
              <span>₹{course.price}</span>
            )}
          </span>
        ) : (
          <span className="absolute top-3 right-3 rounded-full bg-emerald-500/80 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">
            FREE
          </span>
        )}
        {pct === 100 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-brand-primary px-2 py-0.5">
            <CheckCircle2 size={10} className="text-dark-400" />
            <span className="text-[10px] font-bold text-dark-400">Done</span>
          </div>
        )}
        {/* Subject count badge */}
        {(course.subjectsCount || 0) > 0 && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white/80 backdrop-blur-sm">
            <Layers size={9} /> {course.subjectsCount} Subject{course.subjectsCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <h3 className="font-bold text-white line-clamp-2 text-sm leading-snug group-hover:text-brand-primary transition-colors">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-xs text-white/45 line-clamp-2 mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: course.description }} />
          )}
        </div>

        {/* Progress bar */}
        {pct !== null && pct > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/40">{progress.completedCount}/{progress.totalChapters} chapters</span>
              <span className="font-bold text-brand-primary">{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Play size={10} />
            <span>{pct > 0 ? "Continue learning" : "Start course"}</span>
          </div>
          <ChevronRight size={13} className="text-white/30 group-hover:text-brand-primary transition-colors" />
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentCourses() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    getPublicExamCategories()
      .then((res) => { if (active) setCategories(res?.categories || []); })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
    return () => { active = false; };
  }, []);

  const fetchCourses = useCallback(async (examId) => {
    if (!examId) return;
    setLoadingCourses(true);
    try {
      const res = await getPublicCourses(50, examId);
      const fetched = res?.courses || [];
      setCourses(fetched);
      if (fetched.length > 0) {
        const prog = await getMultipleCourseProgress(fetched.map((c) => c._id));
        setCourseProgress(prog);
      }
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    if (selectedExamId) fetchCourses(selectedExamId);
    else setCourses([]);
  }, [selectedExamId, fetchCourses]);

  const currentCategory = categories.find((c) => c._id === selectedCategoryId);
  const currentExam = currentCategory?.exams?.find((e) => e._id === selectedExamId);
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  // Drill level: 0 = categories, 1 = exams, 2 = courses
  const level = !selectedCategoryId ? 0 : !selectedExamId ? 1 : 2;

  const totalExams = categories.reduce((sum, c) => sum + (c.exams?.length || 0), 0);

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen pb-16">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden border-b border-white/5">
          <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-brand-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-brand-primary/10 blur-3xl" />
          <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/60">
              <Sparkles size={12} className="text-brand-primary" />
              Expert-crafted learning
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">
              Course <span className="bg-linear-to-r from-brand-primary to-emerald-400 bg-clip-text text-transparent">Library</span>
            </h1>
            <p className="mt-2 text-sm text-gray-400 md:text-base max-w-xl">
              Structured courses with notes, video lectures, and practice tests — all in one place. Pick an exam and start learning.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatPill icon={<Tag size={14} />} label="Categories" value={loadingCats ? "—" : categories.length} />
              <StatPill icon={<GraduationCap size={14} />} label="Exams" value={loadingCats ? "—" : totalExams} />
              <StatPill icon={<BookMarked size={14} />} label="Courses" value={level === 2 ? courses.length : "—"} />
              <StatPill icon={<CheckCircle2 size={14} />} label="Progress" value={level === 2 ? `${Object.values(courseProgress).filter(p => p.percentage === 100).length} done` : "—"} />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">

          {/* Breadcrumb */}
          {level > 0 && (
            <div className="flex items-center gap-2 text-sm mb-6 rounded-2xl border border-white/8 bg-white/2 px-4 py-2.5">
              <button
                onClick={() => { setSelectedCategoryId(null); setSelectedExamId(null); setCourses([]); }}
                className="text-brand-primary hover:opacity-80 font-semibold transition"
              >
                All Categories
              </button>
              {level >= 1 && (
                <>
                  <ChevronRight size={14} className="text-white/30" />
                  <button
                    onClick={level > 1 ? () => { setSelectedExamId(null); setCourses([]); } : undefined}
                    className={level > 1 ? "text-white/50 hover:text-white transition-colors" : "text-white font-semibold"}
                  >
                    {currentCategory?.title}
                  </button>
                </>
              )}
              {level >= 2 && (
                <>
                  <ChevronRight size={14} className="text-white/30" />
                  <span className="text-white font-semibold">{currentExam?.title}</span>
                </>
              )}
            </div>
          )}

          {/* Level label */}
          {!loadingCats && (
            <div className="flex items-center gap-2 mb-5">
              {level === 0 && <><Tag size={16} className="text-brand-primary" /><h2 className="text-base font-bold text-white">Exam Categories</h2><span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/40">{categories.length}</span></>}
              {level === 1 && <><GraduationCap size={16} className="text-brand-primary" /><h2 className="text-base font-bold text-white">Exams in {currentCategory?.title}</h2><span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/40">{currentCategory?.exams?.length || 0}</span></>}
              {level === 2 && <><BookOpen size={16} className="text-brand-primary" /><h2 className="text-base font-bold text-white">Courses — {currentExam?.title}</h2></>}
            </div>
          )}

          {/* Loading state for categories */}
          {loadingCats ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 size={28} className="animate-spin text-brand-primary" />
            </div>
          ) : (
            <>
              {/* Level 0: Category cards */}
              {level === 0 && (
                categories.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10">
                    <BookOpen size={32} className="text-white/15" />
                    <p className="text-sm text-white/40">No exam categories available yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((cat, idx) => (
                      <CategoryCard key={cat._id} category={cat} idx={idx} onClick={() => setSelectedCategoryId(cat._id)} />
                    ))}
                  </div>
                )
              )}

              {/* Level 1: Exam cards */}
              {level === 1 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(currentCategory?.exams || []).length === 0 ? (
                    <div className="col-span-full flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10">
                      <GraduationCap size={32} className="text-white/15" />
                      <p className="text-sm text-white/40">No exams in this category yet</p>
                    </div>
                  ) : (
                    (currentCategory?.exams || []).map((exam, idx) => (
                      <ExamCard key={exam._id} exam={exam} idx={idx} onClick={() => setSelectedExamId(exam._id)} />
                    ))
                  )}
                </div>
              )}

              {/* Level 2: Course cards */}
              {level === 2 && (
                <div className="space-y-5">
                  {/* Search */}
                  <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 max-w-sm">
                    <Search size={15} className="text-white/40 shrink-0" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search courses..."
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                    />
                  </div>

                  {loadingCourses ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden animate-pulse">
                          <div className="h-40 bg-white/3" />
                          <div className="p-5 space-y-3">
                            <div className="h-4 bg-white/5 rounded w-3/4" />
                            <div className="h-3 bg-white/3 rounded w-full" />
                            <div className="h-3 bg-white/3 rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10">
                      <BookOpen size={32} className="text-white/15" />
                      <p className="text-sm text-white/40">
                        {courses.length === 0 ? "No courses available for this exam yet" : "No courses match your search"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredCourses.map((course) => (
                        <CourseCard
                          key={course._id}
                          course={course}
                          progress={courseProgress[course._id]}
                          onClick={() => navigate(`/student/courses/${course._id}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
