import { useEffect, useState } from "react";
import { getAllNews, createNews, updateNews, deleteNews } from "../../services/adminService";
import { Plus, Edit2, Trash2, X, Search, Filter, Newspaper, Image as ImageIcon, CheckCircle2, Clock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    imageUrl: "",
    published: true,
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await getAllNews();
      setNews(res.news || []);
    } catch (error) {
      toast.error("Failed to load news articles");
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === "" ? true : 
                         filters.status === "published" ? item.published : !item.published;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNews) {
        await updateNews(editingNews._id, formData);
        toast.success("Article updated");
      } else {
        await createNews(formData);
        toast.success("Article published");
      }
      closeModal();
      fetchNews();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (newsId) => {
    if (window.confirm("Delete this article permanently?")) {
      try {
        await deleteNews(newsId);
        toast.success("Article removed");
        fetchNews();
      } catch (error) {
        toast.error("Failed to delete");
      }
    }
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Newsroom</h1>
          <p className="text-grayCustom-medium mt-1 text-sm font-medium">Broadcast updates and announcements to your users.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-primary hover:bg-brand-primaryDark text-dark-400 font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/10"
        >
          <Plus size={20} />
          Create Post
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-dark-200 border border-dark-100 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-grayCustom-medium w-4 h-4" />
          <input
            type="text"
            placeholder="Search by headline..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full bg-dark-300 border border-dark-100 text-white pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-grayCustom-medium/40"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="text-brand-primary w-4 h-4" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-dark-300 border border-dark-100 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer text-sm font-bold uppercase tracking-wider"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* News Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-brand-primary" size={32} />
          <span className="text-grayCustom-medium font-medium">Syncing newsfeed...</span>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="bg-dark-200 border border-dark-100 border-dashed rounded-2xl p-20 text-center text-grayCustom-medium">
          No articles found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredNews.map((item) => (
            <div key={item._id} className="bg-dark-200 border border-dark-100 rounded-2xl p-6 hover:bg-dark-100/30 transition-all group">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${item.published ? "bg-brand-primary/10 text-brand-primary" : "bg-yellow-500/10 text-yellow-500"}`}>
                      {item.published ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                      {item.published ? "Published" : "Draft"}
                    </span>
                    <span className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-tighter">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight group-hover:text-brand-primary transition-colors">{item.title}</h3>
                  <p className="text-grayCustom-medium text-sm line-clamp-2 leading-relaxed">
                    {item.summary || item.content}
                  </p>
                </div>
                <div className="flex items-center gap-2 lg:self-center">
                  <button onClick={() => handleEdit(item)} className="p-3 text-grayCustom-medium hover:text-white hover:bg-dark-100 rounded-xl transition-all">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(item._id)} className="p-3 text-grayCustom-medium hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* The Dark Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-dark-400/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 border border-dark-100 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-dark-100 bg-dark-300/50">
              <div className="flex items-center gap-3">
                <Newspaper className="text-brand-primary" size={20} />
                <h2 className="text-lg font-bold text-white tracking-tight">{editingNews ? "Edit Article" : "Compose News"}</h2>
              </div>
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
                    className="w-full bg-dark-400 border border-dark-100 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-gray-700"
                    placeholder="Brief hook for the newsfeed..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-widest ml-1">Body Content</label>
                  <textarea
                    required
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full bg-dark-400 border border-dark-100 text-white px-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all resize-none"
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
                  <button type="submit" className="px-8 py-3 bg-brand-primary text-dark-400 font-bold rounded-xl hover:bg-brand-primaryDark transition-all shadow-lg shadow-brand-primary/10">
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