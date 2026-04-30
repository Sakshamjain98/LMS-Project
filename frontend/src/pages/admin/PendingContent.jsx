import { useEffect, useMemo, useState } from "react";
import { getPendingContent, approveCourse, rejectCourse } from "../../services/adminService";
import { 
  CheckCircle, XCircle, BookOpen, FileText, User, IndianRupee, 
  Loader2, ArrowLeft, Layers, Play, Eye, Unlock, Lock, Info, Search
} from "lucide-react";
import toast from "react-hot-toast";

export default function PendingContent() {
  const [pendingCourses, setPendingCourses] = useState([]);
  const [pendingBlogs, setPendingBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null); // For Detail View
  const [processingId, setProcessingId] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [filters, setFilters] = useState({ type: "courses", search: "" });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
    setSelectedCourse(null);
  }, [filters.type, limit]);

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, debouncedSearch, page, limit]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await getPendingContent({
        type: filters.type,
        search: debouncedSearch,
        page,
        limit,
      });
      setPendingCourses(res.content.pendingCourses || []);
      setPendingBlogs(res.content.pendingBlogs || []);
      setPagination(res.pagination || pagination);
    } catch {
      toast.error("Failed to load pending content");
    } finally {
      setLoading(false);
    }
  };

  const summaryText = useMemo(() => {
    if (!pagination.total) return "No records found";
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `Showing ${start}-${end} of ${pagination.total}`;
  }, [pagination]);

  const handleApprove = async (courseId) => {
    setProcessingId(courseId);
    try {
      await approveCourse(courseId);
      toast.success("Course approved successfully");
      setSelectedCourse(null);
      fetchContent();
    } catch {
      toast.error("Failed to approve course");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (courseId) => {
    setProcessingId(courseId);
    try {
      await rejectCourse(courseId);
      toast.success("Course rejected");
      setSelectedCourse(null);
      fetchContent();
    } catch {
      toast.error("Failed to reject course");
    } finally {
      setProcessingId(null);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
        <span className="text-grayCustom-medium font-medium">Loading review queue...</span>
      </div>
    );
  }

  // --- DETAIL VIEW RENDER ---
  if (selectedCourse) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button 
          onClick={() => setSelectedCourse(null)}
          className="flex items-center gap-2 text-brand-primary mb-6 hover:underline font-bold"
        >
          <ArrowLeft size={18} /> Back to Queue
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Detailed Info & Curriculum */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-200 border border-dark-100 rounded-2xl p-8">
              <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl font-bold text-white">{selectedCourse.title}</h1>
                <div className="flex items-center gap-2 bg-dark-300 px-4 py-2 rounded-xl border border-white/5">
                   {selectedCourse.isPaid ? <Lock size={16} className="text-red-400" /> : <Unlock size={16} className="text-green-400" />}
                   <span className="text-white font-bold text-sm">{selectedCourse.isPaid ? `₹${selectedCourse.price}` : "Free"}</span>
                </div>
              </div>
              <p className="text-grayCustom-medium leading-relaxed mb-6">{selectedCourse.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {selectedCourse.tags?.map((tag, i) => (
                  <span key={i} className="text-xs bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full border border-brand-primary/20">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Sections Accordion */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers size={20} className="text-brand-primary" /> Curriculum Review
              </h2>
              {selectedCourse.sections?.map((section) => (
                <div key={section._id} className="bg-dark-200 border border-dark-100 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setExpandedSection(expandedSection === section._id ? null : section._id)}
                    className="w-full flex justify-between p-4 bg-dark-100/50 hover:bg-dark-100"
                  >
                    <span className="font-bold text-white">{section.title}</span>
                    <span className="text-xs text-grayCustom-medium">{section.videos?.length || 0} Videos</span>
                  </button>
                  
                  {expandedSection === section._id && (
                    <div className="p-4 space-y-4 animate-in slide-in-from-top-2">
                      {section.videos?.map((vid, idx) => (
                        <div key={idx} className="bg-dark-300 rounded-lg p-4 border border-white/5">
                          <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Play size={14} className="text-brand-primary" /> {vid.title}
                          </p>
                          <div className="aspect-video rounded-lg overflow-hidden bg-black">
                            <iframe 
                              src={getYouTubeEmbedUrl(vid.url)} 
                              className="w-full h-full" 
                              allowFullScreen 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Sticky Action Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
               {/* Thumbnail Preview Card */}
               <div className="bg-dark-200 border border-dark-100 rounded-2xl overflow-hidden shadow-2xl">
                 <div className="aspect-video bg-dark-300 relative">
                   {selectedCourse.thumbnail?.url ? (
                     <img src={selectedCourse.thumbnail.url} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-white/10"><Info size={48}/></div>
                   )}
                 </div>
                 <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center">
                        <User size={20} className="text-brand-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-grayCustom-medium font-bold">Submitted By</p>
                        <p className="text-white font-bold">{selectedCourse.educator?.name || selectedCourse.instructor?.name || "Educator"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleReject(selectedCourse._id)}
                        disabled={processingId === selectedCourse._id}
                        className="flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 font-bold transition-all disabled:opacity-50"
                      >
                        {processingId === selectedCourse._id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(selectedCourse._id)}
                        disabled={processingId === selectedCourse._id}
                        className="flex items-center justify-center gap-2 py-3 bg-brand-primary text-dark-400 rounded-xl hover:brightness-110 font-bold shadow-lg shadow-brand-primary/20 transition-all disabled:opacity-50"
                      >
                        {processingId === selectedCourse._id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        Approve
                      </button>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW RENDER ---
  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-black text-white tracking-tight">Review Queue</h1>
        <p className="text-grayCustom-medium mt-2">Quality control center for community submissions.</p>
      </header>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative min-w-70 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-grayCustom-medium w-4 h-4" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search title or description"
            className="w-full rounded-xl border border-white/10 bg-dark-300/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-grayCustom-medium/70 focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
          />
        </div>
        <select
          value={filters.type}
          onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
          className="rounded-xl border border-white/10 bg-dark-300/70 px-4 py-2.5 text-sm text-white focus:outline-none"
        >
          <option value="courses">Pending Courses</option>
          <option value="blogs">Pending Blogs</option>
        </select>
      </div>

      {filters.type === "courses" ? (
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-orange-500" /> Pending Courses
          </h2>
          <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-1 rounded-full text-xs font-black">
            {pagination.total} TASKS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pendingCourses.map((course) => (
            <div 
              key={course._id} 
              className="bg-dark-200 border border-dark-100 rounded-2xl overflow-hidden hover:border-brand-primary/50 transition-all group cursor-pointer"
              onClick={() => setSelectedCourse(course)}
            >
              <div className="h-40 bg-dark-300 relative">
                {course.thumbnail?.url ? (
                  <img src={course.thumbnail.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Eye className="text-white/5" size={40}/></div>
                )}
                <div className="absolute top-3 left-3 bg-dark-400/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 flex items-center gap-1">
                   <IndianRupee size={12} className="text-brand-primary" />
                   <span className="text-white text-xs font-bold">{course.price}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-white line-clamp-1">{course.title}</h3>
                <p className="text-grayCustom-medium text-xs mt-2 line-clamp-2 italic">"{course.description}"</p>
                <div className="mt-6 flex items-center justify-between">
                   <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                     <User size={12} /> {course.educator?.name || course.instructor?.name || "Educator"}
                   </span>
                   <button className="text-xs bg-white text-black px-4 py-1.5 rounded-lg font-bold hover:bg-brand-primary transition-colors">
                     Review Details
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      ) : (
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="text-brand-primary" /> Pending Blogs
          </h2>
          <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-4 py-1 rounded-full text-xs font-black">
            {pagination.total} TASKS
          </span>
        </div>

        {pendingBlogs.length === 0 ? (
          <div className="bg-dark-200 border border-dark-100 rounded-xl p-10 text-center text-grayCustom-medium">
            No pending blogs found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingBlogs.map((blog) => (
              <div key={blog._id} className="bg-dark-200 border border-dark-100 rounded-xl p-5">
                <h3 className="text-lg font-bold text-white">{blog.title}</h3>
                <p className="text-grayCustom-medium text-sm mt-2 line-clamp-3">{blog.content}</p>
                <p className="text-xs text-grayCustom-medium mt-3">{new Date(blog.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
      )}

      <div className="border border-white/10 px-4 py-3 flex flex-col gap-3 bg-dark-300/30 rounded-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-400">{summaryText}</p>
        <div className="flex items-center justify-end gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={15}>15 / page</option>
            <option value={20}>20 / page</option>
          </select>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrevPage}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-white/80">{pagination.page}/{pagination.totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!pagination.hasNextPage}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}