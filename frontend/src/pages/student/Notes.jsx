import { useEffect, useState } from "react";
import { getAllNotes, getStudentSubscription } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { 
  Search, Filter, ChevronDown, FileText, Eye, Lock, Unlock, Download, Zap 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentNotes() {

  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Subscription state
  const [_subscriptionStatus, setSubscriptionStatus] = useState(
    localStorage.getItem("subscriptionStatus") || "FREE"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch subscription status from API (to ensure it's up-to-date)
  const fetchSubscription = async () => {
    try {
      const res = await getStudentSubscription();
      const plan = res?.plan || "FREE";
      const isActive = res?.status === "ACTIVE" && plan !== "FREE";
      setSubscriptionStatus(plan);
      setIsSubscribed(isActive);
      localStorage.setItem("subscriptionStatus", isActive ? plan : "FREE");
    } catch (err) {
      console.error("Failed to sync subscription:", err);
      // fallback to localStorage value
      const stored = localStorage.getItem("subscriptionStatus");
      setIsSubscribed(stored && stored !== "FREE" && stored !== "null");
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const data = await getAllNotes();
        const fetchedNotes = data.notes || [];
        setNotes(fetchedNotes);
        setFilteredNotes(fetchedNotes);
      } catch (err) {
        setError(err.message || "Failed to load study resources");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  useEffect(() => {
    let filtered = notes;

    // UI filter (free/paid/all) – keeps all notes but we'll lock premium ones in card
    if (selectedFilter === "free") {
      filtered = filtered.filter(n => n.isFree === true);
    } else if (selectedFilter === "paid") {
      filtered = filtered.filter(n => !n.isFree);
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredNotes(filtered);
  }, [searchQuery, selectedFilter, notes]);

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className="flex h-screen items-center justify-center bg-dark-400">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
            <p className="text-white/50">Loading study resources...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen bg-dark-400 pb-12">
        {/* HEADER */}
        <div className="border-b border-dark-100 bg-dark-300">
          <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-10">
            <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Study Resources</h1>
            <p className="text-sm text-gray-400 md:text-base">
              Access premium notes, PDFs, and essential study materials.
              {!isSubscribed && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-brand-primary">
                  <Zap size={12} /> Upgrade to unlock all content
                </span>
              )}
            </p>
          </div>
        </div>

        {error && (
          <div className="mx-auto max-w-[1400px] px-4 pt-6 md:px-6">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400">
              {error}
            </div>
          </div>
        )}

        {/* SEARCH & FILTER */}
        <div className="sticky top-0 z-30 border-b border-dark-100 bg-dark-400/95 py-4 backdrop-blur-md">
          <div className="mx-auto max-w-[1400px] px-4 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by note title or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-dark-100 bg-dark-200 py-3 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="relative w-full md:w-56">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex w-full items-center justify-between rounded-xl border border-dark-100 bg-dark-200 px-4 py-3 text-sm font-medium text-white transition hover:border-brand-primary/30"
                >
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-brand-primary" />
                    <span>
                      {selectedFilter === "all" ? "All Resources" : selectedFilter === "free" ? "Free Only" : "Premium Only"}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${showFilterDropdown ? "rotate-180" : ""}`} />
                </button>

                {showFilterDropdown && (
                  <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-dark-100 bg-dark-300 shadow-xl z-40">
                    {[
                      { id: "all", label: "All Resources" },
                      { id: "free", label: "Free Notes" },
                      { id: "paid", label: "Premium Notes" }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedFilter(option.id);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition ${
                          selectedFilter === option.id
                            ? "bg-brand-primary/10 font-medium text-brand-primary"
                            : "text-gray-300 hover:bg-dark-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* NOTES GRID */}
        <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
          {filteredNotes.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-dark-300 text-gray-500">
                <FileText size={28} />
              </div>
              <p className="mb-2 text-lg font-medium text-white">No resources found</p>
              <p className="text-sm text-gray-400">Try adjusting your search terms or clearing the filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredNotes.map((note) => (
                <NoteCard key={note._id} note={note} isSubscribed={isSubscribed} />
              ))}
            </div>
          )}

          {filteredNotes.length > 0 && (
            <div className="mt-8 pt-6 border-t border-dark-100 text-sm font-medium text-gray-500">
              Showing {filteredNotes.length} of {notes.length} resources
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// NOTE CARD COMPONENT (with subscription‑aware lock)
function NoteCard({ note, isSubscribed }) {
  const navigate = useNavigate();
  // Determine if this note is accessible (free OR subscribed)
  const isAccessible = note.isFree || isSubscribed;
  const downloadUrl = note.file?.url || "#";

  const handleUnlock = () => {
    if (!isSubscribed) {
      navigate("/#pricing"); // redirect to pricing section to subscribe
    }
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-dark-100 bg-dark-200 transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
      
      {/* THUMBNAIL / TOP AREA */}
      <div className="relative flex h-32 w-full items-center justify-center overflow-hidden bg-dark-300">
        <FileText size={48} className="text-dark-100 transition-transform duration-500 group-hover:scale-110 group-hover:text-brand-primary/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-200 to-transparent opacity-80" />

        {/* BADGE */}
        <div className="absolute right-3 top-3 z-10">
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            note.isFree
              ? "bg-brand-primary text-dark-400"
              : "bg-dark-400/90 text-white backdrop-blur-sm"
          }`}>
            {note.isFree ? <Unlock size={10} /> : <Lock size={10} />}
            {note.isFree ? "Free" : "Premium"}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 min-h-[40px] text-base font-bold text-white transition-colors group-hover:text-brand-primary">
          {note.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-400">
          {note.description || "Comprehensive study material and notes."}
        </p>

        {/* TAGS */}
        {note.tags && note.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="rounded-md bg-dark-300 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                {tag}
              </span>
            ))}
            {note.tags.length > 2 && (
              <span className="rounded-md bg-dark-300 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                +{note.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* META INFO */}
        <div className="mt-5 flex items-center justify-between border-t border-dark-100 pt-4 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-1.5">
            <Eye size={14} className="text-brand-primary/70" />
            <span>{note.downloadCount || 0} views</span>
          </div>
          <span className="truncate max-w-[100px] text-right">
            By {note.teacherId?.name || "Instructor"}
          </span>
        </div>

        {/* ACTIONS */}
        <div className="mt-4 pt-2">
          {isAccessible ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={note.title ? `${note.title}.pdf` : "Study_Note.pdf"}
              onClick={(e) => {
                if (downloadUrl === "#") {
                  e.preventDefault();
                  alert("Download link is not available for this file yet.");
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary/10 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-primary hover:text-dark-400"
            >
              <Download size={16} /> Download PDF
            </a>
          ) : (
            <button
              onClick={handleUnlock}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-dark-300 py-2.5 text-sm font-bold text-gray-400 transition-colors hover:bg-dark-100 hover:text-white"
            >
              <Lock size={16} /> Subscribe to Unlock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}