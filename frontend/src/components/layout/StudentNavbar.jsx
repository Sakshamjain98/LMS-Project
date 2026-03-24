import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Zap } from "lucide-react";
import { getStudentProfile } from "../../services/studentService";

export default function StudentNavbar() {
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSubscriptionMenu, setShowSubscriptionMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState("FREE");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getStudentProfile();
        setUser(res.user);
        const plan = res.subscription?.plan || "FREE";
        const status = res.subscription?.status || "INACTIVE";
        
        setSubscriptionPlan(plan);
        setIsSubscribed(plan !== "FREE" && status === "ACTIVE");

        // Update localStorage for other components
        localStorage.setItem("subscriptionStatus", plan);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("subscriptionStatus");
    navigate("/login");
  };

  const handleSubscriptionClick = () => {
    if (!isSubscribed) {
      navigate("/#pricing");
    } else {
      setShowSubscriptionMenu(!showSubscriptionMenu);
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-dark-400 border-b border-dark-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Left: Subscription Status */}
        <div className="flex items-center relative">
          <button
            onClick={handleSubscriptionClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isSubscribed
                ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/20"
                : "bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
            }`}
            title={isSubscribed ? "Click to view features" : "Click to subscribe"}
          >
            <Zap size={14} />
            {isSubscribed ? "Premium" : "Free Plan"}
          </button>

          {/* Subscription Features Menu */}
          {showSubscriptionMenu && isSubscribed && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-dark-300 border border-white/10 rounded-lg shadow-2xl p-4 z-50">
              <h3 className="font-bold text-white mb-3 text-sm">Your Premium Features</h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-0.5">✓</span>
                  <span>Access all premium courses and materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-0.5">✓</span>
                  <span>Unlimited test attempts with detailed analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-0.5">✓</span>
                  <span>Download notes and study materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-0.5">✓</span>
                  <span>Priority email and chat support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-0.5">✓</span>
                  <span>Certificates of completion</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-primary mt-0.5">✓</span>
                  <span>Ad-free learning experience</span>
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-4 border-t border-white/5 pt-3">
                Plan: <span className="text-brand-primary font-semibold">{subscriptionPlan}</span>
              </p>
            </div>
          )}
        </div>

        {/* Right: Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-300 transition"
          >
            <div className="w-7 h-7 bg-brand-primary rounded-full flex items-center justify-center text-dark-400 text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </button>

          {/* Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-dark-300 border border-dark-100 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="px-3 py-2 border-b border-dark-100">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  navigate("/student/profile");
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-200 transition flex items-center gap-2"
              >
                <User size={14} />
                Profile
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-dark-200 transition flex items-center gap-2 border-t border-dark-100"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
