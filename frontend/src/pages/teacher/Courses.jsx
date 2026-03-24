import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCourses, deleteCourse } from "../../services/teacherService";
import { Trash2, Plus, Eye, Layers, Lock, Unlock, Tag } from "lucide-react";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, courseId: null });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await getMyCourses();
      setCourses(res.courses || []);
    } catch (err) {
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleDelete = async () => {
    try {
      await deleteCourse(deleteModal.courseId);
      setCourses((prev) => prev.filter((c) => c._id !== deleteModal.courseId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteModal({ isOpen: false, courseId: null });
    }
  };

  if (loading) return <div className="text-white text-center py-20 animate-pulse">Loading workspace...</div>;
  if (error) return <div className="text-red-400 text-center py-20">{error}</div>;

  return (
    <div className="max-w-[1300px] mx-auto px-4 pb-12">
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">My Courses</h2>
          <p className="text-sm text-white/60 mt-1">Manage your curriculum and track student progress.</p>
        </div>
        <button
          onClick={() => navigate("/teacher/upload/basics")}
          className="flex items-center justify-center gap-2 bg-brand-primary text-black px-5 py-2.5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-primary/10"
        >
          <Plus size={20} /> Create New Course
        </button>
      </header>

      {/* GRID SYSTEM */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-dark-200/50 border border-dashed border-dark-100 rounded-3xl">
          <div className="w-16 h-16 bg-dark-100 rounded-full flex items-center justify-center mb-4">
            <Layers className="text-white/20" size={32} />
          </div>
          <p className="text-white/60 mb-6 text-lg">You haven't created any courses yet.</p>
          <button
            onClick={() => navigate("/teacher/upload/basics")}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="group bg-dark-200 border border-white/5 rounded-xl overflow-hidden hover:border-brand-primary/30 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full shadow-lg shadow-black/30"
            >
              {/* THUMBNAIL */}
              <div className="aspect-video bg-dark-300 relative overflow-hidden">
                {course.thumbnail?.url ? (
                  <img
                    src={course.thumbnail.url}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Eye size={32} className="text-white/10" />
                  </div>
                )}
                {/* STATUS BADGE */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-lg ${
                    course.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/20"
                      : "bg-brand-primary/20 text-brand-primary border border-brand-primary/20"
                  }`}>
                    {course.status}
                  </span>
                </div>
              </div>

              {/* CARD CONTENT */}
              <div className="p-4 flex flex-col flex-1">
                <div className="mb-3 flex-1">
                  <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-brand-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-white/50 mt-1 line-clamp-1">
                    {course.description || "No description"}
                  </p>
                </div>

                {/* METADATA GRID */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-2 mb-3 p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Type</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {course.isPaid ? (
                        <>
                          <Lock size={10} className="text-red-400" />
                          <span className="text-xs font-medium text-red-400">Paid</span>
                        </>
                      ) : (
                        <>
                          <Unlock size={10} className="text-green-400" />
                          <span className="text-xs font-medium text-green-400">Free</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Sections</span>
                    <span className="text-xs font-medium text-white/90">{course.sections?.length || 0}</span>
                  </div>
                </div>

                {/* TAGS */}
                {course.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {course.tags.slice(0, 1).map((tag, idx) => (
                      <span key={idx} className="flex items-center gap-0.5 text-[9px] bg-dark-300 text-white/60 px-1.5 py-0.5 rounded border border-white/5">
                        <Tag size={8} /> {tag}
                      </span>
                    ))}
                    {course.tags.length > 1 && (
                      <span className="text-[9px] text-white/30">+{course.tags.length - 1}</span>
                    )}
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex items-center gap-2 mt-auto">
                  <button
                    onClick={() => navigate(`/teacher/courses/${course._id}`)}
                    className="flex-1 px-3 py-2 bg-brand-primary text-black rounded-lg hover:brightness-110 transition font-bold text-xs"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, courseId: course._id })}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition border border-red-500/10 hover:scale-105"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, courseId: null })}
        onConfirm={handleDelete}
        title="Delete Course"
        message="This action is permanent. All course content, videos, and analytics will be wiped."
      />
    </div>
  );
}