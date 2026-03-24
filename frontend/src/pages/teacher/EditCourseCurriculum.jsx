import { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { addSection, addVideoToSection, uploadSectionNotes } from "../../services/teacherService";
import { UploadContext } from "./upload/UploadContextProvider";
import { ChevronDown, Plus, Trash2, X, Upload, AlertCircle, Loader, FileText, Video, ArrowLeft, Layout } from "lucide-react";

export default function EditCourseCurriculum() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const location = useLocation();
  const { formData, updateCurriculum, clearFormData } = useContext(UploadContext);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedModuleId, setExpandedModuleId] = useState(formData?.curriculum?.modules?.[0]?.id || null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, parentId: null });

  const modules = formData?.curriculum?.modules || [];

  const toggleModule = (id) => {
    setExpandedModuleId(expandedModuleId === id ? null : id);
  };

  const addModule = () => {
    const newId = `module-${Date.now()}`;
    const newModule = {
      id: newId,
      title: "",
      description: "",
      lectures: [],
    };
    updateCurriculum({
      ...formData.curriculum,
      modules: [...modules, newModule],
    });
    setExpandedModuleId(newId);
  };

  const updateModuleField = (moduleId, field, value) => {
    const updated = modules.map((mod) =>
      mod.id === moduleId ? { ...mod, [field]: value } : mod
    );
    updateCurriculum({ ...formData.curriculum, modules: updated });
  };

  const addLecture = (moduleId) => {
    const updated = modules.map((mod) => {
      if (mod.id === moduleId) {
        const newLecture = {
          id: Date.now(),
          title: "",
          videoUrl: "",
          notes: null,
        };
        return { ...mod, lectures: [...(mod.lectures || []), newLecture] };
      }
      return mod;
    });
    updateCurriculum({ ...formData.curriculum, modules: updated });
  };

  const updateLectureField = (moduleId, lectureId, field, value) => {
    const updated = modules.map((mod) => {
      if (mod.id === moduleId) {
        return {
          ...mod,
          lectures: mod.lectures.map((lec) =>
            lec.id === lectureId ? { ...lec, [field]: value } : lec
          ),
        };
      }
      return mod;
    });
    updateCurriculum({ ...formData.curriculum, modules: updated });
  };

  const handleFileUpload = (moduleId, lectureId, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    updateLectureField(moduleId, lectureId, "notes", {
      file: file,
      name: file.name,
      url: blobUrl,
    });
  };

  const removeNotes = (moduleId, lectureId) => {
    const lecture = modules
      .find(mod => mod.id === moduleId)
      ?.lectures.find(lec => lec.id === lectureId);
    if (lecture?.notes?.url) {
      URL.revokeObjectURL(lecture.notes.url);
    }
    updateLectureField(moduleId, lectureId, "notes", null);
  };

  const deleteLecture = (moduleId, lectureId) => {
    const lecture = modules
      .find(mod => mod.id === moduleId)
      ?.lectures.find(lec => lec.id === lectureId);
    if (lecture?.notes?.url) {
      URL.revokeObjectURL(lecture.notes.url);
    }
    const updated = modules.map((mod) => {
      if (mod.id === moduleId) {
        return {
          ...mod,
          lectures: mod.lectures.filter((lec) => lec.id !== lectureId),
        };
      }
      return mod;
    });
    updateCurriculum({ ...formData.curriculum, modules: updated });
  };

  const deleteModule = (moduleId) => {
    if (modules.length === 1) {
      setError("At least one module is required.");
      return;
    }
    const moduleToDelete = modules.find(mod => mod.id === moduleId);
    moduleToDelete?.lectures.forEach(lec => {
      if (lec.notes?.url) URL.revokeObjectURL(lec.notes.url);
    });
    const updated = modules.filter((mod) => mod.id !== moduleId);
    updateCurriculum({ ...formData.curriculum, modules: updated });
    if (expandedModuleId === moduleId) {
      setExpandedModuleId(updated[0]?.id || null);
    }
  };

  const validateAndPublish = async () => {
    if (modules.length === 0) {
      setError("Please add at least one module.");
      return;
    }
    for (const mod of modules) {
      if (!mod.title?.trim()) {
        setError("All modules must have a title.");
        return;
      }
      for (const lec of mod.lectures || []) {
        if (!lec.title?.trim()) {
          setError("All lectures must have a title.");
          return;
        }
        if (!lec.videoUrl?.trim()) {
          setError("All lectures must have a YouTube URL.");
          return;
        }
      }
    }
    setError("");
    
    try {
      setLoading(true);
      
      for (const module of modules) {
        const sectionRes = await addSection(courseId, {
          title: module.title.trim(),
          description: module.description?.trim() || "",
        });
        const sectionId = sectionRes.section._id;

        for (const lecture of module.lectures) {
          await addVideoToSection(courseId, sectionId, {
            title: lecture.title.trim(),
            url: lecture.videoUrl.trim(),
          });
        }

        const notesFiles = module.lectures
          .map(lec => lec.notes?.file)
          .filter(file => file instanceof File);
        if (notesFiles.length > 0) {
          await uploadSectionNotes(courseId, sectionId, notesFiles);
        }
      }

      clearFormData();
      setLoading(false);
      navigate(`/teacher/courses/${courseId}`, { 
        state: { success: "Sections added successfully" } 
      });
    } catch (err) {
      setError(err.message || "Failed to add sections");
      setLoading(false);
    }
  };

  const openDeleteModal = (type, id, parentId = null) => {
    setDeleteModal({ isOpen: true, type, id, parentId });
  };

  const confirmDelete = () => {
    const { type, id, parentId } = deleteModal;
    if (type === "module") {
      deleteModule(id);
    } else if (type === "lecture") {
      deleteLecture(parentId, id);
    }
    setDeleteModal({ isOpen: false, type: null, id: null, parentId: null });
  };

  const totalLectures = modules.reduce((sum, mod) => sum + (mod.lectures?.length || 0), 0);

  return (
    <div className="min-h-screen bg-dark-300 text-white">
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-200 border border-dark-100 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete {deleteModal.type}?</h3>
            <p className="text-grayCustom-medium text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false })}
                className="flex-1 px-4 py-2 bg-dark-100 rounded-lg text-sm hover:bg-dark-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(`/teacher/courses/${courseId}`)}
          className="flex items-center gap-2 text-brand-primary hover:opacity-80 mb-8 transition"
        >
          <ArrowLeft size={18} />
          Back to Course
        </button>

        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Add Sections</h1>
          <p className="text-lg text-grayCustom-medium/80">Build your course curriculum with modules and video lectures</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 mb-8 flex items-start gap-3">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Stats Bar */}
        <div className="bg-dark-200 border border-dark-100 rounded-xl p-6 mb-10 flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="bg-brand-primary/10 p-3 rounded-lg">
              <Layout size={20} className="text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-grayCustom-medium/70 uppercase tracking-wide font-semibold">Total Modules</p>
              <p className="text-3xl font-bold text-white">{modules.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-brand-primary/10 p-3 rounded-lg">
              <Video size={20} className="text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-grayCustom-medium/70 uppercase tracking-wide font-semibold">Total Lectures</p>
              <p className="text-3xl font-bold text-white">{totalLectures}</p>
            </div>
          </div>
        </div>

        {/* Modules Section */}
        {modules.length > 0 ? (
          <div className="space-y-5 mb-12">
            {modules.map((module, idx) => {
              const isExpanded = expandedModuleId === module.id;
              return (
                <div
                  key={module.id}
                  className="bg-dark-200 border border-dark-100 rounded-xl overflow-hidden hover:border-brand-primary/30 transition-all"
                >
                  {/* Module Header */}
                  <div
                    onClick={() => toggleModule(module.id)}
                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-dark-100/30 transition"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-white truncate">
                          {module.title || "Untitled Module"}
                        </h3>
                        {module.description && (
                          <p className="text-sm text-grayCustom-medium/70 truncate mt-0.5">{module.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full flex-shrink-0">
                        {module.lectures?.length || 0} video{module.lectures?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      {modules.length > 1 && (
                        <button
                          onClick={() => openDeleteModal("module", module.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 transition text-red-400"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <ChevronDown
                        size={22}
                        className={`text-grayCustom-medium transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-dark-100 bg-dark-100/30 p-6 space-y-6 animate-in fade-in duration-300">
                      {/* Module Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">Module Title *</label>
                          <input
                            type="text"
                            value={module.title}
                            onChange={(e) => updateModuleField(module.id, "title", e.target.value)}
                            placeholder="e.g., Introduction to React Hooks"
                            className="w-full h-11 px-4 bg-dark-300 border border-dark-100 rounded-lg text-sm text-white placeholder-grayCustom-medium/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">Description</label>
                          <input
                            type="text"
                            value={module.description}
                            onChange={(e) => updateModuleField(module.id, "description", e.target.value)}
                            placeholder="What topics does this cover?"
                            className="w-full h-11 px-4 bg-dark-300 border border-dark-100 rounded-lg text-sm text-white placeholder-grayCustom-medium/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Lectures Section */}
                      <div className="pt-4 border-t border-dark-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white">Lectures</h4>
                          <button
                            onClick={() => addLecture(module.id)}
                            className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition"
                          >
                            <Plus size={16} /> Add Lecture
                          </button>
                        </div>

                        {module.lectures && module.lectures.length > 0 ? (
                          <div className="space-y-3">
                            {module.lectures.map((lecture, lecIdx) => (
                              <div
                                key={lecture.id}
                                className="bg-dark-200 border border-dark-100 rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-semibold text-brand-primary uppercase tracking-wide">
                                    Lecture {lecIdx + 1}
                                  </span>
                                  <button
                                    onClick={() => openDeleteModal("lecture", lecture.id, module.id)}
                                    className="text-grayCustom-medium hover:text-red-400 transition"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    value={lecture.title}
                                    onChange={(e) =>
                                      updateLectureField(module.id, lecture.id, "title", e.target.value)
                                    }
                                    placeholder="Lecture title"
                                    className="w-full h-10 px-3 bg-dark-300 border border-dark-100 rounded-md text-sm text-white placeholder-grayCustom-medium/50 focus:border-brand-primary outline-none transition-all"
                                  />
                                  <input
                                    type="text"
                                    value={lecture.videoUrl}
                                    onChange={(e) =>
                                      updateLectureField(module.id, lecture.id, "videoUrl", e.target.value)
                                    }
                                    placeholder="YouTube URL (https://www.youtube.com/watch?v=...)"
                                    className="w-full h-10 px-3 bg-dark-300 border border-dark-100 rounded-md text-sm text-white placeholder-grayCustom-medium/50 focus:border-brand-primary outline-none transition-all"
                                  />
                                  <div>
                                    <label className="block text-xs font-semibold text-grayCustom-medium mb-2 uppercase tracking-wide">
                                      Lecture Notes (PDF)
                                    </label>
                                    {lecture.notes ? (
                                      <div className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg border border-brand-primary/20">
                                        <FileText size={16} className="text-brand-primary flex-shrink-0" />
                                        <span className="text-sm font-medium text-white/80 truncate flex-1">{lecture.notes.name}</span>
                                        <button
                                          onClick={() => removeNotes(module.id, lecture.id)}
                                          className="p-1 text-grayCustom-medium hover:text-red-400 transition flex-shrink-0"
                                        >
                                          <X size={16} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="relative">
                                        <input
                                          type="file"
                                          accept="application/pdf"
                                          onChange={(e) =>
                                            handleFileUpload(module.id, lecture.id, e.target.files?.[0])
                                          }
                                          className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className="border-2 border-dashed border-dark-100 rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-grayCustom-medium hover:border-brand-primary hover:text-brand-primary transition cursor-pointer">
                                          <Upload size={16} />
                                          <span>Click to upload PDF notes</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-dark-300 rounded-lg border-2 border-dashed border-dark-100">
                            <Video size={32} className="text-grayCustom-medium/30 mx-auto mb-2" />
                            <p className="text-sm text-grayCustom-medium mb-3">No lectures added yet</p>
                            <button
                              onClick={() => addLecture(module.id)}
                              className="text-sm font-medium text-brand-primary hover:text-brand-primary/80"
                            >
                              + Add first lecture
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-dark-200 border-2 border-dashed border-dark-100 rounded-xl mb-12">
            <Layout size={48} className="text-grayCustom-medium/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Modules Yet</h3>
            <p className="text-grayCustom-medium/70 mb-6">Create your first module to get started</p>
            <button
              onClick={addModule}
              className="inline-flex items-center gap-2 bg-brand-primary text-black px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition"
            >
              <Plus size={18} /> Create First Module
            </button>
          </div>
        )}

        {/* Add Module Button (Fixed Position) */}
        {modules.length > 0 && (
          <div className="mb-12">
            <button
              onClick={addModule}
              className="flex items-center gap-3 w-full px-6 py-4 border-2 border-dashed border-brand-primary/30 hover:border-brand-primary/60 rounded-xl text-center justify-center text-brand-primary hover:bg-brand-primary/5 transition group"
            >
              <Plus size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg">Add Another Module</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 sticky bottom-0 bg-dark-300 py-4 -mx-6 px-6 border-t border-dark-100">
          <button
            onClick={() => navigate(`/teacher/courses/${courseId}`)}
            className="flex-1 px-6 py-3 border border-dark-100 text-white rounded-lg hover:bg-white/5 font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={validateAndPublish}
            disabled={loading || modules.length === 0}
            className="flex-1 px-6 py-3 bg-brand-primary text-black rounded-lg font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Plus size={18} />
                Add {modules.length} {modules.length === 1 ? 'Module' : 'Modules'} to Course
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
