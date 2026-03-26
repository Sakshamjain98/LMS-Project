import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCourses } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { Search, Filter, ChevronDown, Clock, Users, Star, Lock, Unlock, PlayCircle } from "lucide-react";

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await getAllCourses();
        setCourses(res.courses || []);
        setFilteredCourses(res.courses || []);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    let filtered = courses;

    if (selectedFilter === "free") {
      filtered = filtered.filter(c => !c.isPaid);
    } else if (selectedFilter === "paid") {
      filtered = filtered.filter(c => c.isPaid);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  }, [searchQuery, selectedFilter, courses]);

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className="flex h-screen items-center justify-center bg-dark-400">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
            <p className="text-white/50">Loading courses...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen bg-dark-400">
        
        {/* HEADER */}
        <div className="border-b border-dark-100 bg-dark-300">
          <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-10">
            <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Explore Catalog</h1>
            <p className="text-sm text-gray-400 md:text-base">Browse our complete collection of educational modules.</p>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="sticky top-0 z-30 border-b border-dark-100 bg-dark-400/95 py-4 backdrop-blur-md">
          <div className="mx-auto max-w-[1400px] px-4 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by course title or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-dark-100 bg-dark-200 py-3 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="relative w-full md:w-56">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex w-full items-center justify-between rounded-xl border border-dark-100 bg-dark-200 px-4 py-3 text-sm font-medium text-white transition hover:border-brand-primary/30"
                >
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-brand-primary" />
                    <span>
                      {selectedFilter === "all" ? "All Formats" : selectedFilter === "free" ? "Free Only" : "Premium Only"}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${showFilterDropdown ? "rotate-180" : ""}`} />
                </button>

                {showFilterDropdown && (
                  <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-dark-100 bg-dark-300 shadow-xl z-40">
                    {[
                      { id: "all", label: "All Formats" },
                      { id: "free", label: "Free Courses" },
                      { id: "paid", label: "Premium Courses" }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedFilter(option.id);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition ${
                          selectedFilter === option.id
                            ? "bg-brand-primary/10 font-medium text-brand-primary"
                            : "text-gray-300 hover:bg-dark-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COURSES GRID */}
        <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
          {filteredCourses.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-dark-300 text-gray-500">
                <Search size={28} />
              </div>
              <p className="mb-2 text-lg font-medium text-white">No courses found</p>
              <p className="text-sm text-gray-400">Try adjusting your search terms or clearing the filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCourses.map((course) => (
                <CourseCard key={course._id} course={course} navigate={navigate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// EXTRACTED COMPONENT
function CourseCard({ course, navigate }) {
  // Safe calculations
  const totalModules = course.sections?.length || 0;
  const rating = course.rating || 4.5;
  const students = course.students || 0;

  return (
    <div
      onClick={() => navigate(`/student/courses/${course._id}`)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-dark-100 bg-dark-200 transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
    >
      {/* THUMBNAIL AREA */}
      <div className="relative aspect-video w-full overflow-hidden bg-dark-300">
        {course.thumbnail?.url ? (
          <img
            src={course.thumbnail.url}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-dark-100">
            <PlayCircle size={48} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/40" />

        {/* PRICE BADGE */}
        <div className="absolute right-3 top-3">
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              course.isPaid
                ? "bg-dark-400/90 text-white backdrop-blur-sm"
                : "bg-brand-primary text-dark-400"
            }`}
          >
            {course.isPaid ? <><Lock size={10} /> Premium</> : <><Unlock size={10} /> Free</>}
          </span>
        </div>
      </div>

      {/* CARD CONTENT */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 min-h-[40px] text-base font-bold text-white transition-colors group-hover:text-brand-primary">
          {course.title}
        </h3>

        <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-400">
          {course.description || "Learn the comprehensive fundamentals and advanced concepts in this module."}
        </p>

        {/* METRICS ROW */}
        <div className="mt-5 flex items-center justify-between border-t border-dark-100 pt-4 text-xs font-medium text-gray-400">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-brand-primary/70" />
            <span>{totalModules} Modules</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-brand-primary/70" />
            <span>{students.toLocaleString()} Students</span>
          </div>
        </div>

        {/* RATING & ACTION ROW */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star size={14} className="fill-brand-primary text-brand-primary" />
            <span className="text-sm font-bold text-white">{rating.toFixed(1)}</span>
          </div>
          
          <span className="text-sm font-bold text-brand-primary transition-transform group-hover:translate-x-1">
            Start Learning →
          </span>
        </div>
      </div>
    </div>
  );
}