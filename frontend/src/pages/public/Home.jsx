import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { getPaymentPlans, createPaymentOrder, verifyPayment } from "../../services/studentService";
import { FaArrowRight, FaBook, FaUsers, FaClock, FaCheckCircle, FaStar, FaPlay, FaGraduationCap, FaFire, FaUser } from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, courses: 0, success: 0 });
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [error, setError] = useState("");

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const fetchedPlans = await getPaymentPlans();
        setPlans(fetchedPlans || []);
      } catch (err) {
        console.error("Failed to fetch plans:", err);
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  // Animate stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        students: Math.min(prev.students + 234, 15000),
        courses: Math.min(prev.courses + 8, 120),
        success: Math.min(prev.success + 2, 95),
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const isAuthenticated = !!localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (userRole === "teacher") navigate("/teacher/dashboard");
      else if (userRole === "admin") navigate("/admin/dashboard");
      else navigate("/student/dashboard");
    } else {
      navigate("/register");
    }
  };

  const handleSubscribe = async (plan) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    
    if (!token || role !== "student") {
      alert("Please login as a student to subscribe");
      navigate("/login");
      return;
    }

    if (!window.Razorpay) {
      setError("Payment gateway not loaded. Please refresh the page.");
      return;
    }

    setProcessingPlan(plan.id);
    setError("");

    try {
      console.log("Creating order for plan:", plan.id);
      
      // Step 1: Create payment order
      const orderData = await createPaymentOrder(plan.id);
      console.log("Order created:", orderData);

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency,
        name: "Pharmacist Academy",
        description: `${orderData.planName} Plan - ${orderData.duration}`,
        order_id: orderData.orderId,
        
        handler: async function (response) {
          try {
            console.log("Payment successful, verifying...");

            // Step 3: Verify payment
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyRes = await verifyPayment(verifyData);

            if (verifyRes.success) {
              localStorage.setItem("subscriptionStatus", plan.id);
              localStorage.setItem("lastPaymentId", response.razorpay_payment_id);

              if (verifyRes.dev) {
                alert(
                  `✅ DEV Mode - Payment Verified\n\nPlan: ${orderData.planName}\nAmount: ₹${orderData.amount}\n\nYour subscription is now active!`
                );
              } else if (verifyRes.pendingAdminApproval) {
                alert(
                  `✅ Payment Received\n\nPlan: ${orderData.planName}\nAmount: ₹${orderData.amount}\n\nYour subscription is pending admin approval. You'll get full access once approved.\n\nPayment ID: ${response.razorpay_payment_id}`
                );
              } else {
                alert(
                  `✅ Welcome to Premium!\n\nPlan: ${orderData.planName}\nAmount: ₹${orderData.amount}\n\nYour subscription is now active!`
                );
              }

              // Redirect to dashboard
              setTimeout(() => {
                navigate("/student/dashboard");
              }, 2000);
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            const errorMsg = verifyErr.message || "Payment verification failed";
            setError(errorMsg);
            alert(`❌ Verification Failed\n\n${errorMsg}`);
          } finally {
            setProcessingPlan(null);
          }
        },

        modal: {
          ondismiss: function () {
            console.log("Payment modal dismissed");
            setProcessingPlan(null);
          },
        },

        prefill: {
          email: localStorage.getItem("userEmail") || "",
          contact: localStorage.getItem("userPhone") || "",
        },

        theme: {
          color: "#00c885",
        },

        method: {
          netbanking: true,
          card: true,
          upi: true,
          wallet: true,
        },
      };

      console.log("Opening Razorpay checkout");
      const rzp = new window.Razorpay(options);
      
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response);
        setError(`Payment failed: ${response.error.description}`);
        setProcessingPlan(null);
        alert(`❌ Payment Failed\n\n${response.error.description}`);
      });

      rzp.open();
    } catch (err) {
      console.error("Order creation error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to initiate payment";
      setError(errorMsg);
      setProcessingPlan(null);
      alert(`❌ Error\n\n${errorMsg}`);
    }
  };

  const handleScroll = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Featured courses data
  const featuredCourses = [
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

  // Blog posts data
  const blogPosts = [
    {
      id: "1",
      title: "Top 10 GPAT Exam Preparation Tips",
      description: "Master the pharmacist licensing exam with proven strategies and study techniques",
      category: "GPAT",
      readTime: "8 min read",
    },
    {
      id: "2",
      title: "Career Path in Clinical Pharmacy",
      description: "Explore lucrative opportunities and specializations in clinical pharmacy practice",
      category: "Career",
      readTime: "6 min read",
    },
    {
      id: "3",
      title: "Understanding Drug Interactions",
      description: "A comprehensive guide to identifying and managing potential drug interactions",
      category: "Education",
      readTime: "10 min read",
    },
  ];

  // Pricing plans - use API plans or fallback
  const pricingPlans = plans.length > 0 ? plans : [
    {
      name: "Starter",
      price: "Free",
      desc: "Perfect for exploring",
      features: ["5 free courses", "Basic materials", "Community support"],
    },
    {
      name: "Professional",
      price: "₹999",
      period: "/3 months",
      desc: "Most popular",
      features: [
        "All courses access",
        "Premium materials",
        "Practice tests",
        "Email support",
        "Certificate",
      ],
      featured: true,
    },
    {
      name: "Premium",
      price: "₹4999",
      period: "/year",
      desc: "Best value",
      features: [
        "Everything in Pro",
        "1-on-1 mentoring",
        "Advanced analytics",
        "Priority support",
        "Lifetime access",
      ],
    },
  ];

  return (
    <div className="bg-dark-400 text-white overflow-hidden">
      <Navbar />

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section id="home" className="min-h-screen flex items-center pt-20 px-6 md:px-12 relative overflow-hidden">
        
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block px-4 py-2 bg-brand-primary/10 border border-brand-primary/30 rounded-full">
                <span className="text-sm font-semibold text-brand-primary">🎯 Pharmacy Excellence Learning</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black leading-tight">
                Master Pharmacy with <span className="text-brand-primary">Structured Learning</span>
              </h1>
              
              <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                Comprehensive pharmaceutical education platform designed for serious learners. Learn from industry experts, master exam preparation, and build your career.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-brand-primary text-dark-400 rounded-lg font-bold text-lg hover:opacity-90 transition flex items-center justify-center gap-2 group"
              >
                Get Started Free
                <FaArrowRight className="group-hover:translate-x-1 transition" />
              </button>
              <a
                href="#courses"
                className="px-8 py-4 bg-dark-200 text-white rounded-lg font-bold text-lg border border-dark-100 hover:border-brand-primary/50 transition flex items-center justify-center gap-2"
              >
                <FaPlay size={16} />
                Explore Courses
              </a>
            </div>

            <div className="flex gap-8 pt-8 border-t border-dark-100">
              <div>
                <p className="text-3xl font-black text-brand-primary">{stats.students.toLocaleString()}</p>
                <p className="text-sm text-gray-400 mt-1">Active Learners</p>
              </div>
              <div>
                <p className="text-3xl font-black text-brand-primary">{stats.courses}</p>
                <p className="text-sm text-gray-400 mt-1">Expert Courses</p>
              </div>
              <div>
                <p className="text-3xl font-black text-brand-primary">{stats.success}%</p>
                <p className="text-sm text-gray-400 mt-1">Success Rate</p>
              </div>
            </div>
          </div>

          <div className="relative h-96 md:h-full min-h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent rounded-2xl border border-brand-primary/20" />
            <div className="absolute inset-6 bg-dark-300 rounded-xl border border-dark-100 flex items-center justify-center">
              <div className="text-center">
                <FaBook className="text-6xl text-brand-primary mx-auto mb-4 opacity-50" />
                <p className="text-gray-400">Pharmacy Learning Platform</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ABOUT US SECTION */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section id="about" className="py-24 px-6 md:px-12 bg-gradient-to-b from-transparent to-dark-300/30 border-t border-dark-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Content */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-4xl md:text-5xl font-black">About Us</h2>
                <div className="w-12 h-1 bg-brand-primary rounded-full" />
              </div>

              <p className="text-lg text-gray-400 leading-relaxed">
                Pharmacist Shubham is dedicated to democratizing pharmaceutical education. We believe that access to quality learning shouldn't be limited by geography or resources. Our platform combines expert instruction, practical assessments, and a supportive community to help pharmacy professionals excel.
              </p>

              <p className="text-gray-400 leading-relaxed">
                Whether you're preparing for licensing exams, expanding your clinical knowledge, or advancing your career, we provide the tools and expertise you need to succeed.
              </p>

              <a
                href="#courses"
                className="mt-6 inline-flex items-center gap-2 text-brand-primary hover:text-brand-primaryDark font-semibold transition"
              >
                Explore Our Mission
                <FaArrowRight size={16} />
              </a>
            </div>

            {/* Right: Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              
              <div className="bg-dark-200 border border-dark-100 rounded-xl p-6 hover:border-brand-primary/50 transition group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-brand-primary/20 rounded-lg">
                    <FaGraduationCap className="text-brand-primary text-xl" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-1">Total Students</p>
                <p className="text-3xl font-black text-white">{stats.students.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">Worldwide</p>
              </div>

              <div className="bg-dark-200 border border-dark-100 rounded-xl p-6 hover:border-brand-primary/50 transition group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FaBook className="text-blue-400 text-xl" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-1">Courses</p>
                <p className="text-3xl font-black text-white">{stats.courses}+</p>
                <p className="text-xs text-gray-500 mt-2">Expert-led</p>
              </div>

              <div className="bg-dark-200 border border-dark-100 rounded-xl p-6 hover:border-brand-primary/50 transition group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <FaCheckCircle className="text-green-400 text-xl" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-1">Success Rate</p>
                <p className="text-3xl font-black text-white">{stats.success}%</p>
                <p className="text-xs text-gray-500 mt-2">Pass rate</p>
              </div>

              <div className="bg-dark-200 border border-dark-100 rounded-xl p-6 hover:border-brand-primary/50 transition group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <FaUser className="text-orange-400 text-xl" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-1">Expert Faculty</p>
                <p className="text-3xl font-black text-white">50+</p>
                <p className="text-xs text-gray-500 mt-2">Industry professionals</p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* FEATURED COURSES SECTION */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section id="courses" className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black">Featured Courses</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Explore our most popular and impactful pharmacy courses
            </p>
          </div>

          {/* Courses Grid - Balanced 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            
            {featuredCourses.map((course) => (
              <a
                key={course._id}
                href={`/student/courses/${course._id}`}
                className="group bg-dark-200 rounded-xl overflow-hidden border border-dark-100 hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/10 transition-all duration-300 flex flex-col h-full"
              >
                {/* Thumbnail */}
                <div className="relative h-48 bg-dark-300 overflow-hidden flex items-center justify-center">
                  <div className="text-5xl opacity-40 group-hover:opacity-60 transition-opacity">
                    {course._id === "1" ? "📋" : course._id === "2" ? "🧪" : "🏥"}
                  </div>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
                  
                  {/* Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        course.isPaid
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {course.isPaid ? "Paid" : "Free"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1 space-y-4">
                  
                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-primary transition h-9">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {course.description}
                    </p>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between gap-3 py-3 border-y border-dark-100">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FaBook size={12} />
                      {course.sections} lessons
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FaUsers size={12} />
                      {course.students.toLocaleString()}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          size={12}
                          className={i < Math.floor(course.rating) ? "text-yellow-400" : "text-gray-600"}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-white">{course.rating}</span>
                  </div>

                  {/* CTA Button */}
                  <button className="mt-auto w-full py-2.5 px-4 bg-brand-primary text-dark-400 rounded-lg text-xs font-bold hover:opacity-90 transition">
                    Explore Course
                  </button>
                </div>
              </a>
            ))}

          </div>

          {/* View All Button */}
          <div className="text-center">
            <a
              href="/student/courses"
              className="px-8 py-3 border border-brand-primary text-brand-primary rounded-lg font-bold hover:bg-brand-primary/10 transition inline-flex items-center gap-2"
            >
              View All {stats.courses}+ Courses
              <FaArrowRight />
            </a>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* FEATURES SECTION */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 md:px-12 bg-dark-300/50 border-t border-dark-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black">Why Choose Us?</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              A complete learning ecosystem designed for pharmacy professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="bg-dark-200 border border-dark-100 rounded-xl p-8 hover:border-brand-primary/50 transition group">
              <div className="p-3 bg-brand-primary/20 rounded-lg w-fit mb-4 group-hover:scale-110 transition">
                <FaBook className="text-2xl text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Comprehensive Curriculum</h3>
              <p className="text-gray-400 leading-relaxed">
                Structured courses covering all aspects of pharmaceutical science, from basics to advanced specializations.
              </p>
            </div>

            <div className="bg-dark-200 border border-dark-100 rounded-xl p-8 hover:border-brand-primary/50 transition group">
              <div className="p-3 bg-brand-primary/20 rounded-lg w-fit mb-4 group-hover:scale-110 transition">
                <FaUsers className="text-2xl text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Expert Instructors</h3>
              <p className="text-gray-400 leading-relaxed">
                Learn directly from industry professionals and experienced pharmacists with years of expertise.
              </p>
            </div>

            <div className="bg-dark-200 border border-dark-100 rounded-xl p-8 hover:border-brand-primary/50 transition group">
              <div className="p-3 bg-brand-primary/20 rounded-lg w-fit mb-4 group-hover:scale-110 transition">
                <FaClock className="text-2xl text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Learn at Your Pace</h3>
              <p className="text-gray-400 leading-relaxed">
                Flexible scheduling allows you to study whenever and wherever suits your schedule best.
              </p>
            </div>

            <div className="bg-dark-200 border border-dark-100 rounded-xl p-8 hover:border-brand-primary/50 transition group">
              <div className="p-3 bg-brand-primary/20 rounded-lg w-fit mb-4 group-hover:scale-110 transition">
                <FaCheckCircle className="text-2xl text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Practical Assessments</h3>
              <p className="text-gray-400 leading-relaxed">
                Real-world exams and tests to validate your knowledge and prepare for certifications.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* BLOG SECTION */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section id="blog" className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black">Latest Articles</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Expert insights and tips from the pharmacy education world
            </p>
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            
            {blogPosts.map((post) => (
              <a
                key={post.id}
                href="#"
                className="group bg-dark-200 rounded-xl overflow-hidden border border-dark-100 hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/10 transition-all duration-300 flex flex-col h-full p-6"
              >
                {/* Category Tag */}
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-brand-primary/20 text-brand-primary text-xs font-bold rounded-full">
                    {post.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-brand-primary transition min-h-14">
                  {post.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                  {post.description}
                </p>

                {/* Read Time & CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-dark-100">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <FaClock size={12} />
                    {post.readTime}
                  </span>
                  <button className="text-brand-primary hover:text-brand-primaryDark font-bold text-xs transition flex items-center gap-1">
                    Read More
                    <FaArrowRight size={12} />
                  </button>
                </div>
              </a>
            ))}

          </div>

          {/* View All Articles Button */}
          <div className="text-center">
            <button
              onClick={() => handleScroll("blog")}
              className="px-8 py-3 border border-brand-primary text-brand-primary rounded-lg font-bold hover:bg-brand-primary/10 transition inline-flex items-center gap-2"
            >
              Read More Articles
              <FaArrowRight />
            </button>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TESTIMONIALS SECTION */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-24 px-6 md:px-12 bg-dark-300/30 border-t border-dark-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black">Student Success Stories</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Real experiences from learners who transformed their careers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {[
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
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-dark-200 border border-dark-100 rounded-xl p-8 hover:border-brand-primary/30 transition">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" size={16} />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-white">{testimonial.author}</p>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* PRICING SECTION */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6 md:px-12 border-t border-dark-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black">Flexible Pricing Plans</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan for your learning goals
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {pricingPlans.map((plan, idx) => {
              // For API plans, check if it's a free plan
              const isFree = plan.price === 0 || plan.price === "Free" || plan.id === "FREE";
              const isMostPopular = plan.featured || (plans.length > 0 && idx === Math.floor(plans.length / 2));
              const planPrice = typeof plan.price === "number" ? `₹${plan.price}` : plan.price;
              const planDuration = plan.period || (plan.duration ? `/${Math.ceil(plan.duration / 30)} months` : "");
              
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-8 transition relative ${
                    isMostPopular
                      ? "bg-gradient-to-br from-brand-primary/20 to-transparent border-brand-primary/50 transform scale-105 md:scale-110"
                      : "bg-dark-200 border-dark-100 hover:border-brand-primary/30"
                  }`}
                >
                  {isMostPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-primary text-dark-400 text-xs font-bold rounded-full">
                      MOST POPULAR
                    </div>
                  )}

                  <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mb-6">{plan.desc}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-black text-brand-primary">{planPrice}</span>
                    {planDuration && <span className="text-gray-400">{planDuration}</span>}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <FaCheckCircle className="text-brand-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      if (isFree) {
                        handleGetStarted();
                      } else {
                        handleSubscribe(plan);
                      }
                    }}
                    disabled={processingPlan === plan.id}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      isMostPopular
                        ? "bg-brand-primary text-dark-400 hover:opacity-90 disabled:opacity-50"
                        : "bg-dark-300 text-white border border-dark-100 hover:border-brand-primary/50 disabled:opacity-50"
                    }`}
                  >
                    {processingPlan === plan.id ? "Processing..." : isFree ? "Get Started" : "Subscribe Now"}
                  </button>
                </div>
              );
            })}

          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* FINAL CTA SECTION */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 md:px-12 border-t border-dark-100 bg-dark-300/30">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black">Ready to Transform Your Career?</h2>
            <p className="text-lg text-gray-400">
              Join thousands of pharmacy professionals already learning with us
            </p>
          </div>

          <button
            onClick={handleGetStarted}
            className="px-10 py-4 bg-brand-primary text-dark-400 rounded-lg font-bold text-lg hover:opacity-90 transition inline-flex items-center gap-2 group mx-auto"
          >
            Start Learning Today
            <FaArrowRight className="group-hover:translate-x-1 transition" />
          </button>

          <p className="text-sm text-gray-500">
            No credit card required • Free trial for 7 days • Cancel anytime
          </p>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-dark-100 bg-dark-300/50 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#courses" className="hover:text-white transition">Courses</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#about" className="hover:text-white transition">About</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Learn</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#blog" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Resources</a></li>
              <li><a href="#" className="hover:text-white transition">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms</a></li>
              <li><a href="#" className="hover:text-white transition">Cookies</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>support@pharmacistshubham.com</li>
              <li>+91 XXXX XXX XXX</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-100 pt-8 text-center text-sm text-gray-500">
          <p>&copy; 2024 Pharmacist Shubham. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;