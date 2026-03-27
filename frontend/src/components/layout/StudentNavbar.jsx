import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { User, LogOut, Crown, Star } from "lucide-react";
import { getStudentProfile, getStudentSubscription } from "../../services/studentService";

export default function StudentNavbar() {
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSubscriptionMenu, setShowSubscriptionMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState("FREE");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileAndSubscription = async () => {
      try {
        const [profileRes, subscriptionRes] = await Promise.all([
          getStudentProfile(),
          getStudentSubscription(),
        ]);
        setUser(profileRes.user);
        const subscription = subscriptionRes || profileRes.subscription || { plan: "FREE", status: "ACTIVE" };
        const plan = subscription.plan;
        const isActive = subscription.status === "ACTIVE" && plan !== "FREE";
        setSubscriptionPlan(plan);
        setIsSubscribed(isActive);
        localStorage.setItem("subscriptionStatus", isActive ? plan : "FREE");
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfileAndSubscription();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSubscriptionClick = () => {
    if (!isSubscribed) {
      navigate("/#pricing");
    } else {
      setShowSubscriptionMenu(!showSubscriptionMenu);
      setShowProfileMenu(false);
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-40 bg-dark-400 border-b border-dark-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo Section - Clickable */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
      
          
          {/* Subscription Badge */}
          {/* <div className="ml-2">
            {isSubscribed ? (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full border border-yellow-500/30">
                <Crown size={14} className="text-yellow-500" />
                <span className="text-xs font-medium text-yellow-500">
                  {subscriptionPlan === "PREMIUM" ? "Premium" : subscriptionPlan}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-500/20 rounded-full border border-gray-500/30">
                <Star size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-400">Free</span>
              </div>
            )}
          </div> */}
        </button>

        <div className="flex items-center gap-4">
          <div className="relative flex items-center">
            <button
              onClick={handleSubscriptionClick}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                isSubscribed
                  ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/40"
                  : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
              }`}
              title={isSubscribed ? `${subscriptionPlan} Plan Active` : "Upgrade to Premium"}
            >
              {isSubscribed ? <Crown size={16} /> : <Star size={16} />}
            </button>

            {showSubscriptionMenu && isSubscribed && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-dark-300 border border-white/10 rounded-lg shadow-2xl p-3 z-50">
                <p className="text-sm text-white font-medium text-center">
                  You have the <span className="text-yellow-500">{subscriptionPlan}</span> plan! 🎉
                </p>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowSubscriptionMenu(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-300 transition"
            >
              <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-dark-400 text-sm font-bold shadow-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </button>

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