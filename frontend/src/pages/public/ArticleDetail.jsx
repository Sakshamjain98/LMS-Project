import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2, BookOpen, Sparkles } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import { getPublicArticleById } from "../../services/studentService";

// Approximate "5 min read" out of HTML content. Strips tags, counts words,
// divides by 200 wpm. Bounded so empty / very long articles still look sane.
const estimateReadingTime = (html = "") => {
  const text = String(html).replace(/<[^>]*>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
};

export default function ArticleDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [article, setArticle] = useState(null);

  useEffect(() => {
    let active = true;
    getPublicArticleById(id)
      .then((res) => { if (active) setArticle(res?.blog || null); })
      .catch((err) => { if (active) setError(err?.message || "This article isn't available."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-dark-400 text-white">
      <Navbar />

      {/* Ambient gradient backdrop — sits behind the hero and fades into the body. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(0,186,124,0.18),transparent_70%)]" />
        <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-brand-primary/15 blur-3xl" />
        <div className="absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-brand-accent/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-dark-400" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-4 pt-28 pb-20 sm:px-6 md:px-8">
        {/* Breadcrumb / back nav */}
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-white/50 min-w-0">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link to="/#blog" className="hover:text-white">Articles</Link>
          <span>/</span>
          <span className="text-white/80 truncate min-w-0 max-w-[20ch] sm:max-w-[40ch]">
            {article?.title || "—"}
          </span>
        </nav>

        <Link
          to="/#blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
        >
          <ArrowLeft size={16} /> All articles
        </Link>

        {loading ? (
          <div className="mt-16 flex items-center justify-center text-white/60">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading article…
          </div>
        ) : error ? (
          <div className="mt-12 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
            {error}
          </div>
        ) : article ? (
          <article className="mt-6 animate-fade-up">
            {/* Hero card — sits over the gradient, glassy treatment */}
            <header className="relative overflow-hidden rounded-3xl glass-panel ambient-glow p-6 md:p-10">
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 rounded-full glass-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/70">
                  <Sparkles size={12} className="text-brand-primary" />
                  Knowledge Hub
                </span>
                <h1 className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-white wrap-break-word">
                  {article.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={12} className="text-brand-primary" />
                    {new Date(article.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </span>
                  <span className="hidden sm:inline text-white/20">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen size={12} className="text-brand-primary" />
                    {estimateReadingTime(article.content)}
                  </span>
                </div>
              </div>
            </header>

            {/* Body — `article-body` (defined in index.css) constrains every
                HTML element to the column width, so embedded images / tables /
                long URLs can't overflow the page. */}
            <div
              className="article-body prose prose-invert max-w-none mt-10"
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
