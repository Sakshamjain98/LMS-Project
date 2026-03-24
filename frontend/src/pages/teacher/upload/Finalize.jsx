import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCourse, addSection, addVideoToSection, uploadSectionNotes } from "../../../services/teacherService";
import { UploadContext } from "./UploadContextProvider";
import { Check, AlertCircle, Loader, Video, FileText, Play, Edit2, Lock, Unlock } from "lucide-react";

export default function Finalize() {
  const navigate = useNavigate();
  const { formData, clearFormData } = useContext(UploadContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [expandedModules, setExpandedModules] = useState(new Set([formData?.curriculum?.modules[0]?.id]));
  const [expandedLectures, setExpandedLectures] = useState(new Set());

  useEffect(() => {
    if (!formData?.courseStatus?.basicsCompleted) {
      navigate("/teacher/upload/basics", { replace: true });
      return;
    }
    if (!formData?.courseStatus?.curriculumCompleted) {
      navigate("/teacher/upload/curriculum", { replace: true });
    }
  }, [formData, navigate]);

  const toggleModule = (id) => {
    const newSet = new Set(expandedModules);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedModules(newSet);
  };

  const toggleLecture = (id) => {
    const newSet = new Set(expandedLectures);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedLectures(newSet);
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Validate required fields
      if (!formData.basics.title?.trim()) {
        setError("Course title is required");
        setLoading(false);
        return;
      }

      if (!formData.curriculum.modules || formData.curriculum.modules.length === 0) {
        setError("At least one module is required");
        setLoading(false);
        return;
      }

      const fd = new FormData();
      fd.append("title", formData.basics.title);
      fd.append("description", formData.basics.description || "");
      fd.append("tags", formData.basics.tags?.join(",") || "");
      fd.append("isPaid", formData.pricing.isPaid.toString());
      const price = formData.pricing.isPaid ? 1 : 0;
      fd.append("price", price.toString());
      if (formData.basics.thumbnail) fd.append("thumbnail", formData.basics.thumbnail);

      // Create course
      const courseRes = await createCourse(fd);
      const courseId = courseRes.course._id;

      if (!courseId) {
        setError("Failed to create course - no ID returned");
        setLoading(false);
        return;
      }

      // Process modules and lectures
      for (const module of formData.curriculum.modules) {
        // Validate module has content
        if (!module.title?.trim()) {
          setError("All modules must have a title");
          setLoading(false);
          return;
        }

        if (!module.lectures || module.lectures.length === 0) {
          setError(`Module "${module.title}" must have at least one lecture`);
          setLoading(false);
          return;
        }

        // Create section
        try {
          const sectionRes = await addSection(courseId, { 
            title: module.title.trim(), 
            description: module.description?.trim() || "" 
          });
          
          if (!sectionRes.section || !sectionRes.section._id) {
            setError(`Failed to create section "${module.title}"`);
            setLoading(false);
            return;
          }

          const sectionId = sectionRes.section._id;

          // Add videos to section
          for (const lecture of module.lectures) {
            if (!lecture.title?.trim() || !lecture.videoUrl?.trim()) {
              setError(`Lecture in "${module.title}" must have title and video URL`);
              setLoading(false);
              return;
            }

            try {
              await addVideoToSection(courseId, sectionId, { 
                title: lecture.title.trim(), 
                url: lecture.videoUrl.trim() 
              });
            } catch (videoErr) {
              console.error(`Failed to add video "${lecture.title}":`, videoErr);
              setError(`Failed to add video "${lecture.title}" to section`);
              setLoading(false);
              return;
            }
          }

          // Upload notes if available
          const notesFiles = module.lectures
            .map(l => l.notes?.file)
            .filter(f => f instanceof File);
          
          if (notesFiles.length > 0) {
            try {
              await uploadSectionNotes(courseId, sectionId, notesFiles);
            } catch (notesErr) {
              console.warn("Notes upload failed (non-critical):", notesErr.message);
              // Don't fail the entire publish, notes are optional
            }
          }
        } catch (sectionErr) {
          console.error(`Failed to create section "${module.title}":`, sectionErr);
          setError(`Failed to create section "${module.title}"`);
          setLoading(false);
          return;
        }
      }

      clearFormData();
      navigate("/teacher/upload/success", { state: { courseId } });
    } catch (err) {
      console.error("Publish error:", err);
      setError(err.message || "Publishing failed");
    } finally {
      setLoading(false);
    }
  };

  const { basics, curriculum, pricing } = formData;
  // ✅ FIXED: Handle both 'lectures' and 'lessons' array names
  const totalLectures = curriculum.modules?.reduce((s, m) => s + ((m.lectures || m.lessons)?.length || 0), 0) || 0;
  const totalModules = curriculum.modules?.length || 0;
  
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    // Handle various YouTube URL formats
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

  return (
    <div className="min-h-screen bg-dark-300 text-white font-sans selection:bg-brand-primary selection:text-black">
      <main className="max-w-[1300px] mx-auto px-6 py-12 grid grid-cols-1 xl:grid-cols-3 gap-12">
        
        {/* LEFT COLUMN: CONTENT */}
        <div className="xl:col-span-2 space-y-12">
          
          {/* COURSE HEADER */}
          <div className="flex gap-8">
            <div className="w-40 h-40 rounded-lg overflow-hidden bg-dark-200 border border-white/5 flex-shrink-0">
              {basics.thumbnailPreview ? (
                <img src={basics.thumbnailPreview} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10"><Video size={48} /></div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h1 className="text-2xl font-semibold leading-tight mb-3">{basics.title}</h1>
                <p className="text-sm text-white/50 mb-4 leading-relaxed">{basics.description}</p>
                {basics.tags && basics.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {basics.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs font-medium bg-white/5 text-white/60 px-3 py-1.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {pricing.isPaid ? (
                    <>
                      <Lock size={18} className="text-red-400" />
                      <span className="text-sm font-semibold text-red-400">Paid</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={18} className="text-green-400" />
                      <span className="text-sm font-semibold text-green-400">Free</span>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => navigate("/teacher/upload/basics")} 
                  className="ml-auto p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/40 hover:text-white"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* CURRICULUM */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Course Structure</h2>
              <p className="text-xs text-white/40">{totalModules} modules • {totalLectures} lessons</p>
            </div>

            <div className="space-y-4">
              {curriculum.modules?.map((module, mIdx) => (
                <div key={module.id} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
                  
                  {/* MODULE HEADER */}
                  <button 
                    onClick={() => toggleModule(module.id)} 
                    className="w-full flex items-center justify-between py-3 group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-sm font-semibold text-white/30 group-hover:text-brand-primary transition-colors">
                        {String(mIdx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-base font-semibold text-white group-hover:text-brand-primary transition-colors">
                        {module.title || "Module"}
                      </h3>
                      <span className="text-xs text-white/30 ml-auto">
                        {(module.lectures || module.lessons)?.length || 0} lesson{((module.lectures || module.lessons)?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>

                  {/* LECTURES LIST */}
                  {expandedModules.has(module.id) && (
                    <div className="mt-4 space-y-3 pl-6 border-l border-white/10 animate-in fade-in duration-200">
                      {(module.lectures || module.lessons)?.map((lecture, lIdx) => {
                        const isLecExpanded = expandedLectures.has(lecture.id);
                        const embedUrl = getYouTubeEmbedUrl(lecture.videoUrl);

                        return (
                          <div key={lecture.id}>
                            <button
                              onClick={() => toggleLecture(lecture.id)}
                              className="w-full flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/5 transition group"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Play size={14} className="text-brand-primary/60 group-hover:text-brand-primary transition-colors" fill="currentColor" />
                                <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                                  {lIdx + 1}. {lecture.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-white/40">
                                {lecture.notes?.file && <FileText size={14} />}
                                <span className="text-xs">{isLecExpanded ? '−' : '+'}</span>
                              </div>
                            </button>

                            {/* EXPANDED LECTURE CONTENT */}
                            {isLecExpanded && (
                              <div className="mt-3 space-y-4 pb-3 animate-in slide-in-from-top-2 duration-200">
                                {embedUrl ? (
                                  <div className="aspect-video rounded-lg overflow-hidden bg-black border border-white/5">
                                    <iframe src={embedUrl} title={lecture.title} className="w-full h-full" allowFullScreen />
                                  </div>
                                ) : (
                                  <div className="aspect-video rounded-lg bg-dark-200 border border-dashed border-white/10 flex items-center justify-center text-white/20 text-xs font-medium">
                                    No video preview available
                                  </div>
                                )}
                                
                                {lecture.notes?.file && (
                                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <FileText size={16} className="text-brand-primary flex-shrink-0" />
                                      <p className="text-xs font-medium text-white/70 truncate">{lecture.notes.name}</p>
                                    </div>
                                    <a href={lecture.notes.url} download className="ml-2 text-xs font-semibold text-brand-primary hover:text-brand-primary/80 transition whitespace-nowrap">
                                      Download
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INFO PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-8 space-y-6">
            
            {/* COURSE DETAILS */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-4">Course Details</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-white/50">Modules</span>
                    <span className="text-xl font-semibold">{totalModules}</span>
                  </div>
                  <div className="flex justify-between items-end border-t border-white/5 pt-4">
                    <span className="text-xs text-white/50">Total Lessons</span>
                    <span className="text-xl font-semibold">{totalLectures}</span>
                  </div>
                  <div className="flex justify-between items-end border-t border-white/5 pt-4">
                    <span className="text-xs text-white/50">Course Type</span>
                    <div className="flex items-center gap-1.5">
                      {pricing.isPaid ? (
                        <>
                          <Lock size={14} className="text-red-400" />
                          <span className="text-xs font-semibold text-red-400">Paid</span>
                        </>
                      ) : (
                        <>
                          <Unlock size={14} className="text-green-400" />
                          <span className="text-xs font-semibold text-green-400">Free</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA & ERROR */}
            <div className="space-y-4">
              <button 
                onClick={handlePublish}
                disabled={loading}
                className="w-full py-3 bg-brand-primary text-black rounded-lg font-semibold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={3} />
                    Launch Course
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start gap-3 text-xs leading-relaxed">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}