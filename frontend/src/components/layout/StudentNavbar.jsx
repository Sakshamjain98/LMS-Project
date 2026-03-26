import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Crown, Rocket } from "lucide-react";
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
      // Redirects to your exact pricing section when on the free plan
      window.location.href = "http://localhost:5173/#pricing";
    } else {
      // Toggles the short message if already subscribed
      setShowSubscriptionMenu(!showSubscriptionMenu);
      setShowProfileMenu(false); // close profile menu if open
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-dark-400 border-b border-dark-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        
        {/* Left: You can add a Logo or Title here if needed */}
        <div></div>

        {/* Right: Subscription Status & Profile */}
        <div className="flex items-center gap-4">
          
          {/* Subscription Status Icon */}
          <div className="relative flex items-center">
            <button
              onClick={handleSubscriptionClick}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                isSubscribed
                  ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/20"
                  : "bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
              }`}
              title={isSubscribed ? "Premium Status" : "Upgrade to Premium"}
            >
              {isSubscribed ? <Crown size={18} /> : <Rocket size={18} />}
            </button>

            {/* Short Subscription Message Menu */}
            {showSubscriptionMenu && isSubscribed && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-dark-300 border border-white/10 rounded-lg shadow-2xl p-3 z-50">
                <p className="text-sm text-white font-medium text-center">
                  You have the <span className="text-brand-primary">{subscriptionPlan}</span> plan! 🎉
                </p>
                <p className="text-xs text-gray-400 text-center mt-1">
                  Enjoy your premium features.
                </p>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowSubscriptionMenu(false); // close subscription menu if open
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-300 transition"
            >
              <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-dark-400 text-sm font-bold shadow-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </button>

            {/* Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-300 border border-dark-100 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-dark-100">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    navigate("/student/profile");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-200 transition flex items-center gap-2"
                >
                  <User size={16} />
                  Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-dark-200 transition flex items-center gap-2 border-t border-dark-100"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}