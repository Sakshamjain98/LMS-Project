import { useEffect, useMemo, useState } from "react";
import { getAllNews, createNews, updateNews, deleteNews } from "../../services/adminService";
import { Plus, Pencil, Trash2, X, Search, Filter, Image as ImageIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import RichTextEditor from "../../components/editor/RichTextEditor";
import { isRichTextEmpty, stripHtml } from "../../utils/richText";
import { VisibilityToggle } from "../../components/admin/VisibilityToggle";

export default function News() {
  const [news, setNews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [query, setQuery] = useState({ search: "", status: "", page: 1, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    imageUrl: "",
    published: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNews(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchNews = async (params) => {
    try {
      setLoading(true);
      const req = {
        ...params,
        ...(params.status === "" ? {} : { published: params.status === "published" }),
      };
      const res = await getAllNews(req);
      setNews(res.news || []);
      setPagination(res.pagination || { page: 1, limit: params.limit, totalPages: 1, total: 0 });
    } catch {
      toast.error("Failed to load news articles");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRichTextEmpty(formData.content)) {
      toast.error("Body content is required");
      return;
    }
    try {
      setSubmitting(true);
      if (editingNews) {
        await updateNews(editingNews._id, formData);
        toast.success("Article updated");
      } else {
        await createNews(formData);
        toast.success("Article published");
      }
      closeModal();
      fetchNews(query);
    } catch {
      toast.error("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (newsId) => {
    if (window.confirm("Delete this article permanently?")) {
      try {
        await deleteNews(newsId);
        toast.success("Article removed");
        const shouldGoPrev = news.length === 1 && pagination.page > 1;
        setQuery((prev) => ({ ...prev, page: shouldGoPrev ? prev.page - 1 : prev.page }));
      } catch {
        toast.error("Failed to delete");
      }
    }
  };

  const handleTogglePublished = async (item, nextPublished) => {
    await updateNews(item._id, { published: nextPublished });
    setNews((prev) => prev.map((n) => (n._id === item._id ? { ...n, published: nextPublished } : n)));
  };

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      summary: newsItem.summary || "",
      imageUrl: newsItem.imageUrl || "",
      published: newsItem.published,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNews(null);
    setFormData({ title: "", content: "", summary: "", imageUrl: "", published: true });
  };

  const summaryText = useMemo(() => {
    if (!pagination.total) return "No news found";
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `Showing ${start}-${end} of ${pagination.total} articles`;
  }, [pagination]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Newsroom</h1>
          <p className="text-grayCustom-medium mt-1 text-sm font-medium">Broadcast updates and announcements to your users.</p>
        </div>
        <button
          onClick={() => {
            setEditingNews(null);
            setFormData({ title: "", content: "", summary: "", imageUrl: "", published: true });
            setShowModal(true);
          }}
          className="bg-brand-primary hover:bg-brand-primaryDark text-dark-400 font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/10"
        >
          <Plus size={20} />
          Create Post
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl flex flex-wrap gap-4 items-center">
        <div className="relative min-w-70 flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-grayCustom-medium w-4 h-4" />
          <input
            type="text"
            placeholder="Search by headline..."
            value={query.search}
            onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, search: e.target.value }))}
            className="w-full bg-dark-300/70 border border-white/10 text-white pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-grayCustom-medium/40"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="text-brand-primary w-4 h-4" />
          <select
            value={query.status}
            onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, status: e.target.value }))}
            className="bg-dark-300/70 border border-white/10 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer text-sm font-bold uppercase tracking-wider"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-brand-primary" size={32} />
          <span className="text-grayCustom-medium font-medium">Syncing newsfeed...</span>
        </div>
      ) : news.length === 0 ? (
        <div className="bg-dark-200 border border-dark-100 border-dashed rounded-2xl p-20 text-center text-grayCustom-medium">
          No articles found matching your filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-dark-300/70 text-grayCustom-medium uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">Headline</th>
                  <th className="px-5 py-3 text-left">Summary</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {news.map((item) => (
                  <tr key={item._id} className="text-white/90 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-semibold">{item.title}</td>
                    <td className="px-5 py-4 max-w-sm truncate text-grayCustom-medium">{item.summary || stripHtml(item.content)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${item.published ? "bg-emerald-500/15 text-emerald-300" : "bg-yellow-500/15 text-yellow-300"}`}>
                        {item.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-grayCustom-medium">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <VisibilityToggle isVisible={item.published} onToggle={(next) => handleTogglePublished(item, next)} />
                        <button onClick={() => handleEdit(item)} className="rounded-lg border border-white/10 p-2 text-grayCustom-medium transition-colors hover:text-white" aria-label="Edit news">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(item._id)} className="rounded-lg border border-red-500/30 p-2 text-red-300 transition-colors hover:bg-red-500/10" aria-label="Delete news">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
      )}

      {showModal && (
        <div className="fixed inset-0 bg-dark-400/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 border border-dark-100 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-dark-100 bg-dark-300/50">
              <h2 className="text-lg font-bold text-white tracking-tight">{editingNews ? "Edit Article" : "Create Article"}</h2>
              <button onClick={closeModal} className="p-2 text-grayCustom-medium hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-widest ml-1">Headline</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-dark-400 border border-dark-100 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-widest ml-1">Short Summary</label>
                  <input
                    type="text"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full bg-dark-400 border border-dark-100 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                    placeholder="Brief hook for the newsfeed..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-widest ml-1">Body Content</label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Write the announcement with headings, lists, links, or images…"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-widest ml-1 flex items-center gap-2">
                    <ImageIcon size={12}/> Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-dark-400 border border-dark-100 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-dark-100">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setFormData({...formData, published: !formData.published})}>
                  <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${formData.published ? 'bg-brand-primary' : 'bg-dark-100'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.published ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Visibility: {formData.published ? 'Public' : 'Hidden'}</span>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} className="px-6 py-3 font-bold text-grayCustom-medium hover:text-white transition-all">
                    Discard
                  </button>
                  <button type="submit" disabled={submitting} className="px-8 py-3 btn-gradient font-bold rounded-xl hover:bg-brand-primaryDark transition-all shadow-lg shadow-brand-primary/10 disabled:opacity-60 inline-flex items-center gap-2">
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {editingNews ? "Update Post" : "Publish Post"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
