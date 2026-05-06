import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Loader2, Save, ArrowLeft, Eye } from "lucide-react";
import toast from "react-hot-toast";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { createBlog, updateBlog, getBlogById } from "../../services/adminService";

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    [{ align: [] }],
    ["clean"],
  ],
};
const quillFormats = [
  "header", "bold", "italic", "underline", "strike", "blockquote",
  "list", "link", "image", "align",
];

const fieldInput =
  "w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-brand-primary focus:outline-none transition-colors";

export default function BlogEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", published: true });

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    setLoading(true);
    getBlogById(id)
      .then((res) => {
        if (!active) return;
        const blog = res?.blog;
        if (!blog) {
          toast.error("Article not found");
          navigate("/admin/blogs");
          return;
        }
        setForm({
          title: blog.title || "",
          content: blog.content || "",
          published: blog.published ?? true,
        });
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load article");
        navigate("/admin/blogs");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, isEdit, navigate]);

  const handleSave = async () => {
    const isContentEmpty = !form.content || form.content.replace(/<(.|\n)*?>/g, "").trim() === "";
    if (!form.title.trim()) return toast.error("Title is required");
    if (isContentEmpty) return toast.error("Article body is required");

    setSaving(true);
    try {
      if (isEdit) {
        await updateBlog(id, form);
        toast.success("Article updated");
      } else {
        await createBlog(form);
        toast.success("Article published");
      }
      navigate("/admin/blogs");
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-white/60">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading article…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/admin/blogs"
            className="rounded-xl glass-pill p-2.5 text-white/70 hover:text-white transition-colors"
            title="Back to articles"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              {isEdit ? "Editing Article" : "New Article"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
              {isEdit ? form.title || "Untitled" : "Write a new article"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 rounded-xl glass-pill px-3.5 py-2 text-sm cursor-pointer">
            <span className="text-white/70">{form.published ? "Published" : "Draft"}</span>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, published: !p.published }))}
              className={`relative h-5 w-9 rounded-full transition-colors ${form.published ? "bg-brand-primary" : "bg-white/15"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  form.published ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl btn-gradient px-5 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Publish Article"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-2xl glass-card p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="A clear, specific headline that says what the reader will learn"
            className={fieldInput}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Article Body</label>
          <p className="text-[11px] text-white/40">
            Rich-text — supports headings, lists, links, images, blockquotes.
          </p>
          <div className="quill-dark rounded-xl border border-white/10 bg-dark-300 overflow-hidden">
            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={(html) => setForm((p) => ({ ...p, content: html }))}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Start writing…"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      {form.content && (
        <div className="rounded-2xl glass-card p-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-white/50 inline-flex items-center gap-2">
            <Eye size={12} className="text-brand-primary" />
            Live Preview
          </p>
          <div
            className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-brand-primary"
            dangerouslySetInnerHTML={{ __html: form.content }}
          />
        </div>
      )}
    </motion.div>
  );
}
