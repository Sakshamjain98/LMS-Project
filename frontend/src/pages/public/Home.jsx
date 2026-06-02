import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import {
  getPublicArticles,
  getPublicNews,
  getPublicSiteContent,
  getPublicTestSeries,
  getPublicExamCategories,
} from "../../services/studentService";
import { getPublicCourses } from "../../services/courseService";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaBook,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaStar,
  FaPlay,
  FaGraduationCap,
  FaUserTie,
  FaFlask,
  FaHospital,
  FaFileAlt,
  FaBriefcase,
  FaPills,
  FaShieldAlt,
  FaChartLine,
  FaHeadset,
  FaMedal,
  FaChevronLeft,
  FaChevronRight,
  FaLayerGroup,
  FaSpinner,
} from "react-icons/fa";
import { Search, BookOpen } from "lucide-react";
import { normalizeYouTubeUrl } from "../../utils/youtube";

/* ─────────────────────────────────────────────────────────────
   Reusable primitives
───────────────────────────────────────────────────────────── */

/** Section-level wrapper — consistent horizontal padding + max-width */
const Section = ({ id, className = "", children }) => (
  <section id={id} className={`py-24 px-6 md:px-12 ${className}`}>
    <div className="max-w-7xl mx-auto">{children}</div>
  </section>
);

/** Centered section heading block */
const SectionHeading = ({ eyebrow, title, subtitle }) => (
  <div className="text-center mb-16">
    {eyebrow && (
      <span className="inline-block mb-3 text-xs font-bold tracking-widest uppercase text-brand-primary">
        {eyebrow}
      </span>
    )}
    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">{title}</h2>
    {subtitle && (
      <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);

/** Stat card used in About section */
const StatCard = ({ iconBg, iconColor, label, value, note }) => (
  <div className="bg-dark-200 border border-dark-100 rounded-xl p-6 hover:border-brand-primary/40 transition-colors">
    <div className={`inline-flex p-2.5 rounded-lg mb-4 ${iconBg}`}>
      <FaBook className={`text-xl ${iconColor}`} />
    </div>
    <p className="text-sm text-gray-400 mb-1">{label}</p>
    <p className="text-3xl font-black text-white">{value}</p>
    {note && <p className="text-xs text-gray-500 mt-1.5">{note}</p>}
  </div>
);

/** Feature card */
const FeatureCard = ({ title, description }) => (
  <div className="bg-dark-200 border border-dark-100 rounded-xl p-7 hover:border-brand-primary/40 transition-colors group">
    <div className="inline-flex p-3 bg-brand-primary/10 rounded-lg mb-5 group-hover:bg-brand-primary/20 transition-colors">
      <FaStar className="text-xl text-brand-primary" />
    </div>
    <h3 className="text-base font-bold text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
  </div>
);

/** Testimonial card */
const TestimonialCard = ({ text, author, role, rating }) => (
  <div className="bg-dark-200 border border-dark-100 rounded-xl p-7 hover:border-brand-primary/30 transition-colors">
    <div className="flex gap-1 mb-4">
      {[...Array(rating)].map((_, i) => (
        <FaStar key={i} size={13} className="text-yellow-400" />
      ))}
    </div>
    <p className="text-gray-300 text-sm leading-relaxed mb-5">"{text}"</p>
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs font-bold shrink-0">
        {author[0]}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{author}</p>
        <p className="text-xs text-gray-400">{role}</p>
      </div>
    </div>
  </div>
);

/** Pricing plan card */
const PricingCard = ({
  plan,
  isMostPopular,
  isFree,
  isAlreadySubscribed,
  isUserCurrentPlan,
  processingPlan,
  onSubscribe,
  onGetStarted,
}) => {
  const planPrice =
    typeof plan.price === "number" ? `₹${plan.price.toLocaleString()}` : plan.price;
  const planDuration =
    plan.period ||
    (plan.duration ? `/${Math.ceil(plan.duration / 30)} months` : "");

  const getButtonLabel = () => {
    if (processingPlan === (plan.id || plan.name)) return "Processing…";
    if (isAlreadySubscribed && !isFree)
      return isUserCurrentPlan ? "Active Plan" : "Already Subscribed";
    if (isFree) return "Get Started Free";
    return "Subscribe Now";
  };

  return (
    <div
      className={`relative rounded-xl border flex flex-col transition-all ${
        isMostPopular
          ? "bg-dark-200 border-brand-primary shadow-2xl shadow-brand-primary/20 scale-[1.03]"
          : "bg-dark-200 border-dark-100 hover:border-brand-primary/30"
      }`}
    >
      {isMostPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 btn-gradient text-xs font-bold rounded-full tracking-wide">
          MOST POPULAR
        </div>
      )}

      <div className="p-8 flex flex-col flex-1">
        {/* Plan name + desc */}
        <div className="mb-6 pb-6 border-b border-dark-100">
          <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
          <p className="text-sm text-gray-400">{plan.desc}</p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <span className="text-4xl font-black text-brand-primary">{planPrice}</span>
          {planDuration && (
            <span className="text-sm text-gray-400 ml-1">{planDuration}</span>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-8 flex-1">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
              <FaCheckCircle className="text-brand-primary mt-0.5 shrink-0" size={13} />
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => {
            if (isFree) onGetStarted();
            else if (!isAlreadySubscribed) onSubscribe(plan);
          }}
          disabled={
            processingPlan === (plan.id || plan.name) ||
            (isAlreadySubscribed && !isFree)
          }
          className={`w-full py-3 rounded-lg text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
            isMostPopular
              ? "btn-gradient hover:opacity-90"
              : "bg-dark-300 text-white border border-dark-100 hover:border-brand-primary/50"
          }`}
        >
          {getButtonLabel()}
        </button>
      </div>
    </div>
  );
};

/* Quill HTML often starts with an empty <p><br></p>; strip it. */
const stripFirstParagraph = (html = "") =>
  html.replace(/^<p>(<br>)?<\/p>/, "").trim();

/* ─────────────────────────────────────────────────────────────
   Static data
───────────────────────────────────────────────────────────── */


const TEST_SERIES_HIGHLIGHTS = [
  {
    tag: "GPAT",
    badge: "Most Popular",
    title: "GPAT Full-Length Mocks",
    subtitle: "Real-exam pattern with detailed solutions and All India Rank after every test.",
    icon: FaMedal,
    tests: "40+",
    duration: "3 hrs",
    takers: "12k+",
  },
  {
    tag: "NIPER",
    title: "NIPER Topic-Wise",
    subtitle: "Chapter-wise sectional tests with adaptive difficulty and weakness reports.",
    icon: FaFlask,
    tests: "60+",
    duration: "1 hr",
    takers: "5.4k",
  },
  {
    tag: "Pharmacist",
    badge: "New",
    title: "State Board Pharmacist",
    subtitle: "State-board pattern mocks for government pharmacist roles across India.",
    icon: FaShieldAlt,
    tests: "25+",
    duration: "2 hrs",
    takers: "3.2k",
  },
];

// Cycled when CMS-driven stats don't specify their own palette.
const STAT_PALETTE = [
  { icon: FaGraduationCap, iconBg: "bg-brand-primary/15", iconColor: "text-brand-primary" },
  { icon: FaBook,          iconBg: "bg-blue-500/15",      iconColor: "text-blue-400" },
  { icon: FaCheckCircle,   iconBg: "bg-green-500/15",     iconColor: "text-green-400" },
  { icon: FaUserTie,       iconBg: "bg-orange-500/15",    iconColor: "text-orange-400" },
];

// Bento grid spans — admin picks "1x1" / "2x1" / "1x2" / "2x2" per review.
const SPAN_CLASSES = {
  "1x1": "col-span-1 row-span-1",
  "2x1": "col-span-2 row-span-1",
  "1x2": "col-span-1 row-span-2",
  "2x2": "col-span-2 row-span-2",
};

const TESTIMONIALS = [
  {
    text: "The courses are incredibly well-structured. I passed my GPAT exam on the first attempt thanks to the comprehensive materials.",
    author: "Priya Desai",
    role: "GPAT Aspirant",
    rating: 5,
  },
  {
    text: "Best investment for my pharmacy career. The faculty are approachable and the content is industry-relevant.",
    author: "Rohan Singh",
    role: "Pharmacy Graduate",
    rating: 5,
  },
  {
    text: "I appreciated the practical approach to clinical pharmacy. It helped me secure my clinical internship.",
    author: "Neha Verma",
    role: "Final Year Student",
    rating: 5,
  },
  {
    text: "Study materials and test series are top-notch. Highly recommended for anyone serious about pharmacy.",
    author: "Arjun Malhotra",
    role: "NIPER Aspirant",
    rating: 5,
  },
];

const FALLBACK_PLANS = [
  {
    id: "FREE",
    name: "Starter",
    price: "Free",
    desc: "Perfect for exploring",
    features: ["5 free tests / month", "Basic study materials", "Community access"],
  },
  {
    id: "QUARTERLY",
    name: "Professional",
    price: 999,
    period: "/3 months",
    desc: "Most popular choice",
    features: [
      "All test series unlocked",
      "Premium study materials",
      "Full practice test suite",
      "Email support",
      "Course certificate",
    ],
    featured: true,
  },
  {
    id: "YEARLY",
    name: "Premium",
    price: 4999,
    period: "/year",
    desc: "Best value — save 58%",
    features: [
      "Everything in Professional",
      "1-on-1 mentoring sessions",
      "Performance analytics",
      "Priority support",
      "Lifetime resource access",
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

const Home = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({ students: 0, tests: 0, success: 0 });
  const [articles, setArticles] = useState([]);
  const [news, setNews] = useState([]);
  const [cms, setCms] = useState(null);

  const isAuthenticated = !!localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  /* Load Razorpay SDK */
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  /* Fetch published articles + news + site content */
  useEffect(() => {
    getPublicArticles(6)
      .then((res) => setArticles(res?.blogs || []))
      .catch(() => setArticles([]));
    getPublicNews(5)
      .then((res) => setNews(res?.news || []))
      .catch(() => setNews([]));
    getPublicSiteContent()
      .then((res) => setCms(res?.data || null))
      .catch(() => setCms(null));
  }, []);

  /* CMS-driven content with static fallbacks. */
  const hero = {
    eyebrow: cms?.hero?.eyebrow ?? "Pharmacy Excellence Platform",
    titlePrefix: cms?.hero?.titlePrefix ?? "Master Pharmacy with",
    titleHighlight: cms?.hero?.titleHighlight ?? "Structured Learning",
    subtitle: cms?.hero?.subtitle ?? "Comprehensive pharmaceutical education for serious learners. Learn from industry experts, ace your exams, and build a career you're proud of.",
    primaryCtaLabel: cms?.hero?.primaryCtaLabel ?? "Login",
    secondaryCtaLabel: cms?.hero?.secondaryCtaLabel ?? "Browse Tests",
    videoUrl: cms?.hero?.videoUrl ?? "https://youtube.com/embed/playlist?list=PLjAABVNnKXdUwpGMfkSVqqXfNFA7-TtAc&si=LI9jhN5BN2dj10p3",
  };
  const aboutCms = {
    eyebrow: cms?.about?.eyebrow ?? "Our Mission",
    title: cms?.about?.title ?? "About Us",
    paragraphs: (cms?.about?.paragraphs?.length ? cms.about.paragraphs : [
      "Pharmacist Shubham is dedicated to democratising pharmaceutical education. We believe quality learning shouldn't be limited by geography or resources. Our platform combines expert instruction, practical assessments, and a supportive community to help pharmacy professionals excel.",
      "Whether you're preparing for licensing exams, expanding your clinical knowledge, or advancing your career, we give you the tools and expertise you need to succeed.",
    ]),
  };
  const testimonialsCms  = cms?.testimonials?.length          ? cms.testimonials          : TESTIMONIALS;
  const faqCms           = cms?.faq?.length                   ? cms.faq                   : [];
  const statsCms         = Array.isArray(cms?.stats)          ? cms.stats                 : [];
  const whyChooseCms     = cms?.whyChooseUs && (cms.whyChooseUs.title || cms.whyChooseUs.items?.length)
                            ? cms.whyChooseUs : null;
  const studentReviewsCms = Array.isArray(cms?.studentReviews) ? cms.studentReviews        : [];
  const footerCms = {
    brand: cms?.footer?.brand ?? "PS Classes",
    description: cms?.footer?.description ?? "Empowering pharmacy professionals with structured, expert-led education.",
    contactEmail: cms?.footer?.contactEmail ?? "support@pharmacistshubham.com",
    contactPhone: cms?.footer?.contactPhone ?? "+91 XXXX XXX XXX",
  };

  /* Animate counter stats */
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        students: Math.min(prev.students + 234, 15000),
        tests: Math.min(prev.tests + 8, 125),
        success: Math.min(prev.success + 2, 95),
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  /* ── Handlers ── */

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (userRole === "admin") navigate("/admin/dashboard");
      else navigate("/student/dashboard");
    } else {
      navigate("/login");
    }
  };

  /* ── Derived data ── */

  return (
    <div className="bg-dark-400 text-white overflow-hidden">
      <Navbar />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        id="home"
        className="min-h-screen flex items-center pt-24 pb-16 px-6 md:px-12 relative overflow-hidden"
      >
        {/* Ambient background glow */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-32 left-1/4 w-80 h-80 bg-brand-primary/6 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-brand-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Copy */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Eyebrow label */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/8 border border-brand-primary/25 rounded-full"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <FaGraduationCap className="text-brand-primary text-sm" />
              <span className="text-xs font-semibold text-brand-primary tracking-wide">
                {hero.eyebrow}
              </span>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <h1 className="text-5xl md:text-6xl font-black leading-[1.1] tracking-tight">
                {hero.titlePrefix}{" "}
                <span className="text-brand-primary">{hero.titleHighlight}</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                {hero.subtitle}
              </p>
            </motion.div>

            {/* CTA row — Free Trial CTA lives in the navbar; here we only keep
                the primary login/get-started action and a jump to test series. */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleGetStarted}
                className="px-7 py-3.5 btn-gradient rounded-lg font-bold text-sm hover:opacity-90 transition inline-flex items-center justify-center gap-2 group"
              >
                {hero.primaryCtaLabel}
                <FaArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="#test-series"
                className="px-7 py-3.5 bg-dark-200 text-white rounded-lg font-bold text-sm border border-dark-100 hover:border-brand-primary/40 transition inline-flex items-center justify-center gap-2"
              >
                <FaPlay size={12} />
                {hero.secondaryCtaLabel}
              </a>
            </div>

            {/* Stats bar
            <div className="flex gap-8 pt-6 border-t border-dark-100">
              <div>
                <p className="text-3xl font-black text-brand-primary tabular-nums">
                  {stats.students.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Active Learners</p>
              </div>
              <div>
                <p className="text-3xl font-black text-brand-primary tabular-nums">
                  {stats.tests}+
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Mock Tests</p>
              </div>
              <div>
                <p className="text-3xl font-black text-brand-primary tabular-nums">
                  {stats.success}%
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Success Rate</p>
              </div>
            </div> */}
          </motion.div>

          {/* Right: Video embed */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-dark-100 shadow-2xl shadow-black/40">
            <iframe
              width="100%"
              height="100%"
              src={normalizeYouTubeUrl(hero.videoUrl)}
              title="PS Classes Introduction"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ABOUT US
      ══════════════════════════════════════════ */}
      <Section
        id="about"
        className="bg-dark-300/30 border-t border-dark-100"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Copy */}
          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-brand-primary mb-3 block">
                {aboutCms.eyebrow}
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">{aboutCms.title}</h2>
              <div className="w-10 h-0.5 bg-brand-primary rounded-full" />
            </div>
            {aboutCms.paragraphs.map((p, i) => (
              <p key={i} className="text-gray-400 leading-relaxed">{p}</p>
            ))}
            <a
              href="#test-series"
              className="inline-flex items-center gap-2 text-brand-primary hover:opacity-80 font-semibold text-sm transition"
            >
              Explore our test series
              <FaArrowRight size={13} />
            </a>
          </div>

          {/* Stats grid — CMS-driven when present, otherwise the live counters fall back. */}
          {statsCms.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {statsCms.slice(0, 4).map((s, i) => {
                const palette = STAT_PALETTE[i % STAT_PALETTE.length];
                return (
                  <StatCard
                    key={i}
                    icon={palette.icon}
                    iconBg={palette.iconBg}
                    iconColor={palette.iconColor}
                    label={s.label || ""}
                    value={s.value || ""}
                    note={s.note || ""}
                  />
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={FaGraduationCap} iconBg="bg-brand-primary/15" iconColor="text-brand-primary" label="Total Students" value={stats.students.toLocaleString()} note="Worldwide" />
              <StatCard icon={FaBook} iconBg="bg-blue-500/15" iconColor="text-blue-400" label="Courses" value={`${stats.tests}+`} note="Expert-led" />
              <StatCard icon={FaCheckCircle} iconBg="bg-green-500/15" iconColor="text-green-400" label="Success Rate" value={`${stats.success}%`} note="Exam pass rate" />
              <StatCard icon={FaUserTie} iconBg="bg-orange-500/15" iconColor="text-orange-400" label="Expert Faculty" value="50+" note="Industry professionals" />
            </div>
          )}
        </div>
      </Section>
            {/* ══════════════════════════════════════════
          WHY CHOOSE US — explicit reasons block, CMS-driven
      ══════════════════════════════════════════ */}
      {whyChooseCms && (whyChooseCms.title || (whyChooseCms.items?.length || 0) > 0) && (
        <Section id="why-us" className="border-t border-dark-100">
          <SectionHeading
            eyebrow={whyChooseCms.eyebrow || "Why Choose Us"}
            title={whyChooseCms.title || "Why students choose us"}
            subtitle={whyChooseCms.subtitle || ""}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(whyChooseCms.items || []).map((it, i) => (
              <div
                key={i}
                className="bg-dark-200 border border-dark-100 rounded-xl p-7 hover:border-brand-primary/40 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-brand-primary/15 text-brand-primary mb-5 text-xl">
                  {it.icon || "✨"}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{it.title}</h3>
                {it.description && (
                  <p className="text-sm text-gray-400 leading-relaxed">{it.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
      {/* ══════════════════════════════════════════
          TEST SERIES — 3-level hierarchy
      ══════════════════════════════════════════ */}
      <PublicTestSeriesSection onGetStarted={handleGetStarted} />

      <PublicCoursesSection onGetStarted={handleGetStarted} />


      {/* ══════════════════════════════════════════
          STUDENT REVIEWS — bento grid, image-first cards
      ══════════════════════════════════════════ */}
      {studentReviewsCms.length > 0 && (
        <Section id="student-reviews" className="bg-dark-300/30 border-t border-dark-100">
          <SectionHeading
            eyebrow="Student Voices"
            title="Stories from our students"
            subtitle="What our toppers and learners say after attempting our test series."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[180px] gap-4">
            {studentReviewsCms.map((r, i) => {
              const span = SPAN_CLASSES[r.span] || SPAN_CLASSES["1x1"];
              return (
                <article
                  key={i}
                  className={`relative overflow-hidden rounded-2xl group animate-fade-up ${span}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {r.image ? (
                    <img
                      src={r.image}
                      alt={r.name || "Student"}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-dark-200 to-dark-300" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    {r.rating > 0 && (
                      <div className="flex gap-0.5 mb-1.5">
                        {[...Array(Math.min(5, Math.max(0, Number(r.rating) || 0)))].map((_, k) => (
                          <FaStar key={k} size={11} className="text-yellow-400" />
                        ))}
                      </div>
                    )}
                    {r.quote && (
                      <p className="text-xs md:text-sm text-white/90 leading-snug line-clamp-3 mb-2">
                        "{r.quote}"
                      </p>
                    )}
                    <p className="text-sm font-bold text-white">{r.name || "Student"}</p>
                    {r.role && <p className="text-[11px] text-white/60">{r.role}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        </Section>
      )}
            {/* ══════════════════════════════════════════
          ARTICLES (live from /api/public/blogs)
      ══════════════════════════════════════════ */}
      <Section id="blog" className="border-t border-dark-100">
        <SectionHeading
          eyebrow="Knowledge Hub"
          title="Latest Articles"
          subtitle="Expert insights, exam tips, and career guidance from the pharmacy education world."
        />

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-dark-100 bg-dark-200/40 py-20 text-center text-sm text-gray-400">
            No articles published yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {articles.map((post, idx) => (
              <Link
                key={post._id}
                to={`/articles/${post._id}`}
                className="group glass-card glass-card-hover rounded-2xl flex flex-col h-full p-6 animate-fade-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-brand-primary/10 rounded-lg">
                    <FaBook className="text-brand-primary" size={15} />
                  </div>
                  <span className="text-xs font-bold text-brand-primary tracking-wide uppercase">
                    Article
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-brand-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <div
                  className="text-xs text-gray-400 leading-relaxed line-clamp-3 flex-1 mb-5 prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: stripFirstParagraph(post.content) }}
                />

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FaClock size={11} />
                    {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="text-xs font-bold text-brand-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read More <FaArrowRight size={11} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════
          NEWS — live from /api/public/news
      ══════════════════════════════════════════ */}
      {news.length > 0 && (
        <Section id="news" className="bg-dark-300/30 border-t border-dark-100">
          <SectionHeading
            eyebrow="What's New"
            title="Latest Updates"
            subtitle="Announcements, exam alerts, and platform releases — straight from our team."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {news.map((item, idx) => (
              <article
                key={item._id}
                className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col gap-3 animate-fade-up"
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                    Update
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{item.content}</p>
              </article>
            ))}
          </div>
        </Section>
      )}



      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <Section
        id="testimonials"
        className="bg-dark-300/30 border-t border-dark-100"
      >
        <SectionHeading
          eyebrow="Social Proof"
          title="Student Success Stories"
          subtitle="Real experiences from learners who transformed their pharmacy careers with us."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonialsCms.map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      {/* <Section id="pricing" className="border-t border-dark-100">
        <SectionHeading
          eyebrow="Pricing"
          title="Flexible Plans"
          subtitle="Choose the plan that matches your learning goals. Upgrade or cancel at any time."
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-10 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {pricingPlans.map((plan, idx) => {
            const isFree =
              plan.price === 0 ||
              plan.price === "Free" ||
              plan.id === "FREE";
            const isMostPopular =
              plan.featured ||
              (plans.length > 0 && idx === Math.floor(plans.length / 2));
            const isAlreadySubscribed =
              subscriptionStatus &&
              subscriptionStatus !== "FREE" &&
              subscriptionStatus !== "INACTIVE";
            const isUserCurrentPlan =
              subscriptionStatus === (plan.id || plan.name.toUpperCase());

            return (
              <PricingCard
                key={idx}
                plan={plan}
                isMostPopular={isMostPopular}
                isFree={isFree}
                isAlreadySubscribed={isAlreadySubscribed}
                isUserCurrentPlan={isUserCurrentPlan}
                processingPlan={processingPlan}
                subscriptionStatus={subscriptionStatus}
                onSubscribe={handleSubscribe}
                onGetStarted={handleFreePlanActivation}
              />
            );
          })}
        </div>
      </Section> */}

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section className="py-24 px-6 md:px-12 border-t border-dark-100 bg-dark-300/30">
        <div className="max-w-3xl mx-auto text-center space-y-7">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-brand-primary block mb-3">
              Get Started
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Ready to Transform Your Career?
            </h2>
            <p className="text-gray-400 text-lg">
              Join thousands of pharmacy professionals already learning with us.
            </p>
          </div>

          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2.5 px-9 py-4 btn-gradient rounded-lg font-bold text-base hover:opacity-90 transition group"
          >
            {isAuthenticated ? "Start Learning Today" : "Start Free Trial"}
            <FaArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <p className="text-xs text-gray-500">
            No credit card required &nbsp;·&nbsp; 7-day free trial &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ — CMS-driven, hidden if empty
      ══════════════════════════════════════════ */}
      {faqCms.length > 0 && (
        <Section id="faq" className="bg-dark-300/30 border-t border-dark-100">
          <SectionHeading
            eyebrow="Questions"
            title="Frequently Asked"
            subtitle="The questions students ask us most often before signing up."
          />
          <div className="mx-auto max-w-3xl space-y-3">
            {faqCms.map((q, i) => (
              <details
                key={i}
                className="group glass-card glass-card-hover rounded-2xl p-5 cursor-pointer animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <summary className="flex items-center justify-between gap-4 list-none">
                  <span className="text-sm md:text-base font-semibold text-white">{q.question}</span>
                  <FaArrowRight size={12} className="text-brand-primary transition-transform group-open:rotate-90 shrink-0" />
                </summary>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">{q.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="border-t border-dark-100 bg-dark-300/50 py-14 px-6 md:px-12">
  <div className="max-w-7xl mx-auto">
    {/* Top row: brand + links */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
      {/* Brand */}
      <div className="col-span-2">
        {/* Brand + Logo */}
        <div className="flex items-center gap-2 mb-2">
          {/* Logo — swap src for your actual logo */}
          <img
            src="/logo.png"
            alt={`${footerCms.brand} logo`}
            className="h-6 w-6 object-contain"
          />
          <p className="text-base font-black text-white">{footerCms.brand}</p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed max-w-xs mb-5">
          {footerCms.description}
        </p>

        {/* Social Icons */}
        <div className="flex items-center gap-3">
          {[
            {
              label: "Instagram",
              href: "#",
              gradient: "from-yellow-400 via-pink-500 to-purple-600",
              svg: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              ),
            },
            {
              label: "Telegram",
              href: "#",
              gradient: "from-sky-400 to-blue-600",
              svg: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              ),
            },
            {
              label: "WhatsApp",
              href: "#",
              gradient: "from-green-400 to-emerald-600",
              svg: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              ),
            },
            {
              label: "Email",
              href: footerCms.contactEmail ? `mailto:${footerCms.contactEmail}` : "#",
              gradient: "from-orange-400 to-rose-500",
              svg: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              ),
            },
            {
              label: "Facebook",
              href: "#",
              gradient: "from-blue-500 to-indigo-700",
              svg: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              ),
            },
          ].map(({ label, href, gradient, svg }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className={`
                relative w-8 h-8 rounded-lg flex items-center justify-center
                bg-linear-to-br ${gradient}
                text-white shadow-lg
                hover:scale-110 hover:shadow-xl
                transition-all duration-200
                before:absolute before:inset-0 before:rounded-lg
                before:bg-white/10 before:opacity-0 hover:before:opacity-100
                before:transition-opacity
              `}
            >
              {svg}
            </a>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">Product</p>
        <ul className="space-y-2.5 text-xs text-gray-500">
          <li><a href="#test-series" className="hover:text-white transition">Test Series</a></li>
          {/* <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li> */}
          <li><a href="#about" className="hover:text-white transition">About</a></li>
        </ul>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">Learn</p>
        <ul className="space-y-2.5 text-xs text-gray-500">
          <li><a href="#blog" className="hover:text-white transition">Blog</a></li>
          {/* <li><a href="#" className="hover:text-white transition">Resources</a></li> */}
          <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
        </ul>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">Legal</p>
        <ul className="space-y-2.5 text-xs text-gray-500">
          <li><Link to="/privacy" className="hover:text-white transition">Privacy</Link></li>
          <li><Link to="/terms" className="hover:text-white transition">Terms</Link></li>
          <li><Link to="/cookies" className="hover:text-white transition">Cookies</Link></li>
        </ul>
      </div>
    </div>

    {/* Bottom row: copyright + contact */}
    <div className="border-t border-dark-100 pt-7 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
      <p>&copy; {new Date().getFullYear()} {footerCms.brand}. All rights reserved.</p>
      <div className="flex items-center gap-5">
        {footerCms.contactEmail && <span>{footerCms.contactEmail}</span>}
        {footerCms.contactPhone && <span>{footerCms.contactPhone}</span>}
      </div>
    </div>
  </div>
</footer>


      {/* Free-trial popup — rendered through a portal so it escapes any parent
          stacking context (overflow-hidden, transform, etc.) on Home. */}
      {/* {trialModalOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="trial-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          onClick={() => setTrialModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-dark-200 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)] animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setTrialModalOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/5 hover:text-white"
            >
              ×
            </button>

            <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary">
              <FaPlay size={20} />
            </div>
            <h3 id="trial-modal-title" className="text-2xl font-bold text-white">Try PS Classes free</h3>
            <p className="mt-2 text-sm text-white/60">
              Jump into our test series and attempt free mocks right now. Premium series unlock individually whenever you're ready.
            </p>

            <button
              onClick={handleExploreTestSeries}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl btn-gradient px-5 py-3 text-sm font-bold"
            >
              Explore Test Series
              <FaArrowRight size={13} />
            </button>

            <p className="mt-3 text-center text-[11px] text-white/40">
              {isAuthenticated ? "We'll take you to the test catalogue." : "We'll ask you to sign in first — it takes a few seconds."}
            </p>
          </div>
        </div>,
        document.body
      )} */}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Public Test Series Section — 3-level Category → Exam → Series
───────────────────────────────────────────────────────────── */

function examGridClass(count) {
  if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
  if (count === 3) return "grid-cols-1 sm:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}

function seriesGridClass(count) {
  if (count === 1) return "grid-cols-1 max-w-md mx-auto";
  if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto";
  return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
}

function courseGridClass(count) {
  if (count === 1) return "grid-cols-1 max-w-md mx-auto";
  if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto";
  return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
}

function CourseCategoryCard({ category, idx, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${idx * 50}ms` }}
      className={`group rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 animate-fade-up ${
        active
          ? "border-brand-primary/40 bg-brand-primary/10 shadow-[0_12px_40px_rgba(0,200,133,0.12)]"
          : "border-white/8 bg-dark-300/40 hover:border-brand-primary/30 hover:bg-dark-300/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/15">
          <FaLayerGroup size={20} />
        </div>
        <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/50">
          {category.exams?.length || 0} Exam{(category.exams?.length || 0) === 1 ? "" : "s"}
        </span>
      </div>
      <h3 className="mt-4 text-base font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-2">
        {category.title}
      </h3>
      {category.description && <p className="mt-2 text-xs text-white/45 line-clamp-2">{category.description}</p>}
    </button>
  );
}

function CourseExamCard({ exam, idx, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${idx * 50}ms` }}
      className={`group rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 animate-fade-up ${
        active
          ? "border-brand-primary/35 bg-white/5"
          : "border-white/8 bg-dark-300/40 hover:border-brand-primary/25 hover:bg-dark-300/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/15">
          <FaGraduationCap size={20} />
        </div>
        <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/50">
          View Courses →
        </span>
      </div>
      <h3 className="mt-4 text-base font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-2">
        {exam.title}
      </h3>
      {exam.description && <p className="mt-2 text-xs text-white/45 line-clamp-2">{exam.description}</p>}
    </button>
  );
}

function PublicTestSeriesSection({ onGetStarted }) {
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [examSeries, setExamSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const seriesGridRef = useRef(null);

  useEffect(() => {
    getPublicExamCategories()
      .then((res) => {
        const cats = res?.categories || [];
        setCategories(cats);
        if (cats.length > 0) setSelectedCategoryId(cats[0]._id);
      })
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []);

  const fetchSeries = useCallback((examId) => {
    setSeriesLoading(true);
    getPublicTestSeries(20, examId)
      .then((res) => setExamSeries(res?.topics || []))
      .catch(() => setExamSeries([]))
      .finally(() => setSeriesLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    const timer = setTimeout(() => {
      fetchSeries(selectedExamId);
      seriesGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedExamId, fetchSeries]);

  const currentCategory = categories.find((c) => c._id === selectedCategoryId) || null;
  const currentExam = selectedExamId
    ? (currentCategory?.exams || []).find((e) => e._id === selectedExamId) || null
    : null;
  const examsToShow = currentCategory?.exams || [];

  return (
    <Section id="test-series" className="relative border-t border-dark-100 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand-primary/10 blur-3xl" />
      </div>

      <SectionHeading
        eyebrow="Practice & Excel"
        title="Browse Test Series"
        subtitle="Pick your exam category, choose an exam, and start practising with real-exam pacing, chapter-wise analytics, and All-India Rank."
      />

      {catLoading ? (
        <CatLoadingSkeleton />
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-dark-100 bg-dark-200/40 py-16 text-center text-sm text-gray-400 mb-10">
          No test series published yet — check back soon.
        </div>
      ) : (
        <>
          {/* ── Category scroll-tab bar (hidden when only one category) ── */}
          {categories.length > 1 && (
            <div className="relative mb-10">
              <div
                role="tablist"
                aria-label="Exam categories"
                className="flex overflow-x-auto scrollbar-none border-b border-dark-100"
              >
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    role="tab"
                    aria-selected={selectedCategoryId === cat._id}
                    onClick={() => { setSelectedCategoryId(cat._id); setSelectedExamId(null); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedCategoryId(cat._id);
                        setSelectedExamId(null);
                      }
                    }}
                    className={`relative shrink-0 flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all outline-none focus:outline-none ${
                      selectedCategoryId === cat._id
                        ? "text-white bg-brand-primary/8"
                        : "text-gray-400 hover:text-white hover:bg-dark-200/50"
                    }`}
                  >
                    {cat.title}
                    <span
                      className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 transition-colors ${
                        selectedCategoryId === cat._id
                          ? "bg-brand-primary/20 text-brand-primary"
                          : "bg-dark-100 text-gray-500"
                      }`}
                    >
                      {cat.exams?.length || 0}
                    </span>
                    {selectedCategoryId === cat._id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>
              {/* Scroll-hint fade mask on the right */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0.5 w-12 bg-linear-to-l from-dark-400 to-transparent" />
            </div>
          )}

          {!selectedExamId ? (
            /* ── Exam cards ── */
            examsToShow.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-dark-100 bg-dark-200/40 py-12 text-center text-sm text-gray-500 mb-10">
                No exams in {currentCategory?.title || "this category"} yet.
              </div>
            ) : (
              <div className={`grid ${examGridClass(examsToShow.length)} gap-4 mb-10`}>
                {examsToShow.map((exam, i) => (
                  <ExamPublicCard
                    key={exam._id}
                    exam={exam}
                    idx={i}
                    onClick={() => setSelectedExamId(exam._id)}
                  />
                ))}
              </div>
            )
          ) : (
            /* ── Test series cards for selected exam ── */
            <>
              {/* Breadcrumb bar — also serves as scroll target */}
              <div
                ref={seriesGridRef}
                className="flex items-center justify-between gap-3 mb-8 bg-dark-300/60 rounded-xl px-4 py-2.5"
              >
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <button
                    onClick={() => setSelectedExamId(null)}
                    aria-label={`Back to ${currentCategory?.title} exams`}
                    className="flex items-center gap-1.5 text-brand-primary hover:opacity-80 font-semibold transition shrink-0"
                  >
                    <FaChevronLeft size={11} />
                    {currentCategory?.title}
                  </button>
                  <FaChevronRight size={11} className="text-gray-600 shrink-0" />
                  <span className="text-white font-bold truncate">{currentExam?.title}</span>
                </div>
                <button
                  onClick={() => setSelectedExamId(null)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-dark-100 hover:border-brand-primary/40 bg-dark-200 rounded-lg px-3 py-1.5 transition shrink-0"
                >
                  <FaLayerGroup size={11} />
                  Change Exam
                </button>
              </div>

              {seriesLoading ? (
                <SeriesLoadingSkeleton />
              ) : examSeries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-dark-100 bg-dark-200/40 py-12 text-center text-sm text-gray-500 mb-10">
                  No test series for {currentExam?.title} yet — check back soon.
                </div>
              ) : (
                <div className={`grid ${seriesGridClass(examSeries.length)} gap-6 mb-10`}>
                  {examSeries.map((s, i) => (
                    <TestSeriesPublicCard
                      key={s._id}
                      series={s}
                      idx={i}
                      seriesNumber={i + 1}
                      examName={currentExam?.title}
                      onAction={onGetStarted}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      <div className="text-center mt-4">
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 px-7 py-3 btn-gradient rounded-lg font-bold text-sm hover:opacity-90 transition"
        >
          Browse All Test Series
          <FaArrowRight size={13} />
        </button>
      </div>
    </Section>
  );
}

function ExamPublicCard({ exam, idx, onClick }) {
  const palette = [
    { icon: "bg-brand-primary/15 text-brand-primary", border: "hover:border-brand-primary/50", shadow: "hover:shadow-brand-primary/12", ring: "focus:ring-brand-primary/50", badge: "bg-brand-primary/10 text-brand-primary" },
    { icon: "bg-blue-500/15 text-blue-400",           border: "hover:border-blue-500/50",       shadow: "hover:shadow-blue-500/12",       ring: "focus:ring-blue-500/50",       badge: "bg-blue-500/10 text-blue-400" },
    { icon: "bg-purple-500/15 text-purple-400",       border: "hover:border-purple-500/50",     shadow: "hover:shadow-purple-500/12",     ring: "focus:ring-purple-500/50",     badge: "bg-purple-500/10 text-purple-400" },
    { icon: "bg-orange-500/15 text-orange-400",       border: "hover:border-orange-500/50",     shadow: "hover:shadow-orange-500/12",     ring: "focus:ring-orange-500/50",     badge: "bg-orange-500/10 text-orange-400" },
  ][idx % 4];

  return (
    <button
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      tabIndex={0}
      style={{ animationDelay: `${idx * 60}ms` }}
      className={`group text-left rounded-2xl bg-dark-200 border border-dark-100 p-6 ${palette.border} ${palette.shadow} hover:bg-dark-100/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 animate-fade-up flex flex-col gap-5 focus:outline-none focus:ring-2 ${palette.ring}`}
    >
      {/* Top row: icon + series badge */}
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${palette.icon} shrink-0`}>
          <FaGraduationCap size={26} />
        </div>
        <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${palette.badge}`}>
          <FaFileAlt size={9} />
          {exam.seriesCount || 0} {exam.seriesCount === 1 ? "Series" : "Series"}
        </span>
      </div>

      {/* Title + description */}
      <div className="flex-1 min-w-0 space-y-2">
        <h3 className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-2 leading-snug">
          {exam.title}
        </h3>
        {exam.description ? (
          <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
            {exam.description}
          </p>
        ) : (
          <p className="text-sm text-gray-500 italic leading-relaxed">
            Full-length mock tests, chapter-wise practice &amp; All India Rank.
          </p>
        )}
      </div>

      {/* Footer divider + CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <span className="text-sm text-gray-500 flex items-center gap-2">
          <FaChartLine size={11} />
          {exam.seriesCount || 0} test series
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">
          Explore <FaArrowRight size={11} />
        </span>
      </div>
    </button>
  );
}

function TestSeriesPublicCard({ series: s, idx, seriesNumber, examName, onAction }) {
  return (
    <div
      className="rounded-2xl border border-dark-100 bg-dark-200 p-6 flex flex-col gap-4 animate-fade-up hover:border-brand-primary/40 hover:shadow-xl hover:shadow-brand-primary/8 hover:-translate-y-0.5 transition-all"
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      {/* Context row: series number + exam name + price badge */}
      <div className="flex items-center gap-2 min-w-0">
        {seriesNumber && (
          <span className="shrink-0 text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
            #{seriesNumber}
          </span>
        )}
        {examName && (
          <span className="text-[11px] text-gray-400 font-medium truncate">{examName}</span>
        )}
        {s.isPaid ? (
          s.discountedPrice > 0 && s.discountedPrice < s.price ? (
            <span
              aria-label={`Price: ₹${Number(s.discountedPrice).toLocaleString()}`}
              className="ml-auto shrink-0 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 inline-flex items-center gap-2"
            >
              <span className="text-[12px] font-extrabold text-amber-300 tracking-tight">₹{Number(s.discountedPrice).toLocaleString()}</span>
              <span className="w-px h-3.5 bg-amber-500/30 shrink-0" />
              <span className="text-[9px] font-medium text-white/30 line-through tracking-tight">₹{Number(s.price || 0).toLocaleString()}</span>
            </span>
          ) : (
            <span
              aria-label={`Price: ₹${Number(s.price || 0).toLocaleString()}`}
              className="ml-auto shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300"
            >
              ₹{Number(s.price || 0).toLocaleString()}
            </span>
          )
        ) : (
          <span
            aria-label="Price: Free"
            className="ml-auto shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
          >
            Free
          </span>
        )}
      </div>

      {/* Icon + title + description */}
      <div className="flex gap-3 items-start">
        <div className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
          <FaMedal size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white leading-snug wrap-break-word">{s.title}</h3>
          {s.description ? (
            <p className="mt-1.5 text-sm text-gray-400 leading-relaxed line-clamp-2">
              {s.description}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-500 italic">
              {examName ? `${examName} mock test series` : "Mock test series"}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center">
        <div>
          <p className="text-base font-bold text-brand-primary">{s.testsCount || 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Tests</p>
        </div>
        <div>
          <p className="text-base font-bold text-white">{s.subjectsCount || 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Subjects</p>
        </div>
        <div>
          <p className="text-base font-bold text-white">{s.chaptersCount || 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Chapters</p>
        </div>
      </div>

      {/* CTA — green for free, brand for paid */}
      <button
        onClick={onAction}
        className={`mt-1 w-full py-2.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 group/btn ${
          s.isPaid
            ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary hover:text-dark-400"
            : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
        }`}
      >
        {s.isPaid ? (
          s.discountedPrice > 0 && s.discountedPrice < s.price ? (
            <span className="inline-flex items-center gap-1.5">
              Unlock · ₹{Number(s.discountedPrice).toLocaleString()}
              <span className="text-[9px] opacity-40 line-through font-normal">₹{Number(s.price || 0).toLocaleString()}</span>
            </span>
          ) : `Unlock for ₹${Number(s.price || 0).toLocaleString()}`
        ) : "Start Attempting"}
        <FaArrowRight size={11} className="transition-transform group-hover/btn:translate-x-0.5" />
      </button>
    </div>
  );
}

// ─── Public Courses Section ──────────────────────────────────────────────────

const COURSE_PALETTES = [
  { icon: "bg-brand-primary/15 text-brand-primary", border: "hover:border-brand-primary/40", shadow: "hover:shadow-brand-primary/10", badge: "bg-brand-primary/10 text-brand-primary", priceBg: "bg-brand-primary/80 text-dark-400" },
  { icon: "bg-blue-500/15 text-blue-400",           border: "hover:border-blue-500/40",       shadow: "hover:shadow-blue-500/10",       badge: "bg-blue-500/10 text-blue-400",       priceBg: "bg-blue-500/80 text-white" },
  { icon: "bg-purple-500/15 text-purple-400",       border: "hover:border-purple-500/40",     shadow: "hover:shadow-purple-500/10",     badge: "bg-purple-500/10 text-purple-400",   priceBg: "bg-purple-500/80 text-white" },
  { icon: "bg-teal-500/15 text-teal-400",           border: "hover:border-teal-500/40",       shadow: "hover:shadow-teal-500/10",       badge: "bg-teal-500/10 text-teal-400",       priceBg: "bg-teal-600/80 text-white" },
];

function PublicCoursesSection({ onGetStarted }) {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    getPublicExamCategories()
      .then((res) => {
        if (!active) return;
        const cats = res?.categories || [];
        setCategories(cats);
        if (cats[0]?._id) {
          setSelectedCategoryId(cats[0]._id);
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setLoadingCats(false); });
    return () => { active = false; };
  }, []);

  const currentCategory = categories.find((c) => c._id === selectedCategoryId) || null;
  const currentExam = currentCategory?.exams?.find((e) => e._id === selectedExamId) || null;

  useEffect(() => {
    let active = true;
    if (!selectedExamId) {
      return () => { active = false; };
    }
    const timer = setTimeout(() => {
      if (!active) return;
      setLoadingCourses(true);
      getPublicCourses(50, selectedExamId)
        .then((res) => { if (active) setCourses(res?.courses || []); })
        .catch(() => { if (active) setCourses([]); })
        .finally(() => { if (active) setLoadingCourses(false); });
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [selectedExamId]);

  const filteredCourses = courses.filter((course) =>
    selectedExamId && course.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleExploreCta = () => {
    if (isAuthenticated) navigate("/student/courses");
    else onGetStarted();
  };

  const currentCourseTarget = (course) => {
    if (!course?._id) return;
    navigate(`/student/courses/${course._id}`);
  };

  return (
    <Section id="courses" className="border-t border-dark-100">
      <SectionHeading
        eyebrow="Course Library"
        title="Browse courses by exam category and exam"
        subtitle="Pick the category, choose the exam, then open the course library with the same drill-down flow as test browsing."
      />
      {loadingCats ? (
        <SeriesLoadingSkeleton />
      ) : (
        <div className="space-y-6">
          {categories.length > 1 && (
            <div className="relative">
              <div role="tablist" aria-label="Course categories" className="flex overflow-x-auto scrollbar-none border-b border-dark-100">
                {categories.map((category) => (
                  <button
                    key={category._id}
                    role="tab"
                    aria-selected={selectedCategoryId === category._id}
                    onClick={() => {
                      setSelectedCategoryId(category._id);
                      setSelectedExamId(null);
                      setCourses([]);
                      setSearch("");
                    }}
                    className={`relative shrink-0 flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all outline-none focus:outline-none ${
                      selectedCategoryId === category._id
                        ? "text-white bg-brand-primary/8"
                        : "text-gray-400 hover:text-white hover:bg-dark-200/50"
                    }`}
                  >
                    {category.title}
                    <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 transition-colors ${
                      selectedCategoryId === category._id
                        ? "bg-brand-primary/20 text-brand-primary"
                        : "bg-dark-100 text-gray-500"
                    }`}>
                      {category.exams?.length || 0}
                    </span>
                    {selectedCategoryId === category._id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>
              <div className="pointer-events-none absolute right-0 top-0 bottom-0.5 w-12 bg-linear-to-l from-dark-400 to-transparent" />
            </div>
          )}

          {currentCategory && !selectedExamId && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(currentCategory.exams || []).map((exam, idx) => (
                <CourseExamCard
                  key={exam._id}
                  exam={exam}
                  idx={idx}
                  active={false}
                  onClick={() => {
                    setSelectedExamId(exam._id);
                    setSearch("");
                  }}
                />
              ))}
            </div>
          )}

          {selectedExamId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-dark-300/60 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">Selected Exam</p>
                  <h3 className="truncate text-sm font-bold text-white">{currentExam?.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedExamId(null)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white"
                >
                  Change Exam
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 max-w-sm">
                <Search size={15} className="text-white/40 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                />
              </div>

              {loadingCourses ? (
                <SeriesLoadingSkeleton />
              ) : filteredCourses.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10">
                  <BookOpen size={32} className="text-white/15" />
                  <p className="text-sm text-white/40">No courses found for this exam yet</p>
                </div>
              ) : (
                <div className={`grid ${courseGridClass(filteredCourses.length)} gap-6`}>
                  {filteredCourses.map((course, idx) => (
                    <PublicCourseCard
                      key={course._id}
                      course={course}
                      idx={idx}
                      isAuthenticated={isAuthenticated}
                      onNavigateCourse={() => currentCourseTarget(course)}
                      onGetStarted={onGetStarted}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div className="mt-10 flex justify-center">
        <button
          onClick={handleExploreCta}
          className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-8 py-3 text-sm font-bold text-brand-primary hover:bg-brand-primary hover:text-dark-400 transition-all"
        >
          Explore All Courses <FaArrowRight size={12} />
        </button>
      </div>
    </Section>
  );
}

// Apply Cloudinary auto-optimize transform to any Cloudinary URL
function cloudinaryOptimize(url, w = 600, h = 340) {
  if (!url || !url.includes("cloudinary.com/")) return url;
  return url.replace("/upload/", `/upload/w_${w},h_${h},c_fill,q_auto,f_auto/`);
}

function PublicCourseCard({ course, idx, isAuthenticated, onNavigateCourse, onGetStarted }) {
  const palette = COURSE_PALETTES[idx % COURSE_PALETTES.length];
  const thumbUrl = cloudinaryOptimize(course.thumbnail?.url);
  const plainDesc = course.description ? course.description.replace(/<[^>]+>/g, "").trim() : "";

  const handleCta = () => {
    if (isAuthenticated) onNavigateCourse();
    else onGetStarted();
  };

  return (
    <button
      type="button"
      onClick={handleCta}
      style={{ animationDelay: `${idx * 70}ms` }}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-dark-300/40 backdrop-blur-sm text-left transition-all duration-200 ${palette.border} hover:shadow-2xl ${palette.shadow} hover:-translate-y-1 animate-fade-up focus:outline-none focus:ring-2 focus:ring-brand-primary/40`}
    >
      {/* Thumbnail */}
      <div className="relative h-44 shrink-0 overflow-hidden bg-white/3">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={course.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`flex h-full items-center justify-center ${palette.icon}`}>
            <FaBook size={44} className="opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-dark-400/70 to-transparent" />
        {course.isPaid ? (
          course.discountedPrice > 0 && course.discountedPrice < course.price ? (
            <div className="absolute top-3 right-3 rounded-lg bg-black/60 border border-amber-500/30 backdrop-blur-md px-2.5 py-1.5 shadow-lg flex flex-col items-end gap-px">
              <span className="text-[9px] font-medium text-white/40 line-through leading-none">₹{Number(course.price || 0).toLocaleString()}</span>
              <span className="text-[12px] font-extrabold text-amber-400 leading-none">₹{Number(course.discountedPrice).toLocaleString()}</span>
            </div>
          ) : (
            <span className="absolute top-3 right-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">
              ₹{Number(course.price || 0).toLocaleString()}
            </span>
          )
        ) : (
          <span className="absolute top-3 right-3 rounded-full bg-emerald-500/80 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">FREE</span>
        )}
        {(course.subjectsCount || 0) > 0 && (
          <span className={`absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-lg backdrop-blur-sm ${palette.badge}`}>
            <FaLayerGroup size={9} /> {course.subjectsCount} Subject{course.subjectsCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${palette.icon} shrink-0`}>
            <FaGraduationCap size={20} />
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${course.isPaid ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>
            {course.isPaid ? "Premium" : "Free"}
          </span>
        </div>

        <h3 className="text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-brand-primary transition-colors">
          {course.title}
        </h3>

        {plainDesc ? (
          <p className="flex-1 text-sm text-white/50 line-clamp-2 leading-relaxed">{plainDesc}</p>
        ) : (
          <p className="flex-1 text-sm text-white/35 italic leading-relaxed">Comprehensive notes, video lectures and practice tests.</p>
        )}

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center">
          <div>
            <p className="text-base font-bold text-brand-primary">{course.subjectsCount || 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Subjects</p>
          </div>
          <div>
            <p className="text-base font-bold text-white">{course.chaptersCount || 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Chapters</p>
          </div>
          <div>
            <p className="text-base font-bold text-white">{course.tags?.length || 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Tags</p>
          </div>
        </div>

        {course.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {course.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/45">{tag}</span>
            ))}
          </div>
        )}

        <span className="mt-auto w-full rounded-xl border border-brand-primary/30 bg-brand-primary/10 py-2.5 text-xs font-bold text-brand-primary hover:bg-brand-primary hover:text-dark-400 transition-all inline-flex items-center justify-center gap-1.5">
          {course.isPaid ? (
            course.discountedPrice > 0 && course.discountedPrice < course.price ? (
              <span className="inline-flex items-center gap-1.5">
                Enroll · ₹{Number(course.discountedPrice).toLocaleString()}
                <span className="text-[9px] opacity-40 line-through font-normal">₹{Number(course.price || 0).toLocaleString()}</span>
              </span>
            ) : `Enroll for ₹${Number(course.price || 0).toLocaleString()}`
          ) : "Start Learning Free"}
          <FaArrowRight size={11} />
        </span>
      </div>
    </button>
  );
}

function CatLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse mb-10">
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-28 rounded-full bg-dark-200" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-dark-200" />
        ))}
      </div>
    </div>
  );
}

function SeriesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse mb-10">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl bg-dark-200 border border-dark-100 p-6 flex flex-col gap-4">
          {/* Context row */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-8 rounded-full bg-dark-100" />
            <div className="h-3 w-28 rounded bg-dark-100" />
            <div className="ml-auto h-5 w-12 rounded-full bg-dark-100" />
          </div>
          {/* Icon + title block */}
          <div className="flex gap-3">
            <div className="h-11 w-11 rounded-xl bg-dark-100 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-3/4 rounded bg-dark-100" />
              <div className="h-3 w-full rounded bg-dark-100" />
              <div className="h-3 w-2/3 rounded bg-dark-100" />
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex flex-col items-center gap-1.5">
                <div className="h-5 w-8 rounded bg-dark-100" />
                <div className="h-2.5 w-12 rounded bg-dark-100" />
              </div>
            ))}
          </div>
          {/* CTA */}
          <div className="h-9 w-full rounded-lg bg-dark-100" />
        </div>
      ))}
    </div>
  );
}

export default Home;