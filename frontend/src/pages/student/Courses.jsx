import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCourses, getFreeCourses, getPaidCourses } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { Search, Filter, ChevronDown, Clock, Users, Star, Lock, Unlock } from "lucide-react";

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

    // Filter by type
    if (selectedFilter === "free") {
      filtered = filtered.filter(c => !c.isPaid);
    } else if (selectedFilter === "paid") {
      filtered = filtered.filter(c => c.isPaid);
    }

    // Filter by search
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
        <div className="flex items-center justify-center h-screen bg-dark-400">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-white/50">Loading courses...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentNavbar />
      <div className="bg-dark-400 min-h-screen">
        {/* HEADER */}
        <div className="bg-dark-300 border-b border-dark-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Explore Courses</h1>
            <p className="text-sm text-gray-400">Browse our complete collection of pharmacy courses</p>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="bg-dark-400 border-b border-dark-100 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-200 border border-dark-100 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm text-white placeholder:text-gray-500 transition"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="relative w-full md:w-48">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="w-full px-4 py-2.5 bg-dark-200 border border-dark-100 rounded-lg hover:border-brand-primary/30 transition flex items-center justify-between text-sm font-medium text-white"
                >
                  <div className="flex items-center gap-2">
                    <Filter size={16} />
                    <span>
                      {selectedFilter === "all" ? "All Courses" : selectedFilter === "free" ? "Free" : "Paid"}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${showFilterDropdown ? "rotate-180" : ""}`} />
                </button>

                {showFilterDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-dark-300 border border-dark-100 rounded-lg shadow-lg z-40">
                    {["all", "free", "paid"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSelectedFilter(option);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition ${
                          selectedFilter === option
                            ? "bg-brand-primary/10 text-brand-primary font-medium"
                            : "text-gray-300 hover:bg-dark-200"
                        }`}
                      >
                        {option === "all" ? "All Courses" : option === "free" ? "Free Courses" : "Paid Courses"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COURSES GRID */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-2">No courses found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course._id} course={course} navigate={navigate} />
              ))}
            </div>
          )}

          {/* RESULTS COUNT */}
          <div className="mt-8 pt-6 border-t border-dark-100 text-sm text-gray-400">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
        </div>
      </div>
    </>
  );
}

// COURSE CARD COMPONENT
function CourseCard({ course, navigate }) {
  return (
    <div
      onClick={() => navigate(`/student/courses/${course._id}`)}
      className="bg-dark-200 border border-dark-100 rounded-lg overflow-hidden hover:border-brand-primary/30 hover:shadow-lg hover:shadow-black/20 transition-all duration-300 cursor-pointer group flex flex-col h-full"
    >
      {/* THUMBNAIL */}
      <div className="relative h-40 bg-dark-300 overflow-hidden flex items-center justify-center">
        {course.thumbnail?.url ? (
          <img
            src={course.thumbnail.url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-4xl opacity-30">📚</div>
        )}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />

        {/* BADGE */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
              course.isPaid
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "bg-green-500/20 text-green-300 border border-green-500/30"
            }`}
          >
            {course.isPaid ? (
              <>
                <Lock size={12} />
                Paid
              </>
            ) : (
              <>
                <Unlock size={12} />
                Free
              </>
            )}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 flex flex-col flex-1">
        {/* TITLE */}
        <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-primary transition h-9">
          {course.title}
        </h3>

        {/* DESCRIPTION */}
        <p className="text-xs text-gray-400 line-clamp-2 mb-4 flex-1">
          {course.description || "No description available"}
        </p>

        {/* META INFO */}
        <div className="flex items-center justify-between gap-3 py-3 border-t border-dark-100 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Clock size={13} />
            <span>{course.sections?.length || 0} modules</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={13} />
            <span>{(course.students || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* RATING */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < Math.floor(course.rating || 4) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-white">{(course.rating || 4).toFixed(1)}</span>
        </div>

        {/* CTA BUTTON */}
        <button className="w-full py-2 px-3 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-dark-400 rounded-lg text-xs font-bold transition-colors">
          View Course
        </button>
      </div>
    </div>
  );
}
