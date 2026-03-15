import React from "react";
import {
  FaRocket,
  FaPlay,
  FaUsers,
  FaBookOpen,
  FaChartLine,
  FaVideo,
  FaFileAlt,
  FaGamepad,
  FaRobot,
  FaUserFriends,
  FaStar,
  FaArrowRight,
  FaBullhorn,
  FaBolt,
  FaYoutube,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
} from "react-icons/fa";
import { MdOutlineVerified, MdCastForEducation } from "react-icons/md";

// Import Custom Components
import StatCard from "../../components/home/StatCard";
import FeatureCard from "../../components/home/FeatureCard";
import CourseBrowseCard from "../../components/home/CourseBrowseCard";
import FacultyCard from "../../components/home/FacultyCard";
import BlogCard from "../../components/home/BlogCard";
import TestimonialCard from "../../components/home/TestimonialCard";
import NewsItem from "../../components/home/NewsItem";
import PricingCard from "../../components/home/PricingCard";

const Home = () => {
  return (
    <div className="bg-dark-400 min-h-screen text-white pt-16 selection:bg-brand-primary selection:text-dark-400">
      {/* 1. HERO SECTION */}

      <section id="home"  className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-dark-400">
        {/* Radial Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18)_0%,_transparent_60%)]"></div>

        {/* Glowing Orb */}
        <div className="absolute w-[600px] h-[600px] bg-brand-primary/10 blur-[160px] rounded-full bottom-[20%] left-1/2 -translate-x-1/2 -z-10"></div>

        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 bg-dark-200 border border-brand-primary/20 px-4 py-1.5 rounded-full text-[11px] text-yellow-500 mb-8">
          <FaRocket className="text-[10px]" />
          <span>Welcome to the Future of learning</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-4xl mb-6 text-white">
          Structured Learning for <br />
          <span className="text-brand-primary">Pharmacy</span> &{" "}
          <span className="text-brand-primary">Government</span> Exam Excellence
        </h1>

        {/* Description */}
        <p className="text-gray-400 max-w-2xl text-base md:text-lg mb-10 leading-relaxed">
          Master government pharmacy exams with gamified learning, live classes,
          and AI-powered test preparation. Join 50,000+ pharmacists on their
          journey to success.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button className="bg-brand-primary hover:bg-brand-primaryDark text-dark-400 font-bold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-primary/30">
            Start Your Journey <FaArrowRight />
          </button>

          <button className="bg-dark-200 border border-white/10 hover:bg-dark-100 px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all">
            <FaPlay className="text-[10px]" /> Explore Plus
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
          <StatCard
            icon={<FaUsers />}
            count="50,000+"
            label="Active Students"
          />
          <StatCard icon={<FaBookOpen />} count="500+" label="Video Lectures" />
          <StatCard
            icon={<MdOutlineVerified />}
            count="95%"
            label="Success Rate"
          />
        </div>
      </section>
      {/* 2. FEATURES SECTION */}
      <section className="py-24 px-6 bg-dark-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-brand-primary/5 border border-brand-primary/10 px-3 py-1 rounded-lg text-brand-primary text-[10px] font-bold uppercase tracking-widest mb-4">
              <MdCastForEducation /> Power-Ups for Success
            </div>
            <h2 className="text-4xl md:text-4xl font-bold">
              Everything You Need to{" "}
              <span className="text-brand-primary">Conquer</span> Your Exams
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <FeatureCard
              icon={<FaVideo className="text-brand-primary" />}
              title="Live Interactive Classes"
              desc="Join live sessions with expert faculty. Ask questions and learn in real-time."
            />
            <FeatureCard
              icon={<FaFileAlt className="text-purple-500" />}
              title="Comprehensive Notes"
              desc="Access curated study materials, PYPs, and quick revision notes."
            />
            <FeatureCard
              icon={<FaGamepad className="text-yellow-500" />}
              title="Gamified Learning"
              desc="Earn XP, unlock achievements, and climb the leaderboard as you progress."
            />
            <FeatureCard
              icon={<FaRobot className="text-brand-primary" />}
              title="AI-Powered Tests"
              desc="Practice with smart question banks that adapt to your performance."
            />
            <FeatureCard
              icon={<FaChartLine className="text-pink-500" />}
              title="Performance Analytics"
              desc="Track your progress with detailed analytics and personalized suggestions."
            />
            <FeatureCard
              icon={<FaUserFriends className="text-orange-500" />}
              title="Community Support"
              desc="Connect with fellow aspirants and get mentorship from winners."
            />
          </div>
        </div>
      </section>

      {/* 3. BROWSE COURSES SECTION */}
      <section className="py-24 px-6 bg-dark-400">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Browse <span className="text-brand-primary">Courses</span>
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Expert-led courses designed for GPAT, NIPER, PPSC, and other
              government pharmacy exams.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CourseBrowseCard
              title="Pharmacology Complete Course"
              category="Pharmacology"
              price="2,999"
              lectures="85"
              hours="42"
              students="12,500"
              rating="4.9"
            />
            <CourseBrowseCard
              title="Pharmaceutics – GPAT Focused"
              category="Pharmaceutics"
              price="2,499"
              lectures="72"
              hours="36"
              students="9,800"
              rating="4.8"
            />
            <CourseBrowseCard
              title="Pharmaceutical Chemistry Masterclass"
              category="Pharm. Chemistry"
              price="2,999"
              lectures="60"
              hours="30"
              students="7,600"
              rating="4.8"
            />
            <CourseBrowseCard
              title="Hospital & Clinical Pharmacy"
              category="Clinical Pharmacy"
              price="1,999"
              lectures="40"
              hours="20"
              students="5,400"
              rating="4.6"
            />
            <CourseBrowseCard
              title="Pharmacology Special Batch"
              category="Pharmacology"
              price="1,499"
              lectures="30"
              hours="15"
              students="3,200"
              rating="4.7"
            />
            <CourseBrowseCard
              title="Drug Regulatory Affairs"
              category="Regulatory"
              price="2,199"
              lectures="45"
              hours="25"
              students="4,100"
              rating="4.8"
            />
          </div>
        </div>
      </section>

      {/* 4. FACULTY SECTION */}
      <section className="py-24 px-6 bg-dark-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">
              Our <span className="text-brand-primary">Faculty</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <FacultyCard
              name="Dr. Priya Sharma"
              role="Founder & Lead Educator"
              dept="Pharmacology"
              xp="25,000"
              initial="DPS"
            />
            <FacultyCard
              name="Prof. Rajesh Kumar"
              role="Content Head"
              dept="Pharmaceutics"
              xp="22,000"
              initial="PRK"
            />
            <FacultyCard
              name="Dr. Anita Verma"
              role="Test Series Lead"
              dept="Pharmacognosy"
              xp="20,500"
              initial="DAV"
            />
            <FacultyCard
              name="Dr. Vikram Singh"
              role="Senior Faculty"
              dept="Pharm. Chemistry"
              xp="18,000"
              initial="DVS"
            />
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS SECTION */}
      <section className="py-24 px-6 bg-dark-400">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="bg-brand-primary/10 text-brand-primary px-4 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-2 mb-4 uppercase">
              <FaStar className="text-[8px]" /> Success Stories
            </div>
            <h2 className="text-4xl font-bold">
              Hear from Our{" "}
              <span className="text-brand-primary">Champions</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TestimonialCard
              name="Aditya Sharma"
              role="GPAT 2024 - AIR 156"
              tag="GPAT Success"
              avatarColor="bg-green-400"
              text="PharmaQuest's gamified approach made studying fun! The streaks and XP system kept me motivated throughout my preparation."
            />
            <TestimonialCard
              name="Priyanka Reddy"
              role="NIPER JEE - AIR 42"
              tag="NIPER Success"
              avatarColor="bg-blue-400"
              text="The test series is incredibly close to the actual exam pattern. The detailed analytics helped me identify weak areas."
            />
            <TestimonialCard
              name="Rohit Kumar"
              role="PPSC Pharmacist - Selected"
              tag="PPSC Success"
              avatarColor="bg-teal-400"
              text="Live classes with doubt clearing sessions were a game-changer. The faculty is excellent and always available."
            />
            <TestimonialCard
              name="Sneha Patel"
              role="Railway Pharmacist - Selected"
              tag="Railway Success"
              avatarColor="bg-orange-400"
              text="I joined just 2 months before my exam. The crash course covered everything essential for the Railway selection."
            />
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-dark-300 rounded-3xl border border-white/5 text-center">
            <div>
              <h4 className="text-2xl font-bold text-brand-primary mb-1">
                50,000+
              </h4>
              <p className="text-gray-500 text-[10px] uppercase">
                Students Enrolled
              </p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-brand-primary mb-1">
                95%
              </h4>
              <p className="text-gray-500 text-[10px] uppercase">
                Success Rate
              </p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-brand-primary mb-1">
                1,500+
              </h4>
              <p className="text-gray-500 text-[10px] uppercase">
                Selections in 2024
              </p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-brand-primary mb-1">
                4.9/5
              </h4>
              <p className="text-gray-500 text-[10px] uppercase">
                Average Rating
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PHARMA BLOG SECTION */}
      <section className="py-24 px-6 bg-dark-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            
            <h2 className="text-4xl font-bold">
              Pharma <span className="text-brand-primary">Blog</span>
            </h2>
            <p className="text-gray-500 text-sm mt-4">
              Expert tips, study strategies, and insights for government
              pharmacy exams.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {[
                "All",
                "GPAT",
                "NIPER",
                "PPSC",
                "Pharmacology",
                "Study Tips",
              ].map((tag, idx) => (
                <button
                  key={tag}
                  className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                    idx === 0
                      ? "bg-brand-primary text-dark-400 font-bold"
                      : "bg-dark-100 text-gray-400 hover:text-white border border-white/5"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BlogCard
              category="GPAT"
              title="Top 10 Pharmacology Topics for GPAT 2025"
              desc="Master these high-yield pharmacology topics that appear most frequently in GPAT."
              author="Dr. Priya Sharma"
              time="8"
            />
            <BlogCard
              category="NIPER"
              title="How to Build a 90-Day Study Plan for NIPER"
              desc="A comprehensive day-by-day breakdown of what to study and how to maximize prep."
              author="Prof. Rajesh Kumar"
              time="12"
            />
            <BlogCard
              category="Study Tips"
              title="Drug Classification Mnemonics That Actually Work"
              desc="Forget rote learning. These creative mnemonics will help you remember forever."
              author="Dr. Anita Verma"
              time="6"
            />
          </div>
          <div className="text-center mt-12">
            <button className="bg-dark-100 border border-white/10 text-white px-8 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 mx-auto hover:bg-dark-200">
              Load More Articles <FaArrowRight className="text-[10px]" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. LATEST NEWS SECTION */}
      <section className="py-24 px-6 bg-dark-400">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-2 mb-4 uppercase">
              <FaBullhorn className="text-[8px]" /> News
            </div>
            <h2 className="text-4xl font-bold ">
              Latest <span className="text-brand-primary ">News</span>
            </h2>
          </div>
          <div className="space-y-4">
            <NewsItem
              category="Exam Update"
              isUrgent={true}
              date="Jan 20, 2026"
              title="GPAT 2026 Exam Date Announced by NTA"
              desc="NTA has officially announced the exam dates. Registration begins February 1st."
            />
            <NewsItem
              category="Syllabus"
              isUrgent={false}
              date="Jan 18, 2026"
              title="NIPER JEE 2026: New Syllabus Changes"
              desc="Minor additions in Pharmacology and Regulatory Affairs. Download the PDF now."
            />
            <NewsItem
              category="Job Alert"
              isUrgent={true}
              date="Jan 12, 2026"
              title="PPSC Pharmacy Officer Recruitment 2026"
              desc="200+ vacancies announced. Last date to apply is March 15."
            />
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section className="py-24 px-6 bg-dark-300">
  <div className="max-w-6xl mx-auto text-center">

    <h2 className="text-4xl font-bold mb-4">
      Invest in Your{" "}
      <span className="text-brand-primary">Future</span>
    </h2>

    <p className="text-gray-500 mb-16 text-sm italic">
      Flexible plans designed to fit every aspirant's needs. Start free
      and upgrade when you're ready.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-left">

      <PricingCard
        title="Free"
        subtitle="Start your pharmacy journey"
        price="0"
        btnText="Get Started"
        features={[
          "Access to free notes & blogs",
          "Limited test attempts",
          "Basic performance analytics",
          "Community forum access",
          "5 XP per day limit",
        ]}
      />

      <PricingCard
        isPopular={true}
        title="Pro"
        subtitle="For serious exam aspirants"
        price="999"
        btnText="Start 7-Day Free Trial"
        features={[
          "All free features",
          "Unlimited test attempts",
          "Full video library access",
          "Live classes participation",
          "Advanced analytics & insights",
          "Priority doubt resolution",
          "Unlimited XP earnings",
        ]}
      />

      <PricingCard
        title="Ultimate"
        subtitle="Complete exam mastery"
        price="4,999"
        btnText="Go Ultimate"
        features={[
          "All Pro features",
          "1-on-1 mentorship sessions",
          "Personalized study plan",
          "Mock interview preparation",
          "Certificate of completion",
          "Lifetime access to materials",
          "VIP Discord community",
        ]}
      />

    </div>
  </div>
</section>

{/* NEWSLETTER */}
<section className="py-28 px-6 bg-dark-400">
  <div className="max-w-6xl mx-auto">

    <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-brand-primary/40 via-brand-primary/10 to-brand-primary/40">

      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-2xl blur-xl opacity-20 bg-brand-primary"></div>

      {/* Inner Box */}
      <div className="relative bg-[#0B0F14] rounded-2xl px-8 py-10 md:px-12 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Left Text */}
        <div>
          <h3 className="text-xl md:text-2xl font-semibold text-white">
            Stay Ahead of the{" "}
            <span className="text-brand-primary">Competition</span>
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Get daily tips, study materials, and exam updates delivered to your inbox.
          </p>
        </div>

        {/* Input */}
        <div className="flex w-full md:w-auto gap-3">

          <input
            type="email"
            placeholder="Enter your email"
            className="bg-dark-200 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none w-full md:w-72"
          />

          <button className="bg-brand-primary text-dark-400 px-5 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition">
            Join us
          </button>

        </div>

      </div>

    </div>

  </div>
</section>

{/* FOOTER */}
<footer className="bg-dark-400 px-6 pb-10">

  <div className="max-w-6xl mx-auto">

    {/* ROW 1 */}
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-10">

      <h2 className="text-xl font-semibold">
        Pharmacist{" "}
        <span className="text-brand-primary">Shubham</span>
      </h2>

      <div className="flex flex-wrap gap-6 text-sm text-gray-400">
        <a className="hover:text-brand-primary transition">About</a>
        <a className="hover:text-brand-primary transition">Contact us</a>
        <a className="hover:text-brand-primary transition">Terms and Conditions</a>
        <a className="hover:text-brand-primary transition">
          Cancellation and Refund Policy
        </a>
      </div>

    </div>


    {/* DIVIDER */}
    <div className="border-t border-white/10"></div>


    {/* ROW 2 */}
    <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-6">

      <p className="text-xs text-gray-500">
        © 2025 PharmaQuest. All rights reserved.
      </p>

      <div className="flex gap-3">
        {[FaYoutube, FaInstagram, FaLinkedin, FaTwitter].map((Icon, i) => (
          <div
            key={i}
            className="w-9 h-9 bg-dark-200 rounded-full flex items-center justify-center text-gray-400 hover:text-brand-primary hover:bg-dark-300 transition border border-white/5 cursor-pointer"
          >
            <Icon size={14} />
          </div>
        ))}
      </div>

    </div>

  </div>

</footer>
    </div>
  );
};

export default Home;
