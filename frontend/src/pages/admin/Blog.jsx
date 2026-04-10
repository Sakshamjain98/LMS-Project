import { useEffect, useState } from "react";
import { createBlog, deleteBlog, getBlogs } from "../../services/adminService"; // Updated import
import { Newspaper, Plus, Trash2, Send, Loader2, Calendar, User } from "lucide-react";
import toast from "react-hot-toast";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "", published: true });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await getBlogs(); // Use the admin service to fetch blogs
      if (res && res.blogs) {
        setBlogs(res.blogs);
      } else {
        setBlogs([]);
      }
    } catch (error) {
      toast.error("Failed to load blogs");
      console.error("Blog Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return toast.error("Please fill all fields");

    setSubmitting(true);
    try {
      await createBlog(formData);
      toast.success("Blog post created!");
      setFormData({ title: "", content: "", published: true });
      fetchBlogs();
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
      fetchBlogs();
    } catch (error) {
      toast.error("Failed to delete blog");
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Blog Management</h1>
        <p className="text-grayCustom-medium mt-1 text-sm font-medium">Create and manage articles for the community.</p>
      </div>

      {/* Create Blog Form */}
      <div className="bg-dark-200 border border-dark-100 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-dark-300/50 px-6 py-4 border-b border-dark-100 flex items-center gap-2">
          <Plus className="text-brand-primary" size={18} />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">New Post</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-grayCustom-medium uppercase ml-1">Title</label>
            <input
              type="text"
              placeholder="Enter a catchy title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-dark-400 border border-dark-100 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-grayCustom-medium uppercase ml-1">Content</label>
            <textarea
              placeholder="Write your blog content here..."
              rows="4"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-dark-400 border border-dark-100 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              disabled={submitting}
              className="bg-brand-primary hover:bg-brand-primaryDark text-dark-400 font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/10 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              Publish Post
            </button>
          </div>
        </form>
      </div>

      {/* Blog List */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Newspaper className="text-brand-primary" />
          <h2 className="text-xl font-bold text-white">Existing Articles</h2>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-primary" size={32} />
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-dark-200 border border-dark-100 border-dashed rounded-2xl p-12 text-center text-grayCustom-medium">
            No blogs found. Start by creating your first post.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.map((blog) => (
              <div key={blog._id} className="bg-dark-200 border border-dark-100 rounded-2xl p-6 flex flex-col justify-between hover:border-brand-primary/30 transition-all group shadow-lg">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight">
                      {blog.title}
                    </h3>
                    <button 
                      onClick={() => handleDelete(blog._id)}
                      className="text-grayCustom-medium hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-grayCustom-medium text-sm line-clamp-3 leading-relaxed">
                    {blog.content}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-dark-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-4 text-grayCustom-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-brand-primary" />
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User size={12} className="text-brand-primary" />
                      Admin
                    </span>
                  </div>
                  <span className="text-brand-primary">Active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}