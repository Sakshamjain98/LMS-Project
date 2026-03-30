import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseById, getStudentSubscription } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { 
  ChevronLeft, Play, Clock, Users, Star, Lock, 
  BookOpen, Zap, ChevronDown, ChevronUp, FileText, CheckCircle2 
} from "lucide-react";

const getEmbedUrl = (url) => {
  if (!url) return "";
  if (url.includes("embed/")) return url;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^?&]*)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    localStorage.getItem("subscriptionStatus") || "FREE"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // LMS State
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeSectionId, setActiveSectionId] = useState(null);

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await getStudentSubscription();
        const plan = res?.plan || "FREE";
        const active = res?.status === "ACTIVE" && plan !== "FREE";
        setSubscriptionStatus(plan);
        setIsSubscribed(active);
        localStorage.setItem("subscriptionStatus", active ? plan : "FREE");
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
        const stored = localStorage.getItem("subscriptionStatus");
        setIsSubscribed(stored && stored !== "FREE" && stored !== "null");
      }
    };
    fetchSubscription();
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await getCourseById(courseId);
        const fetchedCourse = res.course;
        setCourse(fetchedCourse);

        // Auto-select first module & first video if accessible
        if (fetchedCourse?.sections?.length > 0) {
          const firstSection = fetchedCourse.sections[0];
          setExpandedSections(new Set([firstSection._id]));
          
          if (firstSection.videos?.length > 0) {
            setActiveVideo(firstSection.videos[0]);
            setActiveSectionId(firstSection._id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch course:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  // Determine if the whole course is accessible
  const isCourseAccessible = !course?.isPaid || isSubscribed;

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const handleVideoSelect = (video, sectionId) => {
    if (!isCourseAccessible) return; // prevent selection if locked
    setActiveVideo(video);
    setActiveSectionId(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className="flex h-screen items-center justify-center bg-dark-400">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
            <p className="text-white/50">Loading course environment...</p>
          </div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <StudentNavbar />
        <div className="flex h-screen items-center justify-center bg-dark-400">
          <p className="text-gray-400">Course not found</p>
        </div>
      </>
    );
  }

  const activeSectionData = course.sections?.find(s => s._id === activeSectionId);

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen bg-dark-400 pb-12">
        
        {/* TOP HEADER - Sticky Name */}
        <div className="sticky top-0 z-40 border-b border-dark-100 bg-dark-300/95 py-4 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 md:px-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-gray-400 transition hover:text-white"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-6 w-px bg-dark-100"></div>
            <h1 className="truncate text-lg font-bold text-white md:text-xl">
              {course.title}
            </h1>
            {course.isPaid && !isSubscribed && (
              <div className="ml-auto flex items-center gap-1 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                <Lock size={12} /> Premium
              </div>
            )}
          </div>
        </div>

        {/* LMS MAIN LAYOUT */}
        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            
            {/* LEFT COLUMN: Video Player & Notes (70%) */}
            <div className="flex-1 space-y-6 lg:min-w-[65%]">
              
              {/* VIDEO PLAYER SECTION */}
              <div className="overflow-hidden rounded-xl border border-dark-100 bg-dark-300 shadow-lg">
                <div className="relative aspect-video w-full bg-black">
                  {!isCourseAccessible ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-400/95 backdrop-blur-sm z-10">
                      <Lock size={48} className="mb-4 text-gray-500" />
                      <p className="text-white text-center px-4">
                        This is a premium course. Subscribe to unlock full access.
                      </p>
                      <button
                        onClick={() => navigate("/#pricing")}
                        className="mt-4 rounded-lg bg-brand-primary px-6 py-2 text-dark-400 font-bold hover:opacity-90 transition"
                      >
                        Subscribe Now
                      </button>
                    </div>
                  ) : activeVideo ? (
                    <iframe
                      src={getEmbedUrl(activeVideo.url)}
                      title={activeVideo.title}
                      className="absolute inset-0 h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    ></iframe>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-gray-500">
                      <Play size={48} className="mb-4 opacity-20" />
                      <p>Select a lecture from the curriculum to begin</p>
                    </div>
                  )}
                </div>

                {/* CURRENT LECTURE DETAILS */}
                <div className="p-5 md:p-6">
                  <h2 className="text-2xl font-bold text-white">
                    {activeVideo?.title || "Course Overview"}
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Clock size={16} /> Duration: ~
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={16} /> {course.students?.toLocaleString() || 0} enrolled
                    </span>
                    <span className="flex items-center gap-1.5 text-brand-primary">
                      <Star size={16} className="fill-brand-primary" /> 
                      {(course.rating || 4).toFixed(1)} Rating
                    </span>
                  </div>
                </div>
              </div>

              {/* NOTES SECTION (only shown if accessible) */}
              {isCourseAccessible && activeSectionData?.notes?.length > 0 && (
                <div className="rounded-xl border border-dark-100 bg-dark-300 p-5 md:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <BookOpen className="text-brand-primary" size={20} />
                    <h3 className="text-lg font-bold text-white">Module Resources & Notes</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeSectionData.notes.map((note, idx) => (
                      <a
                        key={idx}
                        href={note.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 rounded-lg border border-dark-100 bg-dark-200 p-4 transition hover:border-brand-primary/30 hover:bg-dark-100"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {note.title || `Resource File ${idx + 1}`}
                          </p>
                          <p className="text-xs text-gray-500 uppercase mt-0.5">{note.fileType || 'Document'}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {/* COURSE DESCRIPTION */}
              <div className="rounded-xl border border-dark-100 bg-dark-300 p-5 md:p-6">
                <h3 className="mb-3 text-lg font-bold text-white">About this course</h3>
                <p className="text-sm leading-relaxed text-gray-300">
                  {course.description}
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: Curriculum Sidebar (30%) */}
            <div className="w-full shrink-0 lg:sticky lg:top-24 lg:w-[320px] xl:w-[380px]">
              <div className="flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-xl border border-dark-100 bg-dark-300 shadow-lg">
                
                <div className="border-b border-dark-100 bg-dark-200 p-4">
                  <h3 className="text-lg font-bold text-white">Course Content</h3>
                  <p className="mt-1 text-xs text-gray-400">
                    {course.sections?.length || 0} Modules • {" "}
                    {course.sections?.reduce((acc, s) => acc + (s.videos?.length || 0), 0) || 0} Lectures
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {course.sections?.map((section, sectionIdx) => {
                    const isExpanded = expandedSections.has(section._id);
                    
                    return (
                      <div key={section._id} className="border-b border-dark-100 last:border-0">
                        <button
                          onClick={() => toggleSection(section._id)}
                          className={`flex w-full items-center justify-between p-4 transition hover:bg-dark-200 ${
                            isExpanded ? "bg-dark-200" : "bg-dark-300"
                          }`}
                          disabled={!isCourseAccessible && course.isPaid}
                        >
                          <div className="text-left">
                            <h4 className="text-sm font-semibold text-white">
                              Section {sectionIdx + 1}: {section.title}
                            </h4>
                            <p className="mt-1 text-xs text-gray-500">
                              {section.videos?.length || 0} lectures
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-400" />
                          )}
                        </button>

                        {/* LECTURES LIST */}
                        {isExpanded && (
                          <div className="bg-dark-400/50 py-2">
                            {section.videos?.map((video, vidIdx) => {
                              const isActive = activeVideo?._id === video._id || activeVideo?.url === video.url;
                              const isSelectable = isCourseAccessible || !course.isPaid;
                              
                              return (
                                <button
                                  key={vidIdx}
                                  onClick={() => isSelectable && handleVideoSelect(video, section._id)}
                                  disabled={!isSelectable}
                                  className={`group flex w-full items-start gap-3 px-4 py-2.5 text-left transition ${
                                    isActive 
                                      ? "bg-brand-primary/10 text-brand-primary" 
                                      : "text-gray-300 hover:bg-dark-200 hover:text-white"
                                  } ${!isSelectable ? "cursor-not-allowed opacity-50" : ""}`}
                                >
                                  <div className="mt-0.5 shrink-0">
                                    {isActive ? (
                                      <Play size={14} className="fill-brand-primary text-brand-primary" />
                                    ) : (
                                      <CheckCircle2 size={14} className="text-gray-600 group-hover:text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                                      {vidIdx + 1}. {video.title}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                                      <Play size={10} /> Video
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                            
                            {(!section.videos || section.videos.length === 0) && (
                              <div className="px-8 py-3 text-xs italic text-gray-500">
                                No lectures in this module yet.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #13161F; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2A2F42; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00DC82; }
      `}} />
    </>
  );
}