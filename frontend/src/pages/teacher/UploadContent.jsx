import { useState, useEffect } from "react";
import { createCourse, addSection } from "../../services/teacherService";
import {
  Upload,
  Plus,
  CheckCircle,
  Trash2,
  Video,
  Layers,
  Layout,
  ChevronRight,
  Info,
  FileText,
  DollarSign,
  Tag,
  AlertCircle,
  Loader,
  X
} from "lucide-react";

export default function UploadContent() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [courseId, setCourseId] = useState("");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);

  // --- COURSE STATE ---
  const [form, setForm] = useState({
    title: "",
    description: "",
    tags: "",
    isPaid: false,
    price: 0,
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // --- DYNAMIC SECTIONS STATE ---
  const [sections, setSections] = useState([
    {
      title: "",
      description: "",
      videos: [{ title: "", url: "" }],
      notes: [], // each note: { file, previewUrl, name, type }
    },
  ]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      sections.forEach(section => {
        section.notes.forEach(note => {
          if (note.previewUrl) URL.revokeObjectURL(note.previewUrl);
        });
      });
    };
  }, [thumbnailPreview, sections]);

  // ---------------- HANDLERS ----------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSectionChange = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const handleVideoChange = (sIndex, vIndex, field, value) => {
    const updated = [...sections];
    updated[sIndex].videos[vIndex][field] = value;
    setSections(updated);
  };

  const handleNoteUpload = (sIndex, files) => {
    const updated = [...sections];
    const newNotes = Array.from(files).map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
    }));
    updated[sIndex].notes = [...updated[sIndex].notes, ...newNotes];
    setSections(updated);
  };

  const removeNote = (sIndex, nIndex) => {
    const updated = [...sections];
    const note = updated[sIndex].notes[nIndex];
    if (note.previewUrl) URL.revokeObjectURL(note.previewUrl);
    updated[sIndex].notes.splice(nIndex, 1);
    setSections(updated);
  };

  const addSectionField = () => {
    setSections([...sections, { title: "", description: "", videos: [{ title: "", url: "" }], notes: [] }]);
  };

  const addVideoField = (sIndex) => {
    const updated = [...sections];
    updated[sIndex].videos.push({ title: "", url: "" });
    setSections(updated);
  };

  const removeSection = (index) => {
    // Clean up notes URLs
    sections[index].notes.forEach(note => {
      if (note.previewUrl) URL.revokeObjectURL(note.previewUrl);
    });
    setSections(sections.filter((_, i) => i !== index));
    setShowRemoveConfirm(null);
  };

  // ---------------- VALIDATION ----------------
  const validateStep1 = () => {
    if (!form.title.trim()) return "Course title is required";
    // ✅ FIXED: Only validate price for paid courses
    if (form.isPaid && (!form.price || form.price <= 0)) return "Price must be greater than 0 for paid courses";
    return null;
  };

  const validateStep2 = () => {
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (!sec.title.trim()) return `Section ${i+1} title is required`;
      for (let j = 0; j < sec.videos.length; j++) {
        const vid = sec.videos[j];
        if (!vid.title.trim()) return `Video title in section ${i+1} is required`;
        if (!vid.url.trim()) return `Video URL in section ${i+1} is required`;
        // Basic YouTube URL validation
        if (!vid.url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
          return `Invalid YouTube URL in section ${i+1}, video ${j+1}`;
        }
      }
    }
    return null;
  };

  // ---------------- API SUBMISSIONS ----------------
  const handleCreateCourse = async () => {
    const validationError = validateStep1();
    if (validationError) return setError(validationError);

    try {
      setLoading(true);
      setError("");
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("tags", form.tags.split(",").map(t => t.trim()).filter(t => t).join(","));
      fd.append("isPaid", form.isPaid.toString());
      // ✅ FIXED: Only send price if paid, otherwise send 0
      fd.append("price", form.isPaid ? form.price : "0");
      if (thumbnail) fd.append("thumbnail", thumbnail);

      const res = await createCourse(fd);
      setCourseId(res.course._id);
      setStep(2);
    } catch (err) {
      setError(err.message || "Course creation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSections = async () => {
    const validationError = validateStep2();
    if (validationError) return setError(validationError);

    try {
      setLoading(true);
      setError("");

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        
        // Prepare notes data: if notes have actual files, they need to be uploaded first.
        // This is a placeholder – you'll need to implement note file upload to your server
        // and replace with the returned note objects.
        const notesPayload = await Promise.all(sec.notes.map(async (note) => {
          if (note.file) {
            // TODO: Upload note file to your server and get { url, publicId, fileType }
            // For now, we simulate a successful upload with a fake response
            // Replace with actual upload logic
            return {
              url: note.previewUrl, // temporary – should be the real URL from server
              publicId: `note_${Date.now()}`,
              fileType: note.type.startsWith("image") ? "image" : "document",
            };
          }
          return null;
        })).then(results => results.filter(Boolean));

        // Build section payload
        const sectionPayload = {
          title: sec.title,
          description: sec.description,
          videos: sec.videos.map(v => ({ title: v.title, url: v.url })),
          notes: notesPayload,
        };

        await addSection(courseId, sectionPayload);
      }

      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to add sections");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-6">
      
      {/* LEFT SIDE: BUILDER */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* STEPPER HEADER */}
        <div className="flex flex-wrap items-center gap-2 bg-dark-200 p-4 rounded-2xl border border-white/5 shadow-sm">
          {["Course Info", "Curriculum", "Finalize"].map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                step >= i + 1 ? "bg-brand-primary text-black" : "bg-dark-100 text-gray-500"
              }`}>
                {i + 1}
              </span>
              <span className={`text-sm font-medium hidden sm:inline ${step >= i + 1 ? "text-white" : "text-gray-500"}`}>
                {label}
              </span>
              {i < 2 && <ChevronRight size={14} className="text-gray-600 mx-1" />}
            </div>
          ))}
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: COURSE BASICS */}
        {step === 1 && (
          <div className="bg-dark-200 p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Layout className="text-brand-primary" />
              <h2 className="text-xl font-bold">Course Basics</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Course Title *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Master React with Hooks"
                  className="w-full p-4 bg-dark-300 rounded-xl border border-white/5 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="What will students learn? (optional)"
                  className="w-full p-4 bg-dark-300 rounded-xl border border-white/5 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
                <div className="relative">
                  <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="react, frontend, web development"
                    className="w-full pl-12 p-4 bg-dark-300 rounded-xl border border-white/5 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-3 p-4 bg-dark-300 rounded-xl border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPaid"
                    checked={form.isPaid}
                    onChange={handleChange}
                    className="w-5 h-5 accent-brand-primary"
                  />
                  <span className="text-sm font-medium">Paid Course</span>
                </label>
                {form.isPaid && (
                  <div className="flex-1 relative">
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      className="w-full pl-12 p-4 bg-dark-300 rounded-xl border border-white/5 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail</label>
                <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-white/10 p-8 rounded-2xl bg-dark-300 hover:border-brand-primary/50 transition-colors cursor-pointer group">
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="max-h-40 rounded-lg object-cover mb-3" />
                  ) : (
                    <Upload className="text-brand-primary mb-2 group-hover:scale-110 transition-transform" size={32} />
                  )}
                  <p className="text-sm text-gray-400">
                    {thumbnail ? thumbnail.name : "Click or drag to upload thumbnail"}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleThumbnailChange}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateCourse}
              disabled={loading}
              className="w-full py-4 bg-brand-primary text-black font-black rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader size={20} className="animate-spin" /> : null}
              {loading ? "Creating..." : "Save & Continue"}
            </button>
          </div>
        )}

        {/* STEP 2: CURRICULUM */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Layers className="text-brand-primary" /> Curriculum
              </h2>
              <button
                onClick={addSectionField}
                className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-primary hover:text-black transition-all"
              >
                <Plus size={18} /> Add Section
              </button>
            </div>

            {sections.map((sec, sIndex) => (
              <div key={sIndex} className="bg-dark-200 border border-white/5 p-6 rounded-2xl space-y-5 shadow-xl relative">
                {/* Section Header */}
                <div className="flex justify-between items-center bg-dark-300/50 p-3 rounded-xl border border-white/5">
                  <h3 className="font-bold text-brand-primary">Module {sIndex + 1}</h3>
                  {sections.length > 1 && (
                    <>
                      <button
                        onClick={() => setShowRemoveConfirm(sIndex)}
                        className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      {/* Simple confirmation modal */}
                      {showRemoveConfirm === sIndex && (
                        <div className="absolute right-6 top-16 bg-dark-100 border border-white/10 rounded-xl p-4 shadow-xl z-10 w-64">
                          <p className="text-sm text-gray-300 mb-3">Remove this section?</p>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setShowRemoveConfirm(null)}
                              className="px-3 py-1 text-xs bg-dark-300 rounded-lg hover:bg-dark-400"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => removeSection(sIndex)}
                              className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Section Title */}
                <input
                  placeholder="Section Title (e.g. Getting Started)"
                  value={sec.title}
                  onChange={(e) => handleSectionChange(sIndex, "title", e.target.value)}
                  className="w-full p-3 bg-dark-300 rounded-xl outline-none border border-white/5 focus:border-brand-primary"
                />

                {/* Section Description */}
                <textarea
                  placeholder="Section Description (optional)"
                  value={sec.description}
                  onChange={(e) => handleSectionChange(sIndex, "description", e.target.value)}
                  rows="2"
                  className="w-full p-3 bg-dark-300 rounded-xl outline-none border border-white/5 focus:border-brand-primary resize-none"
                />

                {/* Videos */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Video size={16} /> Videos
                  </label>
                  {sec.videos.map((vid, vIndex) => (
                    <div key={vIndex} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-dark-300/30 p-3 rounded-xl border border-white/5">
                      <input
                        placeholder="Lesson Title"
                        value={vid.title}
                        onChange={(e) => handleVideoChange(sIndex, vIndex, "title", e.target.value)}
                        className="flex-1 w-full sm:w-auto p-2 bg-dark-100 rounded-lg text-sm border border-white/5 focus:border-brand-primary outline-none"
                      />
                      <input
                        placeholder="YouTube URL"
                        value={vid.url}
                        onChange={(e) => handleVideoChange(sIndex, vIndex, "url", e.target.value)}
                        className="flex-1 w-full sm:w-auto p-2 bg-dark-100 rounded-lg text-sm border border-white/5 focus:border-brand-primary outline-none"
                      />
                      {sec.videos.length > 1 && (
                        <button
                          onClick={() => {
                            const updated = [...sections];
                            updated[sIndex].videos.splice(vIndex, 1);
                            setSections(updated);
                          }}
                          className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors shrink-0"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addVideoField(sIndex)}
                    className="text-sm text-brand-primary flex items-center gap-1 mt-2 opacity-70 hover:opacity-100"
                  >
                    <Plus size={16} /> Add Video Lesson
                  </button>
                </div>

                {/* Notes (File Attachments) */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <FileText size={16} /> Notes / Resources
                  </label>
                  {sec.notes.map((note, nIndex) => (
                    <div key={nIndex} className="flex items-center gap-3 bg-dark-300/30 p-2 rounded-lg border border-white/5">
                      <FileText size={16} className="text-gray-500" />
                      <span className="flex-1 text-sm truncate">{note.name}</span>
                      <span className="text-xs text-gray-500">{note.type.split('/')[1]}</span>
                      <button
                        onClick={() => removeNote(sIndex, nIndex)}
                        className="text-red-400 hover:bg-red-500/10 p-1 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="relative border border-dashed border-white/10 rounded-lg p-4 text-center hover:border-brand-primary/50 transition-colors cursor-pointer group">
                    <input
                      type="file"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleNoteUpload(sIndex, e.target.files)}
                    />
                    <Plus size={20} className="mx-auto text-brand-primary mb-1 group-hover:scale-110 transition-transform" />
                    <p className="text-xs text-gray-400">Upload notes (PDF, images, etc.)</p>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmitSections}
              disabled={loading}
              className="w-full py-4 bg-brand-primary text-black font-black rounded-xl shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader size={20} className="animate-spin" /> : null}
              {loading ? "Publishing..." : "Publish Curriculum"}
            </button>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <div className="bg-dark-200 p-10 md:p-16 rounded-3xl text-center border border-white/5 space-y-5">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-bold">Course Published!</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Your content is now available for students. You can manage this course from your dashboard.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-10 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-lg"
            >
              Create New Course
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: LIVE PREVIEW */}
      <div className="lg:col-span-4 hidden lg:block">
        <div className="sticky top-6 space-y-4">
          <div className="bg-dark-200 border border-white/5 rounded-2xl overflow-hidden">
            {/* Thumbnail Preview */}
            <div className="h-44 bg-dark-300 flex items-center justify-center border-b border-white/5 overflow-hidden">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Thumb" className="w-full h-full object-cover" />
              ) : (
                <Info className="text-white/5" size={48} />
              )}
            </div>

            {/* Course Info */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-white truncate" title={form.title}>
                {form.title || "Untitled Course"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {form.description || "No description provided yet."}
              </p>
              
              {/* Tags Preview */}
              {form.tags && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.tags.split(",").map((tag, i) => (
                    <span key={i} className="text-[10px] bg-dark-300 text-gray-400 px-2 py-1 rounded-full">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Price Badge */}
              {form.isPaid && (
                <div className="mt-3 text-sm font-medium text-brand-primary">
                  ${parseFloat(form.price).toFixed(2)} • Paid
                </div>
              )}

              {/* Curriculum Preview */}
              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} /> Curriculum Preview ({sections.length} modules)
                </p>
                {sections.map((s, i) => (
                  <div key={i} className="text-xs p-3 bg-dark-100 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-300 truncate">
                        {s.title || `Module ${i+1}`}
                      </span>
                      <span className="text-gray-600 text-[10px]">
                        {s.videos.length} videos • {s.notes.length} notes
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-gray-500 text-[10px] mt-1 line-clamp-1">{s.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 text-center uppercase tracking-widest">
            Production Ready • v2.0
          </p>
        </div>
      </div>
    </div>
  );
}