import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseById, deleteSection } from "../../services/teacherService";
import { ArrowLeft, Trash2, Plus, ChevronDown, ChevronUp, Eye, FileText, Video, Lock, Unlock, Play } from "lucide-react";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedVideo, setExpandedVideo] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, sectionId: null });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await getCourseById(courseId);
        setCourse(res.course);
      } catch (err) {
        setError(err.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleDeleteSection = async () => {
    try {
      await deleteSection(courseId, deleteModal.sectionId);
      setCourse((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s._id !== deleteModal.sectionId),
      }));
      setDeleteModal({ isOpen: false, sectionId: null });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddSection = () => {
    navigate(`/teacher/courses/${courseId}/edit-curriculum`);
  };

  // ✅ Extract YouTube embed URL from various formats
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    let videoId = null;
    
    // Format: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
    
    // Format: https://www.youtube.com/embed/VIDEO_ID
    const embedMatch = url.match(/youtube\.com\/embed\/([^/?]+)/);
    if (embedMatch) {
      videoId = embedMatch[1];
    }
    
    // Format: https://youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^/?]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-white text-lg">Loading course...</div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-grayCustom-medium text-lg">Course not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-300">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/teacher/courses")}
          className="flex items-center gap-2 text-brand-primary hover:opacity-80 mb-6 transition"
        >
          <ArrowLeft size={18} />
          Back to Courses
        </button>

        {/* Course Basics Section - VIEW ONLY */}
        <div className="bg-dark-200 border border-dark-100 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Course Overview</h2>

          <div className="flex gap-6">
            <div className="w-40 h-40 rounded-lg overflow-hidden bg-dark-300 border border-white/5 flex-shrink-0">
              {course.thumbnail?.url ? (
                <img src={course.thumbnail.url} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Eye size={40} className="text-white/10" /></div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{course.title}</h1>
                <p className="text-base text-grayCustom-medium mt-2">{course.description}</p>
              </div>

              {course.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="bg-dark-100 p-3 rounded-lg">
                  <p className="text-xs text-grayCustom-medium/70">Status</p>
                  <p className={`font-semibold mt-1 ${course.status === "pending" ? "text-yellow-400" : "text-green-400"}`}>
                    {course.status}
                  </p>
                </div>
                <div className="bg-dark-100 p-3 rounded-lg">
                  <p className="text-xs text-grayCustom-medium/70">Type</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {course.isPaid ? (
                      <>
                        <Lock size={14} className="text-red-400" />
                        <span className="font-semibold text-red-400">Paid</span>
                      </>
                    ) : (
                      <>
                        <Unlock size={14} className="text-green-400" />
                        <span className="font-semibold text-green-400">Free</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-dark-100 p-3 rounded-lg">
                  <p className="text-xs text-grayCustom-medium/70">Sections</p>
                  <p className="font-semibold mt-1 text-white">{course.sections?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curriculum Section */}
        <div className="bg-dark-200 border border-dark-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              Curriculum ({course.sections?.length || 0} sections)
            </h2>
            <button
              onClick={handleAddSection}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-black rounded-lg font-medium hover:brightness-110 transition"
            >
              <Plus size={16} />
              Add Section
            </button>
          </div>

          {course.sections && course.sections.length > 0 ? (
            <div className="space-y-3">
              {course.sections.map((section) => (
                <div key={section._id} className="bg-dark-100 border border-dark-100 rounded-lg overflow-hidden">
                  {/* Section Header */}
                  <button
                    onClick={() =>
                      setExpandedSection(expandedSection === section._id ? null : section._id)
                    }
                    className="w-full flex items-center justify-between p-4 hover:bg-dark-200 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <span className="text-lg font-semibold text-white">{section.title}</span>
                      <span className="text-xs text-grayCustom-medium/70">
                        {section.videos?.length || 0} videos
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ isOpen: true, sectionId: section._id });
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                      {expandedSection === section._id ? (
                        <ChevronUp size={20} className="text-grayCustom-medium" />
                      ) : (
                        <ChevronDown size={20} className="text-grayCustom-medium" />
                      )}
                    </div>
                  </button>

                  {/* Section Details (Expanded) */}
                  {expandedSection === section._id && (
                    <div className="bg-dark-200 border-t border-dark-100 p-5 space-y-6 animate-in fade-in duration-200">
                      {section.description && (
                        <div>
                          <p className="text-sm font-medium text-white mb-1">Description</p>
                          <p className="text-sm text-grayCustom-medium">{section.description}</p>
                        </div>
                      )}

                      {/* Videos Grid with Previews */}
                      {section.videos && section.videos.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                            <Video size={14} className="text-brand-primary" />
                            Videos ({section.videos.length})
                          </p>
                          <div className="space-y-4">
                            {section.videos.map((video, idx) => {
                              const embedUrl = getYouTubeEmbedUrl(video.url);
                              const isExpanded = expandedVideo === `${section._id}-${idx}`;

                              return (
                                <div key={idx} className="bg-dark-100 rounded-lg overflow-hidden border border-dark-100 hover:border-brand-primary/30 transition-all">
                                  {/* Video Header */}
                                  <button
                                    onClick={() => setExpandedVideo(isExpanded ? null : `${section._id}-${idx}`)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-dark-200 transition-all"
                                  >
                                    <div className="flex items-center gap-3 flex-1 text-left min-w-0">
                                      <Play size={16} className="text-brand-primary flex-shrink-0" fill="currentColor" />
                                      <div className="min-w-0">
                                        <p className="font-medium text-white truncate">{video.title}</p>
                                        <p className="text-xs text-grayCustom-medium/70 truncate">{video.url}</p>
                                      </div>
                                    </div>
                                    <span className="text-sm text-grayCustom-medium flex-shrink-0 ml-4">
                                      {isExpanded ? '−' : '+'}
                                    </span>
                                  </button>

                                  {/* Video Preview */}
                                  {isExpanded && (
                                    <div className="border-t border-dark-100 p-4 bg-dark-300/50 animate-in slide-in-from-top-2 duration-200">
                                      {embedUrl ? (
                                        <div className="space-y-3">
                                          <div className="aspect-video rounded-lg overflow-hidden bg-black border border-white/5 shadow-lg">
                                            <iframe
                                              src={embedUrl}
                                              title={video.title}
                                              className="w-full h-full"
                                              allowFullScreen
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            />
                                          </div>
                                          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                                            <span>✓ Video preview available</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="aspect-video rounded-lg bg-dark-200 border border-dashed border-white/10 flex flex-col items-center justify-center text-white/40">
                                          <Video size={32} className="mb-2" />
                                          <p className="text-xs font-medium">Invalid YouTube URL</p>
                                          <p className="text-[10px] text-white/30 mt-1">Supported formats: youtube.com, youtu.be, embed</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {!section.description && (!section.videos || section.videos.length === 0) && (
                        <p className="text-grayCustom-medium text-sm">No content added yet</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="bg-dark-100 rounded-full p-4">
                  <FileText size={32} className="text-grayCustom-medium" />
                </div>
              </div>
              <p className="text-grayCustom-medium mb-4">No sections added yet</p>
              <button
                onClick={handleAddSection}
                className="px-5 py-2 bg-brand-primary text-black rounded-lg font-medium hover:brightness-110 transition"
              >
                Add First Section
              </button>
            </div>
          )}
        </div>

        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, sectionId: null })}
          onConfirm={handleDeleteSection}
          title="Delete Section"
          message="Are you sure you want to delete this section? All videos will be permanently removed."
        />
      </div>
    </div>
  );
}