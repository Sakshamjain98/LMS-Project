import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaPlay } from "react-icons/fa";
import { Zap, LogOut, LayoutDashboard } from "lucide-react";
import logo from "../../assets/icons/logo.png";
import { getStudentSubscription } from "../../services/studentService";

// Cross-component event used by Home.jsx to open the trial popup. Defined here
// so the navbar (which doesn't share state with Home) can fire it.
const OPEN_TRIAL_MODAL_EVENT = "ps:open-trial-modal";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState("FREE");
  const [showSubscriptionMenu, setShowSubscriptionMenu] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const syncAuthState = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");
      const subscription = localStorage.getItem("subscriptionStatus");

      setIsAuthenticated(!!token);
      setUserRole(role);
      setSubscriptionStatus(subscription || "FREE");

      if (!token || role !== "student") return;

      try {
        const currentSubscription = await getStudentSubscription();
        const currentPlan =
          currentSubscription?.status === "ACTIVE" && currentSubscription?.plan !== "FREE"
            ? currentSubscription.plan
            : "FREE";

        setSubscriptionStatus(currentPlan);
        localStorage.setItem("subscriptionStatus", currentPlan);
      } catch (err) {
        console.error("Failed to sync subscription status:", err);
      }
    };

    syncAuthState();
  }, []);

  const navLinks = [
    { name: "Home", id: "home" },
    { name: "About", id: "about" },
    { name: "Features", id: "why-us" },
    { name: "Test Series", id: "test-series" },
    { name: "Courses", id: "courses" },
    { name: "Articles", id: "blog" },
    { name: "News", id: "news" },
    { name: "Testimonials", id: "testimonials" },
    // { name: "Pricing", id: "pricing" },
  ];

  const handleNavClick = (e, id) => {
    e.preventDefault();

    if (!isHomePage) {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        setActiveSection(id);
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }

    setIsOpen(false);
  };

  const handleSubscriptionClick = () => {
    if (subscriptionStatus === "FREE") {
      navigate("/#pricing");
    } else {
      setShowSubscriptionMenu(!showSubscriptionMenu);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("subscriptionStatus");
    navigate("/login");
  };

  // Free Trial CTA — opens the trial popup on Home.jsx via a window event so
  // we don't have to lift modal state across the component tree. If we're on
  // any other route, jump to "/" first; the popup will follow on next paint.
  const handleFreeTrialClick = () => {
    setIsOpen(false);
    if (!isHomePage) {
      navigate("/");
      setTimeout(() => window.dispatchEvent(new Event(OPEN_TRIAL_MODAL_EVENT)), 80);
    } else {
      window.dispatchEvent(new Event(OPEN_TRIAL_MODAL_EVENT));
    }
  };

  useEffect(() => {
    if (!isHomePage) return;

    const handleScroll = () => {
      const sections = navLinks.map((link) => ({
        id: link.id,
        element: document.getElementById(link.id),
      }));

      for (let section of sections) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHomePage]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
  }, [isOpen]);

  return (
    <>
      <nav className="bg-dark-400/80 backdrop-blur-md border-b border-white/5 fixed w-full z-50 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16">

          {/* LEFT */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-white hover:text-brand-primary transition"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <FaTimes size={26} /> : <FaBars size={26} />}
            </button>

            <Link to="/" className="shrink-0 hover:opacity-80 transition">
              <img
                src={logo}
                alt="logo"
                className="h-12 w-12 object-contain"
              />
            </Link>
          </div>

          {/* CENTER - NAV LINKS */}
          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleNavClick(e, link.id)}
                className={`text-base font-semibold transition relative pb-1 ${
                  activeSection === link.id && isHomePage
                    ? "text-brand-primary"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.name}
                {activeSection === link.id && isHomePage && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
                )}
              </a>
            ))}
          </div>

          {/* RIGHT */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated && userRole === "student" && (
              <div className="relative">
                <button
                  onClick={handleSubscriptionClick}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    subscriptionStatus === "FREE"
                      ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20"
                      : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border border-brand-primary/20"
                  }`}
                  title={subscriptionStatus === "FREE" ? "Click to subscribe" : "View subscription details"}
                >
                  <Zap size={16} />
                  {subscriptionStatus === "FREE" ? "Free Plan" : "Subscribed"}
                </button>

                {showSubscriptionMenu && subscriptionStatus !== "FREE" && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-dark-300 border border-white/10 rounded-xl shadow-2xl p-4 z-50">
                    <h3 className="font-bold text-white mb-3">Subscribed Features</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li>✓ Access all premium test series</li>
                      <li>✓ Unlimited test attempts</li>
                      <li>✓ Detailed analytics &amp; ranks</li>
                      <li>✓ Priority support</li>
                      <li>✓ Certificates of completion</li>
                      <li>✓ Ad-free experience</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-4">Your subscription is active</p>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated && (
              <Link
                to={userRole === "admin" ? "/admin/dashboard" : "/student/dashboard"}
                className="flex items-center gap-2 px-5 py-2.5 btn-gradient rounded-lg font-bold text-sm"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            )}

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg font-semibold transition-all text-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <>
                <button
                  onClick={handleFreeTrialClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold border border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition"
                >
                  <FaPlay size={11} />
                  Free Trial
                </button>
                <Link
                  to="/login"
                  className="px-6 py-2.5 btn-gradient rounded-lg text-base font-bold hover:opacity-90 transition"
                >
                  Login
                </Link>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-dark-400 border-r border-white/10 z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <img src={logo} alt="logo" className="h-12 w-12 object-contain" />
          <button onClick={() => setIsOpen(false)}>
            <FaTimes size={26} />
          </button>
        </div>

        {/* Mobile Nav Links */}
        <nav className="flex flex-col flex-1 overflow-y-auto">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => handleNavClick(e, link.id)}
              className="px-6 py-5 text-base font-semibold border-b border-white/5 text-gray-300 hover:text-white hover:bg-dark-300 transition"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Mobile Auth Section */}
        <div className="p-6 border-t border-white/10 space-y-3">
          {isAuthenticated && userRole === "student" && (
            <button
              onClick={handleSubscriptionClick}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                subscriptionStatus === "FREE"
                  ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                  : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
              }`}
            >
              <Zap size={16} />
              {subscriptionStatus === "FREE" ? "Get Premium" : "Subscribed"}
            </button>
          )}
          {isAuthenticated ? (
            <>
              <Link
                to={userRole === "admin" ? "/admin/dashboard" : "/student/dashboard"}
                onClick={() => setIsOpen(false)}
                className="block w-full text-center px-4 py-2.5 btn-gradient rounded-lg font-bold"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleFreeTrialClick}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold border border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition"
              >
                <FaPlay size={11} />
                Free Trial
              </button>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center px-4 py-2.5 btn-gradient rounded-lg font-bold"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;