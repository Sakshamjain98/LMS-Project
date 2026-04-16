import { useEffect, useMemo, useState } from "react";
import { createBlog, deleteBlog, getBlogs, updateBlog } from "../../services/adminService";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [query, setQuery] = useState({ search: "", published: "", page: 1, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "", published: true });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBlogs(query);
    }, 300);

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
    } catch (error) {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBlog(null);
    setFormData({ title: "", content: "", published: true });
    setShowModal(true);
  };

  const openEditModal = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || "",
      content: blog.content || "",
      published: blog.published ?? true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBlog(null);
    setFormData({ title: "", content: "", published: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return toast.error("Please fill all fields");

    setSubmitting(true);
    try {
      if (editingBlog) {
        await updateBlog(editingBlog._id, formData);
        toast.success("Blog updated");
      } else {
        await createBlog(formData);
        toast.success("Blog created");
      }

      closeModal();
      fetchBlogs(query);
    } catch (error) {
      toast.error(error.message || "Failed to create blog");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this blog post permanently?")) return;
    try {
      await deleteBlog(id);
      toast.success("Blog deleted");
      const shouldGoPrev = blogs.length === 1 && pagination.page > 1;
      setQuery((prev) => ({ ...prev, page: shouldGoPrev ? prev.page - 1 : prev.page }));
    } catch (error) {
      toast.error("Failed to delete blog");
    }
  };

  const summaryText = useMemo(() => {
    if (!pagination.total) return "No posts found";
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `Showing ${start}-${end} of ${pagination.total} posts`;
  }, [pagination]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Blog Management</h1>
            <p className="text-grayCustom-medium mt-1 text-sm font-medium">Manage all blogs from one searchable control table.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 font-bold text-dark-400 transition-all hover:bg-brand-primaryDark shadow-lg shadow-brand-primary/15"
          >
            <Plus size={18} />
            Create Blog
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
              <option value="">All status</option>
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
                <th className="px-5 py-3 text-left">Content</th>
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
                      Loading posts...
                    </div>
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-grayCustom-medium">No blogs found for this filter.</td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog._id} className="text-white/90 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-semibold">{blog.title}</td>
                    <td className="px-5 py-4 max-w-sm truncate text-grayCustom-medium">{blog.content}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${blog.published ? "bg-emerald-500/15 text-emerald-300" : "bg-yellow-500/15 text-yellow-300"}`}>
                        {blog.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-grayCustom-medium">{new Date(blog.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(blog)}
                          className="rounded-lg border border-white/10 p-2 text-grayCustom-medium transition-colors hover:text-white"
                          aria-label="Edit blog"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="rounded-lg border border-red-500/30 p-2 text-red-300 transition-colors hover:bg-red-500/10"
                          aria-label="Delete blog"
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

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-dark-400/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-dark-200/95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-bold text-white">{editingBlog ? "Edit Blog" : "Create Blog"}</h2>
              <button onClick={closeModal} className="rounded-md p-1.5 text-grayCustom-medium transition-colors hover:text-white" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="space-y-1">
                <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">Content</label>
                <textarea
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  required
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-grayCustom-medium">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData((prev) => ({ ...prev, published: e.target.checked }))}
                  className="h-4 w-4 rounded border-white/20 bg-dark-300"
                />
                Publish immediately
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={closeModal} className="rounded-xl px-4 py-2 font-semibold text-grayCustom-medium hover:text-white">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2 font-bold text-dark-400 transition-colors hover:bg-brand-primaryDark disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingBlog ? "Save Changes" : "Create Blog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}