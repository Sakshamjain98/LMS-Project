import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteBlog, getBlogs } from "../../services/adminService";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Blogs() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [query, setQuery] = useState({ search: "", published: "", page: 1, limit: 10 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => fetchBlogs(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchBlogs = async (params) => {
    try {
      setLoading(true);
      const req = {
        ...params,
        ...(params.published !== "" ? { published: params.published } : {}),
      };
      const res = await getBlogs(req);
      setBlogs(res.blogs || []);
      setPagination(res.pagination || { page: 1, limit: params.limit, totalPages: 1, total: 0 });
    } catch {
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this article permanently?")) return;
    try {
      await deleteBlog(id);
      toast.success("Article deleted");
      const shouldGoPrev = blogs.length === 1 && pagination.page > 1;
      setQuery((prev) => ({ ...prev, page: shouldGoPrev ? prev.page - 1 : prev.page }));
    } catch {
      toast.error("Failed to delete article");
    }
  };

  const summaryText = useMemo(() => {
    if (!pagination.total) return "No articles yet";
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `Showing ${start}-${end} of ${pagination.total} articles`;
  }, [pagination]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Articles</h1>
          <p className="text-grayCustom-medium mt-1 text-sm font-medium">
            Long-form articles surfaced on the public landing page.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/blogs/new")}
          className="inline-flex items-center gap-2 rounded-xl btn-gradient px-5 py-3 font-bold"
        >
          <Plus size={18} />
          New Article
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayCustom-medium" />
            <input
              value={query.search}
              onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, search: e.target.value }))}
              placeholder="Search title or content"
              className="w-full rounded-xl border border-white/10 bg-dark-300/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-grayCustom-medium/70 focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            />
          </div>
          <div className="w-full lg:w-52">
            <select
              value={query.published}
              onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, published: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-dark-300/70 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
            >
              <option value="">All statuses</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-dark-300/70 text-grayCustom-medium uppercase tracking-wider text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Title</th>
                <th className="px-5 py-3 text-left">Excerpt</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-grayCustom-medium">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Loading articles…
                    </div>
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-grayCustom-medium">
                    No articles match this filter — try{" "}
                    <Link to="/admin/blogs/new" className="text-brand-primary font-semibold hover:underline">creating one</Link>.
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog._id} className="text-white/90 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-semibold">
                      <Link to={`/admin/blogs/${blog._id}/edit`} className="hover:text-brand-primary">
                        {blog.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 max-w-sm truncate text-grayCustom-medium">
                      {(blog.content || "").replace(/<(.|\n)*?>/g, "").slice(0, 120) || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${blog.published ? "bg-emerald-500/15 text-emerald-300" : "bg-yellow-500/15 text-yellow-300"}`}>
                        {blog.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-grayCustom-medium">{new Date(blog.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/blogs/${blog._id}/edit`}
                          className="rounded-lg border border-white/10 p-2 text-grayCustom-medium transition-colors hover:text-white"
                          aria-label="Edit article"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="rounded-lg border border-red-500/30 p-2 text-red-300 transition-colors hover:bg-red-500/10"
                          aria-label="Delete article"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-3 text-sm text-grayCustom-medium md:flex-row md:items-center md:justify-between">
          <span>{summaryText}</span>
          <div className="flex items-center gap-2">
            <select
              value={query.limit}
              onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, limit: Number(e.target.value) }))}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={20}>20 / page</option>
            </select>
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-white/80 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-white/80">Page {pagination.page} / {pagination.totalPages || 1}</span>
            <button
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-white/80 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
