import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseById } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { ChevronLeft, Play, Clock, Users, Star, Lock, BookOpen, Zap, ChevronDown } from "lucide-react";

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await getCourseById(courseId);
        setCourse(res.course);
      } catch (err) {
        console.error("Failed to fetch course:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className="flex items-center justify-center h-screen bg-dark-400">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-white/50">Loading course...</p>
          </div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <StudentNavbar />
        <div className="flex items-center justify-center h-screen bg-dark-400">
          <p className="text-gray-400">Course not found</p>
        </div>
      </>
    );
  }

  const totalSections = course.sections?.length || 0;
  const totalVideos = course.sections?.reduce((sum, s) => sum + (s.videos?.length || 0), 0) || 0;

  return (
    <>
      <StudentNavbar />
      <div className="bg-dark-400 min-h-screen">
        {/* HERO SECTION */}
        <div className="bg-dark-300 border-b border-dark-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm mb-4"
            >
              <ChevronLeft size={18} />
              Back
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* LEFT: Thumbnail */}
              <div className="md:col-span-1">
                <div className="relative w-full aspect-video bg-dark-200 rounded-lg overflow-hidden flex items-center justify-center mb-4">
                  {course.thumbnail?.url ? (
                    <img src={course.thumbnail.url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-6xl opacity-20">📚</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play size={48} className="text-white/70" fill="white" />
                  </div>
                </div>

                {/* QUICK STATS */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={16} />
                    <span>{totalVideos} video lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <BookOpen size={16} />
                    <span>{totalSections} modules</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users size={16} />
                    <span>{(course.students || 0).toLocaleString()} students</span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Info */}
              <div className="md:col-span-2">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{course.title}</h1>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed">{course.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 whitespace-nowrap flex items-center gap-1 ${
                      course.isPaid
                        ? "bg-dark-400 text-white border border-dark-100"
                        : "bg-brand-primary/15 text-brand-primary border border-brand-primary/30"
                    }`}
                  >
                    {course.isPaid ? (
                      <>
                        <Lock size={13} />
                        Premium
                      </>
                    ) : (
                      <>
                        <Zap size={13} />
                        Free
                      </>
                    )}
                  </span>
                </div>

                {/* RATING & PRICE */}
                <div className="flex items-center justify-between py-4 border-t border-dark-100 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.floor(course.rating || 4) ? "fill-brand-primary text-brand-primary" : "text-gray-600"}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-white">{(course.rating || 4).toFixed(1)}</span>
                    <span className="text-xs text-gray-500">(1,234 reviews)</span>
                  </div>

                  {course.isPaid && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">Subscription required</p>
                      <p className="text-lg font-bold text-brand-primary">₹{course.price}</p>
                    </div>
                  )}
                </div>

                {/* CTA BUTTONS */}
                <div className="flex gap-3">
                  <button className="flex-1 py-3 px-4 bg-brand-primary text-dark-400 rounded-lg font-bold hover:opacity-90 transition flex items-center justify-center gap-2">
                    <Play size={16} fill="currentColor" />
                    {course.isPaid ? "Unlock Course" : "Start Learning"}
                  </button>
                  <button className="px-4 py-3 bg-dark-200 text-white border border-dark-100 rounded-lg hover:border-brand-primary/30 transition">
                    <BookOpen size={18} />
                  </button>
                </div>

                {/* TAGS */}
                {course.tags?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-dark-100">
                    <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-semibold">Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-dark-300 text-gray-300 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CURRICULUM */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Course Curriculum</h2>

            <div className="space-y-3">
              {course.sections?.map((section, sectionIdx) => (
                <div key={section._id} className="bg-dark-200 border border-dark-100 rounded-lg overflow-hidden">
                  {/* SECTION HEADER */}
                  <button
                    onClick={() =>
                      setExpandedSection(expandedSection === section._id ? null : section._id)
                    }
                    className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-dark-300/50 transition"
                  >
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-white text-sm md:text-base">
                        Module {sectionIdx + 1}: {section.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {section.videos?.length || 0} videos {section.notes?.length ? `• ${section.notes.length} notes` : ""}
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-gray-500 transition-transform ${
                        expandedSection === section._id ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* SECTION CONTENT */}
                  {expandedSection === section._id && (
                    <div className="bg-dark-300/50 border-t border-dark-100 px-4 md:px-6 py-4 space-y-2">
                      {/* VIDEOS */}
                      {section.videos?.map((video, vidIdx) => (
                        <div key={vidIdx} className="flex items-center gap-3 py-2 text-sm">
                          <Play size={14} className="text-brand-primary flex-shrink-0" />
                          <span className="text-gray-300 flex-1 truncate">{video.title}</span>
                          <span className="text-xs text-gray-500">5:30</span>
                        </div>
                      ))}

                      {/* NOTES */}
                      {section.notes?.map((note, noteIdx) => (
                        <div key={noteIdx} className="flex items-center gap-3 py-2 text-sm">
                          <BookOpen size={14} className="text-blue-400 flex-shrink-0" />
                          <span className="text-gray-300 flex-1 truncate">{note.title || "Study Notes"}</span>
                          <span className="text-xs text-gray-500">PDF</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ABOUT SECTION */}
          <div className="bg-dark-200 border border-dark-100 rounded-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-4">About This Course</h2>
            <div className="space-y-4 text-sm text-gray-300">
              <p>
                This comprehensive course covers {course.title} from fundamentals to advanced concepts. Perfect for
                students preparing for professional exams and career advancement.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Difficulty</p>
                  <p className="text-white font-medium">Intermediate</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Duration</p>
                  <p className="text-white font-medium">6-8 weeks</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Language</p>
                  <p className="text-white font-medium">English</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Certificate</p>
                  <p className="text-white font-medium">{course.isPaid ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
