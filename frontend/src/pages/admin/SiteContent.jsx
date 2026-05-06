import { useEffect, useState } from "react";
import {
  Loader2, Plus, Save, Trash2, ImagePlus,
  LayoutTemplate, FileText, Award, MessageCircle, ListChecks, Phone, Layers,
  Sparkles, BarChart3, Star,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getAdminSiteContent,
  updateAdminSiteContent,
  uploadSiteImage,
} from "../../services/adminService";
import { normalizeYouTubeUrl } from "../../utils/youtube";

// Empty scaffold used when the API can't be reached — admin can still author
// content and save once the backend is back up.
const EMPTY_CONTENT = {
  hero: {
    eyebrow: "",
    titlePrefix: "",
    titleHighlight: "",
    subtitle: "",
    primaryCtaLabel: "Login",
    secondaryCtaLabel: "Browse Tests",
    videoUrl: "",
  },
  about: { eyebrow: "", title: "", paragraphs: [""] },
  features: [],
  whyChooseUs: { eyebrow: "Why Choose Us", title: "", subtitle: "", items: [] },
  stats: [],
  testimonials: [],
  studentReviews: [],
  testSeriesHighlights: [],
  faq: [],
  footer: { brand: "", description: "", contactEmail: "", contactPhone: "" },
};

const fieldInput =
  "w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-primary focus:outline-none transition-colors";

const Label = ({ label, hint, required, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70">
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-white/40">{hint}</p>}
  </div>
);

const TABS = [
  { key: "hero",                 label: "Hero",            icon: LayoutTemplate },
  { key: "about",                label: "About",           icon: FileText },
  { key: "stats",                label: "Stats",           icon: BarChart3 },
  { key: "features",             label: "Features",        icon: Award },
  { key: "whyChooseUs",          label: "Why Choose Us",   icon: Sparkles },
  { key: "testSeriesHighlights", label: "Highlights",      icon: Layers },
  { key: "testimonials",         label: "Testimonials",    icon: MessageCircle },
  { key: "studentReviews",       label: "Student Reviews", icon: Star },
  { key: "faq",                  label: "FAQ",             icon: ListChecks },
  { key: "footer",               label: "Footer",          icon: Phone },
];

export default function SiteContent() {
  const [tab, setTab] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState(null);

  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminSiteContent()
      .then((res) => {
        if (!active) return;
        setContent(res?.data || EMPTY_CONTENT);
        setLoadError(null);
      })
      .catch((err) => {
        if (!active) return;
        // Fall back to an empty scaffold so the page is usable.
        setContent(EMPTY_CONTENT);
        const msg = err?.message || "Could not reach the site-content API. Editing locally — restart the backend to load saved content.";
        setLoadError(msg);
        toast.error(msg);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      const res = await updateAdminSiteContent(content);
      setContent(res?.data || content);
      toast.success("Site content updated — landing page will reflect changes immediately.");
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const set = (path, value) => {
    setContent((prev) => {
      const next = structuredClone(prev || {});
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = cur[parts[i]] ?? {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const setList = (key, fn) => {
    setContent((prev) => {
      const next = structuredClone(prev || {});
      next[key] = fn(next[key] || []);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-white/60">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading site content…
      </div>
    );
  }
  if (!content) {
    return <div className="rounded-2xl glass-card p-10 text-center text-white/60">Failed to load content.</div>;
  }

  // Banner shown when the API was unreachable but we fell back to a local scaffold.
  const offlineBanner = loadError ? (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
      <strong>Couldn't load saved content from the server.</strong>
      <p className="mt-1 text-amber-100/80">{loadError}</p>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      {offlineBanner}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="rounded-3xl glass-panel ambient-glow p-7 md:p-8 relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full glass-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/70">
              <LayoutTemplate size={12} className="text-brand-primary" /> Landing CMS
            </span>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Site Content Manager</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Edit every static section of the public landing page — hero, about, features, testimonials, FAQ, footer.
              Saved instantly via API; no redeploy needed.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl btn-gradient px-5 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving…" : "Save All Changes"}
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl glass-card p-1.5">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                active ? "btn-gradient" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="rounded-2xl glass-card p-6"
      >
        {tab === "hero"                && <HeroForm    value={content.hero} onChange={(v) => set("hero", v)} />}
        {tab === "about"               && <AboutForm   value={content.about} onChange={(v) => set("about", v)} />}
        {tab === "stats"               && <ListEditor list={content.stats || []}            onChange={(fn) => setList("stats", fn)}                schema={statsSchema}         title="Stat cards (label + value)" />}
        {tab === "features"            && <ListEditor list={content.features}              onChange={(fn) => setList("features", fn)}             schema={featuresSchema}      title="Feature cards" />}
        {tab === "whyChooseUs"         && <WhyChooseUsForm value={content.whyChooseUs}      onChange={(v) => set("whyChooseUs", v)} />}
        {tab === "testSeriesHighlights"&& <ListEditor list={content.testSeriesHighlights}   onChange={(fn) => setList("testSeriesHighlights", fn)} schema={highlightsSchema}    title="Test-series highlight cards" />}
        {tab === "testimonials"        && <ListEditor list={content.testimonials}           onChange={(fn) => setList("testimonials", fn)}         schema={testimonialsSchema}  title="Testimonials" />}
        {tab === "studentReviews"      && <ListEditor list={content.studentReviews || []}   onChange={(fn) => setList("studentReviews", fn)}       schema={studentReviewsSchema} title="Student review bento (with image)" />}
        {tab === "faq"                 && <ListEditor list={content.faq}                    onChange={(fn) => setList("faq", fn)}                  schema={faqSchema}           title="FAQ entries" />}
        {tab === "footer"              && <FooterForm  value={content.footer} onChange={(v) => set("footer", v)} />}
      </motion.div>
    </div>
  );
}

// ─── Forms ─────────────────────────────────────────────────────────────────

function HeroForm({ value = {}, onChange }) {
  const upd = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-5">
      <Label label="Eyebrow Text" hint="Tiny badge above the headline.">
        <input value={value.eyebrow || ""} onChange={(e) => upd("eyebrow", e.target.value)} className={fieldInput} />
      </Label>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Label label="Headline (start)" required>
          <input value={value.titlePrefix || ""} onChange={(e) => upd("titlePrefix", e.target.value)} className={fieldInput} placeholder="Master Pharmacy with" />
        </Label>
        <Label label="Headline (highlighted)" hint="Rendered in brand-primary color." required>
          <input value={value.titleHighlight || ""} onChange={(e) => upd("titleHighlight", e.target.value)} className={fieldInput} placeholder="Structured Learning" />
        </Label>
      </div>
      <Label label="Subtitle">
        <textarea rows={3} value={value.subtitle || ""} onChange={(e) => upd("subtitle", e.target.value)} className={`${fieldInput} resize-none`} />
      </Label>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Label label="Primary CTA Label">
          <input value={value.primaryCtaLabel || ""} onChange={(e) => upd("primaryCtaLabel", e.target.value)} className={fieldInput} />
        </Label>
        <Label label="Secondary CTA Label">
          <input value={value.secondaryCtaLabel || ""} onChange={(e) => upd("secondaryCtaLabel", e.target.value)} className={fieldInput} />
        </Label>
      </div>
      <Label
        label="Hero Video URL"
        hint="Paste any YouTube link — watch, youtu.be, playlist, or embed. We auto-convert to the embed form when rendering."
      >
        <input
          value={value.videoUrl || ""}
          onChange={(e) => upd("videoUrl", e.target.value)}
          className={fieldInput}
          placeholder="https://www.youtube.com/watch?v=…"
        />
        {value.videoUrl && (
          <p className="mt-1.5 text-[11px] text-white/40">
            Will embed as:{" "}
            <span className="text-brand-primary break-all">{normalizeYouTubeUrl(value.videoUrl)}</span>
          </p>
        )}
      </Label>
    </div>
  );
}

// "Why Choose Us" — heading + bullet list. Stored under content.whyChooseUs.
function WhyChooseUsForm({ value = {}, onChange }) {
  const upd = (k, v) => onChange({ ...value, [k]: v });
  const items = value.items || [];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Label label="Eyebrow"><input value={value.eyebrow || ""} onChange={(e) => upd("eyebrow", e.target.value)} className={fieldInput} /></Label>
        <Label label="Title" required><input value={value.title || ""} onChange={(e) => upd("title", e.target.value)} className={fieldInput} placeholder="Why students choose us" /></Label>
      </div>
      <Label label="Subtitle"><textarea rows={2} value={value.subtitle || ""} onChange={(e) => upd("subtitle", e.target.value)} className={`${fieldInput} resize-none`} /></Label>
      <Label label="Reasons" hint="Each card has a short title and a one-line description.">
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Reason {i + 1}</span>
                <button
                  onClick={() => upd("items", items.filter((_, j) => j !== i))}
                  className="rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Label label="Title">
                  <input
                    value={it.title || ""}
                    onChange={(e) => upd("items", items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                    className={fieldInput}
                  />
                </Label>
                <Label label="Icon (emoji or short label)" hint="Optional decorative tag.">
                  <input
                    value={it.icon || ""}
                    onChange={(e) => upd("items", items.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))}
                    className={fieldInput}
                    placeholder="✨"
                  />
                </Label>
              </div>
              <Label label="Description">
                <textarea
                  rows={2}
                  value={it.description || ""}
                  onChange={(e) => upd("items", items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                  className={`${fieldInput} resize-none`}
                />
              </Label>
            </div>
          ))}
          <button
            onClick={() => upd("items", [...items, { title: "", description: "", icon: "" }])}
            className="inline-flex items-center gap-2 rounded-xl glass-pill px-3 py-1.5 text-xs text-white/80 hover:text-white"
          >
            <Plus size={12} /> Add reason
          </button>
        </div>
      </Label>
    </div>
  );
}

function AboutForm({ value = {}, onChange }) {
  const upd = (k, v) => onChange({ ...value, [k]: v });
  const paragraphs = value.paragraphs || [];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Label label="Eyebrow"><input value={value.eyebrow || ""} onChange={(e) => upd("eyebrow", e.target.value)} className={fieldInput} /></Label>
        <Label label="Title" required><input value={value.title || ""} onChange={(e) => upd("title", e.target.value)} className={fieldInput} /></Label>
      </div>
      <Label label="Paragraphs" hint="One paragraph per text area. Use the buttons to add or remove.">
        <div className="space-y-3">
          {paragraphs.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                rows={3}
                value={p}
                onChange={(e) => upd("paragraphs", paragraphs.map((x, j) => (j === i ? e.target.value : x)))}
                className={`${fieldInput} resize-none`}
              />
              <button
                onClick={() => upd("paragraphs", paragraphs.filter((_, j) => j !== i))}
                className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 self-start mt-1"
                title="Remove paragraph"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => upd("paragraphs", [...paragraphs, ""])}
            className="inline-flex items-center gap-2 rounded-xl glass-pill px-3 py-1.5 text-xs text-white/80 hover:text-white"
          >
            <Plus size={12} /> Add paragraph
          </button>
        </div>
      </Label>
    </div>
  );
}

function FooterForm({ value = {}, onChange }) {
  const upd = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-5">
      <Label label="Brand"><input value={value.brand || ""} onChange={(e) => upd("brand", e.target.value)} className={fieldInput} /></Label>
      <Label label="Description" hint="Short paragraph shown next to the brand.">
        <textarea rows={2} value={value.description || ""} onChange={(e) => upd("description", e.target.value)} className={`${fieldInput} resize-none`} />
      </Label>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Label label="Contact Email"><input type="email" value={value.contactEmail || ""} onChange={(e) => upd("contactEmail", e.target.value)} className={fieldInput} /></Label>
        <Label label="Contact Phone"><input value={value.contactPhone || ""} onChange={(e) => upd("contactPhone", e.target.value)} className={fieldInput} /></Label>
      </div>
    </div>
  );
}

// ─── Generic list editor ───────────────────────────────────────────────────

function ListEditor({ list = [], onChange, schema, title }) {
  const add = () => onChange((l) => [...l, schema.empty()]);
  const remove = (i) => onChange((l) => l.filter((_, j) => j !== i));
  const update = (i, field, val) =>
    onChange((l) => l.map((item, j) => (j === i ? { ...item, [field]: val } : item)));
  const move = (i, dir) =>
    onChange((l) => {
      const next = [...l];
      const target = i + dir;
      if (target < 0 || target >= next.length) return l;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-xl btn-gradient px-3.5 py-2 text-xs font-bold"
        >
          <Plus size={13} /> Add Item
        </button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/40">
          No items yet — click <strong className="text-brand-primary">Add Item</strong> to create the first one.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Item {i + 1}</span>
                <div className="flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0}        className="rounded-md px-2 py-1 text-xs text-white/50 hover:text-white disabled:opacity-30">↑</button>
                  <button onClick={() => move(i, +1)} disabled={i === list.length - 1} className="rounded-md px-2 py-1 text-xs text-white/50 hover:text-white disabled:opacity-30">↓</button>
                  <button onClick={() => remove(i)} className="rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className={`grid grid-cols-1 gap-3 ${schema.fields.some((f) => f.full) ? "" : "md:grid-cols-2"}`}>
                {schema.fields.map((f) => (
                  <Label key={f.key} label={f.label} hint={f.hint} required={f.required}>
                    {f.type === "textarea" ? (
                      <textarea
                        rows={f.rows || 2}
                        value={item[f.key] || ""}
                        onChange={(e) => update(i, f.key, e.target.value)}
                        className={`${fieldInput} resize-none`}
                      />
                    ) : f.type === "number" ? (
                      <input
                        type="number"
                        min={f.min ?? 0}
                        max={f.max ?? undefined}
                        value={item[f.key] ?? ""}
                        onChange={(e) => update(i, f.key, Number(e.target.value))}
                        className={fieldInput}
                      />
                    ) : f.type === "image" ? (
                      <ImageUploader
                        value={item[f.key] || ""}
                        onChange={(url) => update(i, f.key, url)}
                      />
                    ) : (
                      <input
                        value={item[f.key] || ""}
                        onChange={(e) => update(i, f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className={fieldInput}
                      />
                    )}
                  </Label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── List schemas ──────────────────────────────────────────────────────────

const featuresSchema = {
  empty: () => ({ title: "", description: "" }),
  fields: [
    { key: "title",       label: "Title",       required: true },
    { key: "description", label: "Description", type: "textarea", rows: 3, full: true },
  ],
};

const testimonialsSchema = {
  empty: () => ({ text: "", author: "", role: "", rating: 5 }),
  fields: [
    { key: "text",   label: "Quote",      type: "textarea", rows: 3, required: true, full: true },
    { key: "author", label: "Author",     required: true },
    { key: "role",   label: "Role / Designation" },
    { key: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5 },
  ],
};

const highlightsSchema = {
  empty: () => ({ tag: "", badge: "", title: "", subtitle: "", tests: "", duration: "", takers: "" }),
  fields: [
    { key: "tag",      label: "Tag",       hint: "e.g. GPAT", required: true },
    { key: "badge",    label: "Badge",     hint: "Optional pill (e.g. New, Most Popular)" },
    { key: "title",    label: "Title",     required: true },
    { key: "subtitle", label: "Subtitle",  type: "textarea", rows: 2 },
    { key: "tests",    label: "Tests count text", placeholder: "40+" },
    { key: "duration", label: "Duration text",    placeholder: "3 hrs" },
    { key: "takers",   label: "Takers text",      placeholder: "12k+" },
  ],
};

const faqSchema = {
  empty: () => ({ question: "", answer: "" }),
  fields: [
    { key: "question", label: "Question", required: true, full: true },
    { key: "answer",   label: "Answer",   type: "textarea", rows: 3, full: true },
  ],
};

// Stat card on the landing page — pairs a label with its value.
const statsSchema = {
  empty: () => ({ label: "", value: "", note: "" }),
  fields: [
    { key: "label", label: "Label", placeholder: "Active Students", required: true },
    { key: "value", label: "Value", placeholder: "15,000+", required: true },
    { key: "note",  label: "Subtext", placeholder: "Across India", full: true },
  ],
};

// Each student review on the bento grid — image is required for the bento layout.
const studentReviewsSchema = {
  empty: () => ({ image: "", name: "", role: "", quote: "", rating: 5, span: "1x1" }),
  fields: [
    { key: "image", label: "Photo / Cover Image", type: "image", required: true, full: true,
      hint: "Square or portrait works best — auto-cropped in the bento grid." },
    { key: "name",  label: "Student Name", required: true },
    { key: "role",  label: "Course / Year", placeholder: "GPAT 2024 Topper" },
    { key: "quote", label: "Quote", type: "textarea", rows: 3, full: true },
    { key: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5 },
    { key: "span", label: "Bento Size", placeholder: "1x1, 1x2, 2x1, 2x2",
      hint: "Use 2x2 for a hero card, 1x2 for tall, 2x1 for wide. Defaults to 1x1." },
  ],
};

// Cloudinary-backed uploader — used by the studentReviews schema.
function ImageUploader({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadSiteImage(file);
      const url = res?.url;
      if (!url) throw new Error("Upload returned no URL");
      onChange(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={value} alt="" className="h-16 w-16 rounded-xl object-cover ring-1 ring-white/10" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/15 text-white/30">
          <ImagePlus size={18} />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg glass-pill px-3 py-2 text-xs font-bold text-white/80 hover:text-white">
          {busy ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
          {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          <input type="file" accept="image/*" onChange={onPick} className="hidden" />
        </label>
        {value && (
          <button onClick={() => onChange("")} className="text-[11px] text-red-300 hover:text-red-200">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
