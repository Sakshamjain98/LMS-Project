import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash2, ChevronDown, Video, FileText, AlertCircle, Layout, X, Upload } from "lucide-react";
import { UploadContext } from "./UploadContextProvider";

export default function Curriculum() {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData, updateCurriculum, markCurriculumCompleted } = useContext(UploadContext);

  // State for single expanded module (accordion)
  const [expandedModuleId, setExpandedModuleId] = useState(formData?.curriculum?.modules?.[0]?.id || null);
  const [errors, setErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, parentId: null });
  const [isEditingExistingCourse, setIsEditingExistingCourse] = useState(false);

  // Check if coming from CourseDetail (adding sections to existing course)
  useEffect(() => {
    if (location.state?.course) {
      setIsEditingExistingCourse(true);
      // Pre-populate with existing course data if needed
    }

    if (!formData?.courseStatus?.basicsCompleted && !isEditingExistingCourse) {
      navigate("/teacher/upload/basics", { replace: true });
    }
  }, [formData?.courseStatus?.basicsCompleted, navigate, location.state, isEditingExistingCourse]);

  // Helper to safely get modules array
  const modules = formData?.curriculum?.modules || [];

  // --- Handlers ---

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
          notes: null, // will hold { file, name, url }
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
      setErrors({ global: "Only PDF files are allowed." });
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
      setErrors({ global: "At least one module is required." });
      return;
    }
    // Clean up blob URLs
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

  const validateAndSave = () => {
    if (modules.length === 0) {
      setErrors({ global: "Please add at least one module." });
      return;
    }
    for (const mod of modules) {
      if (!mod.title?.trim()) {
        setErrors({ global: "All modules must have a title." });
        return;
      }
      for (const lec of mod.lectures || []) {
        if (!lec.title?.trim()) {
          setErrors({ global: "All lectures must have a title." });
          return;
        }
        if (!lec.videoUrl?.trim()) {
          setErrors({ global: "All lectures must have a YouTube URL." });
          return;
        }
      }
    }
    setErrors({});
    
    if (isEditingExistingCourse) {
      // Go directly to finalize when adding sections to existing course
      navigate(`/teacher/courses/${location.state?.courseId}/publish-sections`, {
        state: { modules: modules, from: location.state?.from }
      });
    } else {
      markCurriculumCompleted();
      navigate("/teacher/upload/finalize");
    }
  };

  const totalLectures = modules.reduce((sum, mod) => sum + (mod.lectures?.length || 0), 0);

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

  return (
    <div className="min-h-screen bg-dark-300 text-white">
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-200 border border-dark-100 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete {deleteModal.type}?</h3>
            <p className="text-grayCustom-medium text-sm mb-6">
              This action cannot be undone.
            </p>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Curriculum</h1>
            <p className="text-sm text-grayCustom-medium mt-1">
              {isEditingExistingCourse ? "Add modules and lectures to your course" : "Build your course by adding modules and lectures"}
            </p>
          </div>
          <button
            onClick={addModule}
            className="flex items-center gap-2 bg-brand-primary text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
          >
            <Plus size={18} />
            Add Module
          </button>
        </div>

        {/* Progress Stats */}
        <div className="bg-dark-200 border border-dark-100 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Layout size={16} className="text-brand-primary" />
              <span className="text-grayCustom-medium">Modules:</span>
              <span className="font-medium text-white">{modules.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Video size={16} className="text-brand-primary" />
              <span className="text-grayCustom-medium">Lectures:</span>
              <span className="font-medium text-white">{totalLectures}</span>
            </div>
          </div>
          {errors.global && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-1.5 rounded-full">
              <AlertCircle size={14} />
              {errors.global}
            </div>
          )}
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {modules.map((module, idx) => {
            const isExpanded = expandedModuleId === module.id;
            return (
              <div
                key={module.id}
                className="bg-dark-200 border border-dark-100 rounded-lg overflow-hidden"
              >
                {/* Module Header */}
                <div
                  onClick={() => toggleModule(module.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-dark-100/50 transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-mono text-brand-primary">Module {idx + 1}</span>
                    <h2 className="text-lg font-semibold text-white truncate">
                      {module.title || "Untitled Module"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {modules.length > 1 && (
                      <button
                        onClick={() => openDeleteModal("module", module.id)}
                        className="p-1.5 text-grayCustom-medium hover:text-red-400 transition rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <ChevronDown
                      size={20}
                      className={`text-grayCustom-medium transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-dark-100 p-5 space-y-6">
                    {/* Module Title & Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-grayCustom-medium mb-1">
                          Module Title
                        </label>
                        <input
                          type="text"
                          value={module.title}
                          onChange={(e) => updateModuleField(module.id, "title", e.target.value)}
                          placeholder="e.g., Introduction to React"
                          className="w-full h-10 px-3 bg-dark-300 border border-dark-100 rounded-md text-sm text-white placeholder-grayCustom-medium/60 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-grayCustom-medium mb-1">
                          Description (optional)
                        </label>
                        <input
                          type="text"
                          value={module.description}
                          onChange={(e) =>
                            updateModuleField(module.id, "description", e.target.value)
                          }
                          placeholder="What will students learn in this module?"
                          className="w-full h-10 px-3 bg-dark-300 border border-dark-100 rounded-md text-sm text-white placeholder-grayCustom-medium/60 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none"
                        />
                      </div>
                    </div>

                    {/* Lectures Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-white">Lectures</h3>
                        <button
                          onClick={() => addLecture(module.id)}
                          className="text-xs text-brand-primary hover:opacity-80 flex items-center gap-1"
                        >
                          <Plus size={12} />
                          Add Lecture
                        </button>
                      </div>

                      {module.lectures && module.lectures.length > 0 ? (
                        <div className="space-y-3">
                          {module.lectures.map((lecture, lecIdx) => (
                            <div
                              key={lecture.id}
                              className="bg-dark-300 border border-dark-100 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-grayCustom-medium">
                                  Lecture {lecIdx + 1}
                                </span>
                                <button
                                  onClick={() =>
                                    openDeleteModal("lecture", lecture.id, module.id)
                                  }
                                  className="text-grayCustom-medium hover:text-red-400 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <input
                                  type="text"
                                  value={lecture.title}
                                  onChange={(e) =>
                                    updateLectureField(
                                      module.id,
                                      lecture.id,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Lecture title"
                                  className="w-full h-10 px-3 bg-dark-200 border border-dark-100 rounded-md text-sm text-white placeholder-grayCustom-medium/60 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none"
                                />
                                <input
                                  type="text"
                                  value={lecture.videoUrl}
                                  onChange={(e) =>
                                    updateLectureField(
                                      module.id,
                                      lecture.id,
                                      "videoUrl",
                                      e.target.value
                                    )
                                  }
                                  placeholder="YouTube URL"
                                  className="w-full h-10 px-3 bg-dark-200 border border-dark-100 rounded-md text-sm text-white placeholder-grayCustom-medium/60 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none"
                                />
                                {/* PDF Upload */}
                                <div>
                                  <label className="block text-xs font-medium text-grayCustom-medium mb-1">
                                    Notes (PDF)
                                  </label>
                                  {lecture.notes ? (
                                    <div className="flex items-center gap-2 p-2 bg-dark-200 rounded-md">
                                      <FileText size={14} className="text-brand-primary" />
                                      <span className="text-sm truncate flex-1">
                                        {lecture.notes.name}
                                      </span>
                                      <button
                                        onClick={() => removeNotes(module.id, lecture.id)}
                                        className="p-1 text-grayCustom-medium hover:text-red-400 transition"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) =>
                                          handleFileUpload(
                                            module.id,
                                            lecture.id,
                                            e.target.files?.[0]
                                          )
                                        }
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                      />
                                      <div className="border border-dashed border-dark-100 rounded-md p-3 flex items-center justify-center gap-2 text-sm text-grayCustom-medium hover:border-brand-primary transition">
                                        <Upload size={14} />
                                        <span>Upload PDF</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-dark-300 rounded-lg border border-dashed border-dark-100">
                          <p className="text-sm text-grayCustom-medium mb-2">
                            No lectures yet
                          </p>
                          <button
                            onClick={() => addLecture(module.id)}
                            className="text-sm text-brand-primary hover:opacity-80"
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

        {/* Empty State */}
        {modules.length === 0 && (
          <div className="bg-dark-200 border border-dashed border-dark-100 rounded-lg p-12 text-center">
            <p className="text-grayCustom-medium mb-4">No modules created yet</p>
            <button
              onClick={addModule}
              className="inline-flex items-center gap-2 bg-brand-primary text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
            >
              <Plus size={18} />
              Add Your First Module
            </button>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8">
          <button
            onClick={validateAndSave}
            className="w-full h-11 bg-brand-primary text-black font-semibold rounded-lg hover:opacity-90 transition text-sm"
          >
            {isEditingExistingCourse ? "Add Sections to Course" : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}