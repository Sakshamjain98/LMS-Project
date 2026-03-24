import { useEffect, useState } from "react";
import { getAllNotes } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { FaSearch, FaDownload, FaFileAlt, FaFilter, FaEye } from "react-icons/fa";

export default function StudentNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const data = await getAllNotes();
        setNotes(data.notes || []);
      } catch (err) {
        setError(err.message || "Failed to load notes");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || 
                         (filterType === "free" && note.isFree) ||
                         (filterType === "paid" && !note.isFree);
    return matchesSearch && matchesFilter;
  });

  // Group by type
  const groupedNotes = {
    free: filteredNotes.filter(n => n.isFree),
    paid: filteredNotes.filter(n => !n.isFree)
  };

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className="flex items-center justify-center h-96">
          <span className="text-sm text-gray-400">Loading notes...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentNavbar />
      <div className="bg-dark-400 min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* ─── HEADER ──────────────────────────────────────── */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Study Resources</h1>
            <p className="text-sm text-gray-400">Access notes, PDFs, and study materials</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          {/* ─── SEARCH & FILTER ─────────────────────────────── */}
          <div className="space-y-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-dark-200 border border-dark-100 rounded-lg focus:border-brand-primary outline-none transition text-sm"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {["all", "free", "paid"].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    filterType === type
                      ? "bg-brand-primary text-dark-400"
                      : "bg-dark-200 text-gray-400 hover:bg-dark-100 border border-dark-100"
                  }`}
                >
                  <FaFilter size={14} />
                  {type === "all" ? "All Notes" : type === "free" ? "Free" : "Paid"}
                </button>
              ))}
            </div>
          </div>

          {/* ─── NOTES SECTIONS ──────────────────────────────– */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-16">
              <FaFileAlt className="text-6xl text-gray-600 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">No notes found</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Free Notes */}
              {groupedNotes.free.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dark-100">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <FaFileAlt className="text-green-400" size={16} />
                    </div>
                    <h2 className="text-lg font-bold text-white">Free Resources</h2>
                    <span className="text-xs bg-dark-200 text-gray-400 px-2 py-1 rounded-full ml-auto">{groupedNotes.free.length}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedNotes.free.map(note => (
                      <NoteCard key={note._id} note={note} />
                    ))}
                  </div>
                </div>
              )}

              {/* Paid Notes */}
              {groupedNotes.paid.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dark-100">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <FaFileAlt className="text-blue-400" size={16} />
                    </div>
                    <h2 className="text-lg font-bold text-white">Premium Resources</h2>
                    <span className="text-xs bg-dark-200 text-gray-400 px-2 py-1 rounded-full ml-auto">{groupedNotes.paid.length}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedNotes.paid.map(note => (
                      <NoteCard key={note._id} note={note} premium />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Note Card Component
function NoteCard({ note, premium }) {
  return (
    <div className="bg-dark-200 border border-dark-100 rounded-lg p-5 hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/10 transition group">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-3 bg-dark-100 rounded-lg group-hover:bg-brand-primary/20 transition">
          <FaFileAlt className="text-brand-primary text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate group-hover:text-brand-primary transition">
            {note.title}
          </h3>
          {note.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.description}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {note.tags.slice(0, 2).map((tag, i) => (
            <span key={i} className="text-xs bg-dark-100 text-gray-400 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-xs text-gray-500">+{note.tags.length - 2} more</span>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between py-3 border-t border-dark-100 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <FaEye size={12} />
          <span>{note.downloadCount || 0} downloads</span>
        </div>
        <span>By {note.teacherId?.name || "Teacher"}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button className="flex-1 py-2 px-3 bg-brand-primary text-dark-400 rounded-lg text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-2">
          <FaDownload size={12} />
          Download
        </button>
        {premium && (
          <div className="flex-1 py-2 px-3 bg-dark-100 text-gray-400 rounded-lg text-xs font-bold text-center">
            💎 Premium
          </div>
        )}
      </div>
    </div>
  );
}
