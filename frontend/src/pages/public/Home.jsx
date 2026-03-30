import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import {
  getPaymentPlans,
  createPaymentOrder,
  verifyPayment,
  activateFreeSubscription,
  getStudentSubscription,
} from "../../services/studentService";
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
const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, note }) => (
  <div className="bg-dark-200 border border-dark-100 rounded-xl p-6 hover:border-brand-primary/40 transition-colors">
    <div className={`inline-flex p-2.5 rounded-lg mb-4 ${iconBg}`}>
      <Icon className={`text-xl ${iconColor}`} />
    </div>
    <p className="text-sm text-gray-400 mb-1">{label}</p>
    <p className="text-3xl font-black text-white">{value}</p>
    {note && <p className="text-xs text-gray-500 mt-1.5">{note}</p>}
  </div>
);

/** Course card */
const CourseCard = ({ course }) => {
  const icons = { 1: FaFileAlt, 2: FaFlask, 3: FaHospital };
  const Icon = icons[course._id] || FaBook;

  return (
    <a
      href={`/student/courses/${course._id}`}
      className="group bg-dark-200 rounded-xl overflow-hidden border border-dark-100 hover:border-brand-primary/50 hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-300 flex flex-col h-full"
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-dark-300 flex items-center justify-center overflow-hidden">
        <div className="p-5 bg-dark-400/60 rounded-full">
          <Icon className="text-4xl text-brand-primary/60 group-hover:text-brand-primary transition-colors" />
        </div>
        <span
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
            course.isPaid
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
              : "bg-green-500/15 text-green-400 border border-green-500/20"
          }`}
        >
          {course.isPaid ? "Premium" : "Free"}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div>
          <h3 className="font-bold text-white text-sm leading-snug mb-1.5 group-hover:text-brand-primary transition-colors line-clamp-2">
            {course.title}
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
            {course.description}
          </p>
        </div>

        <div className="flex items-center gap-4 py-3 border-y border-dark-100 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <FaBook size={11} />
            {course.sections} lessons
          </span>
          <span className="flex items-center gap-1.5">
            <FaUsers size={11} />
            {course.students.toLocaleString()} students
          </span>
        </div>

        <div className="flex items-center gap-2">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              size={11}
              className={i < Math.floor(course.rating) ? "text-yellow-400" : "text-dark-100"}
            />
          ))}
          <span className="text-xs font-semibold text-white ml-0.5">{course.rating}</span>
        </div>

        <button className="mt-auto w-full py-2.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/30 rounded-lg text-xs font-bold hover:bg-brand-primary hover:text-dark-400 transition-colors">
          View Course
        </button>
      </div>
    </a>
  );
};

/** Feature card */
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-dark-200 border border-dark-100 rounded-xl p-7 hover:border-brand-primary/40 transition-colors group">
    <div className="inline-flex p-3 bg-brand-primary/10 rounded-lg mb-5 group-hover:bg-brand-primary/20 transition-colors">
      <Icon className="text-xl text-brand-primary" />
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
  subscriptionStatus,
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
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-primary text-dark-400 text-xs font-bold rounded-full tracking-wide">
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
              ? "bg-brand-primary text-dark-400 hover:opacity-90"
              : "bg-dark-300 text-white border border-dark-100 hover:border-brand-primary/50"
          }`}
        >
          {getButtonLabel()}
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Static data
───────────────────────────────────────────────────────────── */

const FEATURED_COURSES = [
  {
    _id: "1",
    title: "Pharmaceutical Jurisprudence",
    description: "Legal and regulatory framework for pharmacy professionals",
    sections: 24,
    students: 3200,
    rating: 4.8,
    isPaid: false,
  },
  {
    _id: "2",
    title: "Advanced Pharmacology",
    description: "Deep dive into drug mechanisms and therapeutic interactions",
    sections: 32,
    students: 2100,
    rating: 4.9,
    isPaid: false,
  },
  {
    _id: "3",
    title: "Clinical Pharmacy Practice",
    description: "Real-world patient care and clinical decision-making",
    sections: 28,
    students: 1800,
    rating: 4.7,
    isPaid: true,
  },
];

const BLOG_POSTS = [
  {
    id: "1",
    title: "Top 10 GPAT Exam Preparation Tips",
    description:
      "Master the pharmacist licensing exam with proven strategies and study techniques.",
    category: "GPAT",
    readTime: "8 min read",
    icon: FaMedal,
  },
  {
    id: "2",
    title: "Career Path in Clinical Pharmacy",
    description:
      "Explore lucrative opportunities and specializations in clinical pharmacy practice.",
    category: "Career",
    readTime: "6 min read",
    icon: FaBriefcase,
  },
  {
    id: "3",
    title: "Understanding Drug Interactions",
    description:
      "A comprehensive guide to identifying and managing potential drug interactions.",
    category: "Education",
    readTime: "10 min read",
    icon: FaPills,
  },
];

const FEATURES = [
  {
    icon: FaBook,
    title: "Comprehensive Curriculum",
    description:
      "Structured courses covering all aspects of pharmaceutical science, from fundamentals to advanced specializations.",
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
    features: ["5 free courses", "Basic study materials", "Community access"],
  },
  {
    id: "QUARTERLY",
    name: "Professional",
    price: 999,
    period: "/3 months",
    desc: "Most popular choice",
    features: [
      "All courses unlocked",
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

  const [stats, setStats] = useState({ students: 0, courses: 0, success: 0 });
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
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

  /* Animate counter stats */
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        students: Math.min(prev.students + 234, 15000),
        courses: Math.min(prev.courses + 8, 120),
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
      if (userRole === "teacher") navigate("/teacher/dashboard");
      else if (userRole === "admin") navigate("/admin/dashboard");
      else navigate("/student/dashboard");
    } else {
      navigate("/register");
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
        alert("✅ Welcome to Pharmacist Academy!\nFree plan activated.");
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
        name: "Pharmacist Academy",
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
          <div className="space-y-8">
            {/* Eyebrow label */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/8 border border-brand-primary/25 rounded-full">
              <FaGraduationCap className="text-brand-primary text-sm" />
              <span className="text-xs font-semibold text-brand-primary tracking-wide">
                Pharmacy Excellence Platform
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black leading-[1.1] tracking-tight">
                Master Pharmacy with{" "}
                <span className="text-brand-primary">Structured Learning</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                Comprehensive pharmaceutical education for serious learners.
                Learn from industry experts, ace your exams, and build a career
                you're proud of.
              </p>
            </div>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleGetStarted}
                className="px-7 py-3.5 bg-brand-primary text-dark-400 rounded-lg font-bold text-sm hover:opacity-90 transition inline-flex items-center justify-center gap-2 group"
              >
                Get Started Free
                <FaArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="#courses"
                className="px-7 py-3.5 bg-dark-200 text-white rounded-lg font-bold text-sm border border-dark-100 hover:border-brand-primary/40 transition inline-flex items-center justify-center gap-2"
              >
                <FaPlay size={12} />
                Browse Courses
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
                  {stats.courses}+
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Expert Courses</p>
              </div>
              <div>
                <p className="text-3xl font-black text-brand-primary tabular-nums">
                  {stats.success}%
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Right: Video embed */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-dark-100 shadow-2xl shadow-black/40">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/Tvf7CXEjFNU?si=toZhTVuzoNa1kNw0"
              title="Pharmacist Academy Introduction"
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
                Our Mission
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">About Us</h2>
              <div className="w-10 h-0.5 bg-brand-primary rounded-full" />
            </div>
            <p className="text-gray-400 leading-relaxed">
              Pharmacist Shubham is dedicated to democratising pharmaceutical
              education. We believe quality learning shouldn't be limited by
              geography or resources. Our platform combines expert instruction,
              practical assessments, and a supportive community to help pharmacy
              professionals excel.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Whether you're preparing for licensing exams, expanding your
              clinical knowledge, or advancing your career, we give you the
              tools and expertise you need to succeed.
            </p>
            <a
              href="#courses"
              className="inline-flex items-center gap-2 text-brand-primary hover:opacity-80 font-semibold text-sm transition"
            >
              Explore our courses
              <FaArrowRight size={13} />
            </a>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={FaGraduationCap}
              iconBg="bg-brand-primary/15"
              iconColor="text-brand-primary"
              label="Total Students"
              value={stats.students.toLocaleString()}
              note="Worldwide"
            />
            <StatCard
              icon={FaBook}
              iconBg="bg-blue-500/15"
              iconColor="text-blue-400"
              label="Courses"
              value={`${stats.courses}+`}
              note="Expert-led"
            />
            <StatCard
              icon={FaCheckCircle}
              iconBg="bg-green-500/15"
              iconColor="text-green-400"
              label="Success Rate"
              value={`${stats.success}%`}
              note="Exam pass rate"
            />
            <StatCard
              icon={FaUserTie}
              iconBg="bg-orange-500/15"
              iconColor="text-orange-400"
              label="Expert Faculty"
              value="50+"
              note="Industry professionals"
            />
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════
          FEATURED COURSES
      ══════════════════════════════════════════ */}
      <Section id="courses" className="border-t border-dark-100">
        <SectionHeading
          eyebrow="Curriculum"
          title="Featured Courses"
          subtitle="Explore our most popular and impactful pharmacy courses, built for real-world outcomes."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {FEATURED_COURSES.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>

        <div className="text-center">
          <a
            href="/student/courses"
            className="inline-flex items-center gap-2 px-7 py-3 border border-brand-primary/50 text-brand-primary rounded-lg font-bold text-sm hover:bg-brand-primary/8 transition"
          >
            View All {stats.courses}+ Courses
            <FaArrowRight size={13} />
          </a>
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
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════════
          BLOG
      ══════════════════════════════════════════ */}
      <Section id="blog" className="border-t border-dark-100">
        <SectionHeading
          eyebrow="Knowledge Hub"
          title="Latest Articles"
          subtitle="Expert insights, exam tips, and career guidance from the pharmacy education world."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {BLOG_POSTS.map((post) => {
            const Icon = post.icon;
            return (
              <a
                key={post.id}
                href="#"
                className="group bg-dark-200 rounded-xl border border-dark-100 hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/10 transition-all duration-300 flex flex-col h-full p-6"
              >
                {/* Icon + category */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-brand-primary/10 rounded-lg">
                    <Icon className="text-brand-primary" size={15} />
                  </div>
                  <span className="text-xs font-bold text-brand-primary tracking-wide uppercase">
                    {post.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-brand-primary transition-colors line-clamp-2 min-h-10">
                  {post.title}
                </h3>

                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1 mb-5">
                  {post.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-dark-100">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FaClock size={11} />
                    {post.readTime}
                  </span>
                  <span className="text-xs font-bold text-brand-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read More <FaArrowRight size={11} />
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        <div className="text-center">
          <a
            href="#blog"
            className="inline-flex items-center gap-2 px-7 py-3 border border-brand-primary/50 text-brand-primary rounded-lg font-bold text-sm hover:bg-brand-primary/8 transition"
          >
            View All Articles
            <FaArrowRight size={13} />
          </a>
        </div>
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
          {TESTIMONIALS.map((t, i) => (
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
            className="inline-flex items-center gap-2.5 px-9 py-4 bg-brand-primary text-dark-400 rounded-lg font-bold text-base hover:opacity-90 transition group"
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
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="border-t border-dark-100 bg-dark-300/50 py-14 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Top row: brand + links */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2">
              <p className="text-base font-black text-white mb-2">
                Pharmacist <span className="text-brand-primary">Academy</span>
              </p>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                Empowering pharmacy professionals with structured, expert-led
                education.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">Product</p>
              <ul className="space-y-2.5 text-xs text-gray-500">
                <li><a href="#courses" className="hover:text-white transition">Courses</a></li>
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
            <p>&copy; {new Date().getFullYear()} Pharmacist Shubham. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <span>support@pharmacistshubham.com</span>
              <span>+91 XXXX XXX XXX</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;