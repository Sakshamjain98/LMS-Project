import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import { getPublicArticleById } from "../../services/studentService";

export default function ArticleDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [article, setArticle] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getPublicArticleById(id)
      .then((res) => { if (active) setArticle(res?.blog || null); })
      .catch((err) => { if (active) setError(err?.message || "This article isn't available."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return (
    <div className="text-white min-h-screen">
      <Navbar />

      <div className="mx-auto w-full max-w-3xl px-5 pt-28 pb-20 md:px-8">
        {/* Breadcrumb / back nav */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-white/50">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link to="/#blog" className="hover:text-white">Articles</Link>
          <span>/</span>
          <span className="text-white/80 truncate max-w-[40ch]">{article?.title || "—"}</span>
        </nav>

        <Link
          to="/#blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
        >
          <ArrowLeft size={16} /> All articles
        </Link>

        {loading ? (
          <div className="mt-12 flex items-center justify-center text-white/60">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading article…
          </div>
        ) : error ? (
          <div className="mt-12 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
            {error}
          </div>
        ) : article ? (
          <article className="mt-6 animate-fade-up">
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight break-words">
                {article.title}
              </h1>
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-white/50">
                <Calendar size={12} />
                {new Date(article.createdAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </header>

            <div
              className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-brand-primary prose-strong:text-white prose-blockquote:border-brand-primary"
              dangerouslySetInnerHTML={{ __html: article.content || "" }}
            />

            <div className="mt-12 border-t border-white/10 pt-6">
              <Link to="/#blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline">
                <ArrowLeft size={14} /> Back to all articles
              </Link>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
