import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Tag, GraduationCap, ChevronRight, Loader2,
  Lock, DollarSign, Search, BookMarked, CheckCircle2,
} from "lucide-react";
import { getPublicCourses, getMultipleCourseProgress } from "../../services/courseService";
import { getPublicExamCategories } from "../../services/studentService";

function cloudinaryOptimize(url, w = 500, h = 280) {
  if (!url || !url.includes("cloudinary.com/")) return url;
  return url.replace("/upload/", `/upload/w_${w},h_${h},c_fill,q_auto,f_auto/`);
}

function CourseCard({ course, progress, onClick }) {
  const pct = progress?.percentage ?? null;
  const thumbUrl = cloudinaryOptimize(course.thumbnail?.url);
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl border border-white/8 bg-white/2 p-5 text-left transition-all hover:border-brand-primary/30 hover:bg-white/4 hover:shadow-xl hover:shadow-brand-primary/5"
    >
      {/* Thumbnail */}
      <div className="mb-4 overflow-hidden rounded-xl bg-white/3 h-36 relative">
        {thumbUrl ? (
          <img src={thumbUrl} alt={course.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen size={32} className="text-white/15" />
          </div>
        )}
        {course.isPaid ? (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            <DollarSign size={9} /> ₹{course.price}
          </span>
        ) : (
          <span className="absolute top-2 right-2 rounded-full bg-emerald-500/80 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            FREE
          </span>
        )}
        {pct === 100 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-brand-primary px-2 py-0.5">
            <CheckCircle2 size={10} className="text-dark-400" />
            <span className="text-[10px] font-bold text-dark-400">Done</span>
          </div>
        )}
      </div>

      <h3 className="font-bold text-white line-clamp-2 mb-1 group-hover:text-brand-primary transition-colors">
        {course.title}
      </h3>

      {course.description && (
        <p className="text-xs text-white/50 line-clamp-2 mb-2" dangerouslySetInnerHTML={{ __html: course.description }} />
      )}

      {/* Progress bar */}
      {pct !== null && pct > 0 && (
        <div className="mb-3 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/40">{progress.completedCount}/{progress.totalChapters} chapters</span>
            <span className="font-bold text-brand-primary">{pct}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">{course.subjectsCount || 0} subject{course.subjectsCount !== 1 ? "s" : ""}</span>
        <span className="text-xs font-semibold text-brand-primary group-hover:gap-2 flex items-center gap-1 transition-all">
          {pct > 0 ? "Continue" : "Start"} <ChevronRight size={13} />
        </span>
      </div>
    </button>
  );
}

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
      .then((res) => {
        if (!active) return;
        const cats = res?.categories || [];
        setCategories(cats);
        if (cats.length > 0) setSelectedCategoryId(cats[0]._id);
      })
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

      // Fetch progress for all courses in parallel (best-effort)
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

  if (loadingCats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10 md:py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
          <BookMarked size={26} className="text-brand-primary" /> Courses
        </h1>
        <p className="mt-1 text-sm text-white/50">Browse courses by exam category</p>
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => { setSelectedCategoryId(cat._id); setSelectedExamId(null); setCourses([]); }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${selectedCategoryId === cat._id ? "bg-brand-primary text-dark-400" : "border border-white/10 text-white/60 hover:border-brand-primary/30 hover:text-white"}`}
            >
              <Tag size={13} />
              {cat.title}
            </button>
          ))}
        </div>
      )}

      {/* Exam selection or courses */}
      {!selectedExamId ? (
        <div className="space-y-4">
          <p className="text-sm text-white/50">Select an exam to view its courses:</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(currentCategory?.exams || []).map((exam, idx) => {
              const palette = [
                { icon: "bg-sky-500/15 text-sky-400",       border: "hover:border-sky-500/40",    title: "group-hover:text-sky-300" },
                { icon: "bg-violet-500/15 text-violet-400", border: "hover:border-violet-500/40", title: "group-hover:text-violet-300" },
                { icon: "bg-teal-500/15 text-teal-400",     border: "hover:border-teal-500/40",   title: "group-hover:text-teal-300" },
                { icon: "bg-orange-500/15 text-orange-400", border: "hover:border-orange-500/40", title: "group-hover:text-orange-300" },
              ][idx % 4];
              return (
                <button
                  key={exam._id}
                  onClick={() => setSelectedExamId(exam._id)}
                  className={`group rounded-2xl border border-white/8 bg-white/2 p-5 text-left transition-all duration-200 ${palette.border} hover:bg-white/4 hover:shadow-xl hover:-translate-y-0.5`}
                >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${palette.icon}`}>
                    <GraduationCap size={22} />
                  </div>
                  <h3 className={`font-bold text-white text-base transition-colors mb-1 ${palette.title}`}>{exam.title}</h3>
                  {exam.description && <p className="text-xs text-white/50 line-clamp-2 mb-3">{exam.description}</p>}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <BookOpen size={11} />
                      <span>View Courses</span>
                    </div>
                    <ChevronRight size={14} className="text-white/30 group-hover:text-white/60 transition-colors" />
                  </div>
                </button>
              );
            })}
            {(currentCategory?.exams || []).length === 0 && (
              <p className="col-span-full text-sm text-white/40 py-8 text-center">No exams in this category yet</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => { setSelectedExamId(null); setCourses([]); }} className="text-white/50 hover:text-white transition-colors">
              {currentCategory?.title}
            </button>
            <ChevronRight size={14} className="text-white/30" />
            <span className="text-white font-semibold">{currentExam?.title}</span>
          </div>

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
            <div className="flex h-40 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-brand-primary" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/1">
              <BookOpen size={28} className="text-white/20" />
              <p className="text-sm text-white/40">No courses available for this exam yet</p>
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
    </div>
  );
}
