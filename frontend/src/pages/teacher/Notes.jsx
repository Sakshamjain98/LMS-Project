import { useEffect, useState } from "react";
import {
  createNote,
  getTeacherNotes,
  deleteNote,
  updateNote,
} from "../../services/teacherService";

import {
  Upload,
  FileText,
  Trash2,
  Edit,
  Eye,
  X,
  Loader,
  AlertCircle,
  Download,
  Tag,
  CheckCircle,
  Search,
  ChevronDown,
  Calendar,
  Lock,
  Unlock,
} from "lucide-react";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    tags: "",
    isFree: true,
  });
  const [file, setFile] = useState(null);
  const [editId, setEditId] = useState(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // 🔄 Fetch notes
  const fetchNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTeacherNotes();
      setNotes(res.notes || []);
    } catch (err) {
      setError(err.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // 📝 Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🖼️ Handle file selection
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError("");
    } else {
      setError("Please select a valid PDF file");
      e.target.value = null;
    }
  };

  // 🧹 Clear form
  const resetForm = () => {
    setForm({ title: "", description: "", tags: "", isFree: true });
    setFile(null);
    setEditId(null);
    setError("");
  };

  // ➕ Create / Update note
  const handleSubmit = async () => {
    if (!form.title.trim()) return setError("Title is required");
    if (!editId && !file) return setError("PDF file is required");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("tags", form.tags);
      fd.append("isFree", form.isFree);

      if (file) fd.append("file", file);

      // Debug: log FormData contents (for development)
      console.log("FormData entries:");
      for (let [key, value] of fd.entries()) {
        if (key === "file") {
          console.log(key, value.name, value.size, value.type);
        } else {
          console.log(key, value);
        }
      }

      if (editId) {
        await updateNote(editId, fd);
        setSuccess("Note updated successfully!");
      } else {
        await createNote(fd);
        setSuccess("Note created successfully!");
      }

      resetForm();
      fetchNotes();
    } catch (err) {
      // Enhanced error logging to capture server response
      let errorMessage = "Operation failed";
      if (err.response) {
        // Server responded with error status
        console.error("Server error response:", err.response.data);
        errorMessage = err.response.data?.message || err.response.data?.error || errorMessage;
        // If the server returned a stack trace, log it too
        if (err.response.data?.stack) {
          console.error("Stack:", err.response.data.stack);
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Check your network.";
      } else {
        // Something else happened
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ❌ Delete note
  const handleDelete = async () => {
    if (!deleteId) return;

    setLoading(true);
    setError("");
    try {
      await deleteNote(deleteId);
      setSuccess("Note deleted successfully");
      setDeleteId(null);
      setDeleteConfirm("");
      fetchNotes();
    } catch (err) {
      let errorMessage = "Delete failed";
      if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✏️ Edit note
  const handleEdit = (note) => {
    setForm({
      title: note.title,
      description: note.description || "",
      tags: note.tags?.join(",") || "",
      isFree: note.isFree,
    });
    setFile(null);
    setEditId(note._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    resetForm();
  };

  // 🔍 Filter and sort notes
  const filteredNotes = notes
    .filter((note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === "modified") {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-dark-300 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
          <FileText className="text-brand-primary" size={32} />
          My Notes & Resources
        </h1>
        <p className="text-gray-400 mt-2">Manage and organize your educational materials</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 mb-6 animate-slideDown">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-red-400/70 hover:text-red-400">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-start gap-3 mb-6 animate-slideDown">
          <CheckCircle size={20} className="shrink-0 mt-0.5" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess("")} className="text-green-400/70 hover:text-green-400">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Layout: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-dark-200 border border-white/5 rounded-2xl p-6 shadow-xl sticky top-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              {editId ? (
                <>✏️ Edit Note</>
              ) : (
                <>
                  <Upload size={20} className="text-brand-primary" />
                  Upload Note
                </>
              )}
            </h2>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. React Hooks Cheat Sheet"
                  className="w-full p-3 bg-dark-300 border border-white/5 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Brief summary..."
                  className="w-full p-3 bg-dark-300 border border-white/5 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <div className="relative">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="react, hooks"
                    className="w-full pl-10 p-3 bg-dark-300 border border-white/5 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                  />
                </div>
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  PDF File {!editId && <span className="text-red-400">*</span>}
                </label>
                <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-white/10 p-4 rounded-xl bg-dark-300 hover:border-brand-primary/50 transition-colors cursor-pointer group">
                  {file ? (
                    <div className="text-center w-full">
                      <FileText size={24} className="mx-auto text-brand-primary mb-2" />
                      <p className="text-xs text-gray-300 break-all">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="mt-2 text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="text-brand-primary mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs text-gray-400 text-center">
                        {editId
                          ? "Upload new PDF"
                          : "Click to upload"}
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Free/Paid Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isFree: true })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all text-sm ${
                      form.isFree
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-dark-300 text-gray-400 border border-white/5 hover:border-green-500/20"
                    }`}
                  >
                    <Unlock size={16} />
                    Free
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isFree: false })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all text-sm ${
                      !form.isFree
                        ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30"
                        : "bg-dark-300 text-gray-400 border border-white/5 hover:border-brand-primary/20"
                    }`}
                  >
                    <Lock size={16} />
                    Paid
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 bg-brand-primary text-black font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader size={16} className="animate-spin" />}
                  {loading ? "Saving..." : editId ? "Update" : "Create"}
                </button>
                {editId && (
                  <button
                    onClick={handleCancelEdit}
                    className="w-full py-2.5 bg-dark-100 text-gray-300 rounded-xl hover:bg-dark-300 transition text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Notes List */}
        <div className="lg:col-span-2">
          <div className="bg-dark-200 border border-white/5 rounded-2xl p-6 shadow-xl">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-dark-300 border border-white/5 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="px-4 py-3 bg-dark-300 border border-white/5 rounded-xl hover:border-brand-primary/30 transition flex items-center gap-2 text-sm font-medium text-gray-300 whitespace-nowrap"
                >
                  <Calendar size={16} />
                  Last Modified
                  <ChevronDown size={16} className={`transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-2 bg-dark-300 border border-white/5 rounded-xl shadow-lg z-10 min-w-[180px]">
                    {[
                      { value: "newest", label: "Newest First" },
                      { value: "oldest", label: "Oldest First" },
                      { value: "modified", label: "Recently Modified" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-dark-200 transition text-sm ${
                          sortBy === option.value ? "text-brand-primary font-semibold" : "text-gray-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes Count */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Your Notes ({filteredNotes.length})
              </h2>
              {loading && <Loader size={18} className="animate-spin text-gray-500" />}
            </div>

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">
                  {notes.length === 0 ? "No notes yet" : "No matching notes"}
                </p>
                <p className="text-sm mt-2">
                  {notes.length === 0 ? "Upload your first note using the form on the left" : "Try adjusting your search"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <div
                    key={note._id}
                    className="bg-dark-100 border border-white/5 rounded-xl p-4 hover:border-brand-primary/30 transition group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="p-2.5 bg-brand-primary/10 rounded-lg flex-shrink-0">
                        <FileText size={18} className="text-brand-primary" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate text-sm" title={note.title}>
                          {note.title}
                        </h3>
                        {note.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {note.description}
                          </p>
                        )}

                        {/* Tags */}
                        {note.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.slice(0, 2).map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-dark-300 text-gray-400 px-1.5 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {note.tags.length > 2 && (
                              <span className="text-[10px] text-gray-500">+{note.tags.length - 2}</span>
                            )}
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Download size={12} />
                            {note.downloadCount || 0}
                          </span>
                          {note.isFree ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <Unlock size={12} />
                              Free
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400">
                              <Lock size={12} />
                              Paid
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                        <a
                          href={note.file?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-dark-300 rounded-lg hover:bg-dark-400 text-gray-300 transition"
                          title="Preview"
                        >
                          <Eye size={14} />
                        </a>
                        <button
                          onClick={() => handleEdit(note)}
                          className="p-2 bg-dark-300 rounded-lg hover:bg-dark-400 text-gray-300 transition"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(note._id)}
                          className="p-2 bg-dark-300 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-200 border border-white/5 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">Delete Note?</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {notes.find(n => n._id === deleteId)?.title}
                </p>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              This action cannot be undone. All associated data will be permanently deleted.
            </p>

            {/* Confirmation Input */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Type "DELETE" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2.5 bg-dark-300 border border-red-500/20 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteId(null);
                  setDeleteConfirm("");
                }}
                className="px-5 py-2.5 bg-dark-100 text-gray-300 rounded-lg hover:bg-dark-300 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || deleteConfirm !== "DELETE"}
                className="px-5 py-2.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
              >
                {loading && <Loader size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}