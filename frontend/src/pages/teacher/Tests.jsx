import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Clock, CheckCircle2, FileText, Trash2, BarChart3, ExternalLink, Plus, AlertCircle, Search } from "lucide-react";
import { getTeacherTests, deleteTeacherTest } from "../../services/teacherService";
import TestStatCard from "../../components/teacher/tests/TestStatCard";
import TestEmptyState from "../../components/teacher/tests/TestEmptyState";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

export default function Tests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, testId: null });
  const [filters, setFilters] = useState({ search: "", status: "" });
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
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [filters.status, limit]);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTeacherTests({
        search: debouncedSearch,
        status: filters.status,
        page,
        limit,
      });
      setTests(res.tests || []);
      setPagination(
        res.pagination || {
          page: 1,
          limit,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (err) {
      setError(err.message || "Failed to load tests");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.status, page, limit]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const stats = useMemo(() => {
    const total = tests.length;
    const draft = tests.filter((t) => t.status === "draft").length;
    const published = tests.filter((t) => t.status === "published").length;
    const totalQuestions = tests.reduce((sum, test) => sum + (test.questions?.length || 0), 0);
    return { total, draft, published, totalQuestions };
  }, [tests]);

  const handleDelete = async () => {
    try {
      await deleteTeacherTest(deleteModal.testId);
      const shouldGoPrev = tests.length === 1 && pagination.page > 1;
      setPage((prev) => (shouldGoPrev ? prev - 1 : prev));
      fetchTests();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteModal({ isOpen: false, testId: null });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white/60 font-medium">Loading assessments...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Test Management</h1>
          <p className="text-white/50 mt-2 text-sm font-medium">Create and manage assessments</p>
        </div>
        <button
          onClick={() => navigate("/teacher/tests/create")}
          className="flex items-center justify-center gap-2 bg-brand-primary text-black px-6 py-3 rounded-xl font-semibold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-primary/20"
        >
          <Plus size={20} strokeWidth={2.5} />
          Create Test
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl flex flex-wrap gap-3 items-center">
        <div className="relative min-w-70 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search tests by title or description"
            className="w-full rounded-xl border border-white/10 bg-dark-300/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          className="rounded-xl border border-white/10 bg-dark-300/70 px-4 py-2.5 text-sm text-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <TestStatCard icon={<FileText className="text-blue-400" size={22} />} title="Total Tests" value={stats.total} />
        <TestStatCard icon={<Clock className="text-amber-400" size={22} />} title="Drafts" value={stats.draft} />
        <TestStatCard icon={<CheckCircle2 className="text-emerald-400" size={22} />} title="Published" value={stats.published} />
        <TestStatCard icon={<ClipboardList className="text-purple-400" size={22} />} title="Questions" value={stats.totalQuestions} />
      </div>

      {/* Tests List */}
      <div className="bg-dark-200 border border-white/5 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="text-brand-primary" size={24} />
            All Tests
          </h2>
        </div>

        {tests.length === 0 ? (
          <TestEmptyState 
            title="No tests created yet" 
            subtitle="Start by creating your first assessment to evaluate student knowledge."
          />
        ) : (
          <div className="grid gap-4">
            {tests.map((test) => (
              <div
                key={test._id}
                className="group bg-dark-100 border border-white/5 rounded-xl p-6 hover:border-brand-primary/30 hover:bg-white/2 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-white group-hover:text-brand-primary transition-colors">
                        {test.title}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                        test.status === "published" 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                          : test.status === "scheduled"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                      }`}>
                        {test.status}
                      </span>
                    </div>

                    {test.description && (
                      <p className="text-sm text-white/50 mb-4 line-clamp-1">
                        {test.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-white/60">
                        <ClipboardList size={16} className="text-blue-400/70" />
                        <span>{test.questions?.length || 0} Questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <Clock size={16} className="text-amber-400/70" />
                        <span>{test.duration || 0} min</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <FileText size={16} className="text-purple-400/70" />
                        <span className="font-medium text-brand-primary">{test.totalMarks || 0} marks</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 lg:shrink-0">
                    <button
                      onClick={() => navigate(`/teacher/tests/${test._id}`)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors"
                    >
                      <ExternalLink size={16} />
                      <span className="hidden sm:inline">Open</span>
                    </button>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, testId: test._id })}
                      className="p-2.5 rounded-lg bg-red-500/5 hover:bg-red-500/15 text-red-400/60 hover:text-red-400 transition-colors"
                      title="Delete test"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 border-t border-white/10 pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/60">
            Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total || 0)}-
            {Math.min(pagination.page * pagination.limit, pagination.total || 0)} of {pagination.total || 0}
          </p>
          <div className="flex items-center gap-2 justify-end">
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

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, testId: null })}
        onConfirm={handleDelete}
        title="Delete Test"
        message="This will permanently delete the test and all associated data. This action cannot be undone."
      />
    </div>
  );
}