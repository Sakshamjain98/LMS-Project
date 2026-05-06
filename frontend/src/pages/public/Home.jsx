import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import {
  getPaymentPlans,
  createPaymentOrder,
  verifyPayment,
  activateFreeSubscription,
  getStudentSubscription,
  getPublicArticles,
  getPublicNews,
  getPublicSiteContent,
  getPublicTestSeries,
} from "../../services/studentService";
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
} from "react-icons/fa";
import { normalizeYouTubeUrl } from "../admin/SiteContent";

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
      <div className="w-9 h-9 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0">
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
              <FaCheckCircle className="text-brand-primary mt-0.5 flex-shrink-0" size={13} />
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

const FEATURES = [
  {
    icon: FaBook,
    title: "Comprehensive Curriculum",
    description:
      "Structured test series covering every chapter of pharmaceutical science — fundamentals to advanced specializations.",
  },
  {
    icon: FaUserTie,
    title: "Expert Instructors",
    description:
      "Learn from industry professionals and experienced pharmacists with decades of combined expertise.",
  },
  {
    icon: FaClock,
    title: "Learn at Your Pace",
    description:
      "Flexible scheduling lets you study on your own timeline — from anywhere, on any device.",
  },
  {
    icon: FaCheckCircle,
    title: "Practical Assessments",
    description:
      "Real-world tests and mock exams to validate your knowledge and prepare for certifications.",
  },
  {
    icon: FaShieldAlt,
    title: "Recognised Certificates",
    description:
      "Earn certificates that are valued by employers and institutions across the pharmaceutical industry.",
  },
  {
    icon: FaHeadset,
    title: "Dedicated Support",
    description:
      "Our support team is available to help you through every step of your learning journey.",
  },
];

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
  const [seriesList, setSeriesList] = useState([]);
  const [plans, setPlans] = useState([]);
  const [_loadingPlans, setLoadingPlans] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [error, setError] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    localStorage.getItem("subscriptionStatus") || "FREE"
  );

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

  /* Fetch pricing plans */
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const fetchedPlans = await getPaymentPlans();
        setPlans(fetchedPlans || []);
      } catch {
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
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
    getPublicTestSeries(6)
      .then((res) => setSeriesList(res?.topics || []))
      .catch(() => setSeriesList([]));
  }, []);

  /* CMS-driven content with static fallbacks. */
  const hero = {
    eyebrow: cms?.hero?.eyebrow ?? "Pharmacy Excellence Platform",
    titlePrefix: cms?.hero?.titlePrefix ?? "Master Pharmacy with",
    titleHighlight: cms?.hero?.titleHighlight ?? "Structured Learning",
    subtitle: cms?.hero?.subtitle ?? "Comprehensive pharmaceutical education for serious learners. Learn from industry experts, ace your exams, and build a career you're proud of.",
    primaryCtaLabel: cms?.hero?.primaryCtaLabel ?? "Login",
    secondaryCtaLabel: cms?.hero?.secondaryCtaLabel ?? "Browse Tests",
    videoUrl: cms?.hero?.videoUrl ?? "https://www.youtube.com/embed/Tvf7CXEjFNU?si=toZhTVuzoNa1kNw0",
  };
  const aboutCms = {
    eyebrow: cms?.about?.eyebrow ?? "Our Mission",
    title: cms?.about?.title ?? "About Us",
    paragraphs: (cms?.about?.paragraphs?.length ? cms.about.paragraphs : [
      "Pharmacist Shubham is dedicated to democratising pharmaceutical education. We believe quality learning shouldn't be limited by geography or resources. Our platform combines expert instruction, practical assessments, and a supportive community to help pharmacy professionals excel.",
      "Whether you're preparing for licensing exams, expanding your clinical knowledge, or advancing your career, we give you the tools and expertise you need to succeed.",
    ]),
  };
  const featuresCms      = cms?.features?.length              ? cms.features              : FEATURES.map((f) => ({ title: f.title, description: f.description }));
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

  /* Sync subscription from API */
  useEffect(() => {
    const syncSubscription = async () => {
      if (!isAuthenticated || userRole !== "student") return;
      try {
        const subscription = await getStudentSubscription();
        const activePlan =
          subscription?.status === "ACTIVE" && subscription?.plan !== "FREE"
            ? subscription.plan
            : "FREE";
        setSubscriptionStatus(activePlan);
        localStorage.setItem("subscriptionStatus", activePlan);
      } catch {
        /* fail silently */
      }
    };
    syncSubscription();
  }, [isAuthenticated, userRole]);

  /* ── Handlers ── */

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (userRole === "admin") navigate("/admin/dashboard");
      else navigate("/student/dashboard");
    } else {
      navigate("/login");
    }
  };

  const handleFreePlanActivation = async () => {
    setProcessingPlan("FREE");
    setError("");
    try {
      const response = await activateFreeSubscription();
      if (response.success) {
        localStorage.setItem("subscriptionPlan", "FREE");
        localStorage.setItem("subscriptionStatus", "FREE");
        setSubscriptionStatus("FREE");
        alert("✅ Welcome to PS Classes!\nFree plan activated.");
        setTimeout(() => navigate("/student/dashboard"), 2000);
      }
    } catch (err) {
      setError(err.message || "Failed to activate plan");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleSubscribe = async (plan) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const currentPlan = subscriptionStatus;

    if (!token || role !== "student") {
      alert("Please log in as a student to subscribe.");
      navigate("/login");
      return;
    }

    if (plan.id === "FREE" || plan.price === 0 || plan.price === "Free" || !plan.price) {
      return handleFreePlanActivation();
    }

    if (currentPlan && currentPlan !== "FREE") {
      alert("You already have an active Premium membership!");
      return;
    }

    const planIdMap = { Professional: "MONTHLY", Premium: "YEARLY", "6 Month": "QUARTERLY", "12 Month": "YEARLY" };
    const planId = plan.id || planIdMap[plan.name];

    if (!["MONTHLY", "QUARTERLY", "YEARLY"].includes(planId)) {
      setError("Invalid plan selected. Please try again.");
      return;
    }

    if (!window.Razorpay) {
      setError("Payment gateway not loaded. Please refresh the page.");
      return;
    }

    setProcessingPlan(plan.id || planId);
    setError("");

    try {
      const orderData = await createPaymentOrder(planId);

      const handlePaymentSuccess = async (response) => {
        try {
          const verifyRes = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (verifyRes.success) {
            localStorage.setItem("subscriptionStatus", planId);
            setSubscriptionStatus(planId);
            alert(`✅ Welcome to Premium!\nYour subscription is now active.`);
            setTimeout(() => navigate("/student/dashboard"), 2000);
          }
        } catch (verifyErr) {
          setError(verifyErr.message || "Payment verification failed.");
        } finally {
          setProcessingPlan(null);
        }
      };

      /* DEV mode bypass */
      if (orderData.orderId.startsWith("dev_order_")) {
        return handlePaymentSuccess({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: "DEV_PAY_" + Date.now(),
          razorpay_signature: "mock_signature",
        });
      }

      /* Production Razorpay */
      const rzp = new window.Razorpay({
        key: orderData.razorpayKeyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency,
        name: "PS Classes",
        description: `${orderData.planName} Plan`,
        order_id: orderData.orderId,
        prefill: {
          email: localStorage.getItem("userEmail") || "",
          contact: localStorage.getItem("userPhone") || "",
        },
        theme: { color: "#00c885" },
        handler: handlePaymentSuccess,
        modal: { ondismiss: () => setProcessingPlan(null) },
      });
      rzp.on("payment.failed", (res) => {
        setError(`Payment failed: ${res.error.description}`);
        setProcessingPlan(null);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || "Failed to initiate payment.");
      setProcessingPlan(null);
    }
  };

  /* ── Derived data ── */

  const pricingPlans = plans.length > 0 ? plans : FALLBACK_PLANS;

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

            {/* CTA row */}
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

            {/* Stats bar */}
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
            </div>
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
          TEST SERIES (NEW)
      ══════════════════════════════════════════ */}
      <Section id="test-series" className="relative border-t border-dark-100 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand-primary/10 blur-3xl" />
        </div>

        <SectionHeading
          eyebrow="Practice & Excel"
          title="All-India Test Series"
          subtitle="Mock exams with All India Rank, chapter-wise analytics, and real-exam pacing — built by pharmacy faculty."
        />

        {seriesList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-dark-100 bg-dark-200/40 py-16 text-center text-sm text-gray-400 mb-12">
            No test series published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {seriesList.map((s, i) => (
              <div
                key={s._id}
                className="glass-card glass-card-hover relative rounded-2xl p-6 flex flex-col gap-4 animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span
                  className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    s.isPaid
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                      : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                  }`}
                >
                  {s.isPaid ? `₹${Number(s.price || 0).toLocaleString()}` : "Free"}
                </span>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
                  <FaMedal size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                    Test Series
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white break-words">{s.title}</h3>
                  {s.description && (
                    <p className="mt-1.5 text-sm text-gray-400 leading-relaxed line-clamp-2 break-words">
                      {s.description}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center">
                  <div>
                    <p className="text-base font-bold text-white">{s.testsCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Tests</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">{s.subjectsCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Subjects</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-brand-primary">{s.chaptersCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Chapters</p>
                  </div>
                </div>
                <button
                  onClick={handleGetStarted}
                  className="mt-2 w-full py-2.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/30 rounded-lg text-xs font-bold hover:bg-brand-primary hover:text-dark-400 transition-colors inline-flex items-center justify-center gap-1.5 group/btn"
                >
                  {s.isPaid ? `Unlock for ₹${Number(s.price || 0).toLocaleString()}` : "Attempt Free Test"}
                  <FaArrowRight size={11} className="transition-transform group-hover/btn:translate-x-0.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-7 py-3 btn-gradient rounded-lg font-bold text-sm hover:opacity-90 transition"
          >
            Browse All Test Series
            <FaArrowRight size={13} />
          </button>
        </div>
      </Section>

      {/* ══════════════════════════════════════════
          FEATURES / WHY US
      ══════════════════════════════════════════ */}
      <Section
        id="features"
        className="bg-dark-300/40 border-t border-dark-100"
      >
        <SectionHeading
          eyebrow="Why Choose Us"
          title="A Complete Learning Ecosystem"
          subtitle="Everything you need to master pharmaceutical science and advance your career."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuresCms.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
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
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-200 to-dark-300" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
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
      <Section id="pricing" className="border-t border-dark-100">
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
                onGetStarted={handleGetStarted}
              />
            );
          })}
        </div>
      </Section>

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
            Start Learning Today
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
              <p className="text-base font-black text-white mb-2">{footerCms.brand}</p>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs">{footerCms.description}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">Product</p>
              <ul className="space-y-2.5 text-xs text-gray-500">
                <li><a href="#test-series" className="hover:text-white transition">Test Series</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#about" className="hover:text-white transition">About</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">Learn</p>
              <ul className="space-y-2.5 text-xs text-gray-500">
                <li><a href="#blog" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Resources</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">Legal</p>
              <ul className="space-y-2.5 text-xs text-gray-500">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
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
    </div>
  );
};

export default Home;