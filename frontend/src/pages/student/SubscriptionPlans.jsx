import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, AlertCircle } from "lucide-react";
import { createPaymentOrder, verifyPayment } from "../../services/studentService";

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: "QUARTERLY",
      name: "Quarterly",
      duration: "3 months",
      price: 999,
      description: "Perfect for short-term learners",
      features: [
        "Access to all courses",
        "Unlimited test attempts",
        "Download materials",
        "Email support",
        "3 months access",
      ],
    },
    {
      id: "HALF_YEARLY",
      name: "Half-Yearly",
      duration: "6 months",
      price: 1799,
      description: "Best for dedicated learners",
      popular: true,
      features: [
        "Access to all courses",
        "Unlimited test attempts",
        "Download materials",
        "Priority support",
        "6 months access",
        "Monthly webinars",
      ],
    },
    {
      id: "YEARLY",
      name: "Yearly",
      duration: "12 months",
      price: 2999,
      description: "Maximum savings & value",
      features: [
        "Access to all courses",
        "Unlimited test attempts",
        "Download materials",
        "24/7 priority support",
        "12 months access",
        "Weekly webinars",
        "Personal mentor",
      ],
    },
  ];

  const handleSelectPlan = async (plan) => {
    if (!window.Razorpay) {
      setError("Payment gateway not loaded. Please refresh the page.");
      return;
    }

    setSelectedPlan(plan.id);
    setLoading(true);
    setError("");

    try {
      // Step 1: Create payment order
      const orderRes = await createPaymentOrder(plan.id);
      
      const options = {
        key: orderRes.razorpayKeyId,
        amount: orderRes.amountInPaise,
        currency: orderRes.currency,
        name: "Pharmacist Academy",
        description: `${plan.name} Plan - ${plan.duration}`,
        order_id: orderRes.orderId,
        handler: async function (response) {
          try {
            // Step 2: Verify payment
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              // Payment verified
              localStorage.setItem("subscriptionStatus", plan.id);
              
              if (verifyRes.pendingAdminApproval) {
                // Show success message but mark as pending
                alert(
                  "Payment received successfully!\n\nYour subscription is pending admin approval. You'll get full access once approved."
                );
              } else {
                // Immediate activation
                alert("Welcome to Premium! Your subscription is now active.");
              }

              // Redirect to dashboard
              setTimeout(() => {
                navigate("/student/dashboard");
              }, 1500);
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            setError(verifyErr.message || "Payment verification failed");
          }
        },
        prefill: {
          email: localStorage.getItem("userEmail"),
          contact: localStorage.getItem("userPhone"),
        },
        theme: {
          color: "#00c885",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setSelectedPlan(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Order creation error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to initiate payment";
      setError(errorMsg);
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-300 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 border border-brand-primary/30 rounded-full">
            <Zap size={16} className="text-brand-primary" />
            <span className="text-sm font-semibold text-brand-primary">Upgrade to Premium</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">Choose Your Plan</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Unlock unlimited access to courses, tests, materials, and expert support
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${
                plan.popular
                  ? "md:scale-105 border-brand-primary/50 bg-dark-200 shadow-2xl shadow-brand-primary/20"
                  : "border-white/5 bg-dark-200 hover:border-brand-primary/30"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -right-12 top-6 w-40 rotate-45 bg-brand-primary py-1 text-center text-black text-xs font-bold uppercase tracking-wider shadow-lg">
                  Most Popular
                </div>
              )}

              {/* Card Content */}
              <div className="p-8 flex flex-col h-full">
                
                {/* Plan Info */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-brand-primary">₹{plan.price}</span>
                    <span className="text-sm text-gray-500">/</span>
                    <span className="text-sm text-gray-400">{plan.duration}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check size={18} className="text-brand-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loading && selectedPlan === plan.id}
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    plan.popular
                      ? "bg-brand-primary text-black hover:opacity-90"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading && selectedPlan === plan.id ? "Processing..." : "Choose Plan"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-dark-200 border border-white/5 rounded-xl p-6">
            <div className="text-2xl mb-3">✓</div>
            <h4 className="font-semibold text-white mb-2">Instant Activation</h4>
            <p className="text-sm text-gray-400">Start learning immediately after successful payment</p>
          </div>
          <div className="bg-dark-200 border border-white/5 rounded-xl p-6">
            <div className="text-2xl mb-3">🔒</div>
            <h4 className="font-semibold text-white mb-2">Secure Payment</h4>
            <p className="text-sm text-gray-400">Powered by Razorpay for safe and encrypted transactions</p>
          </div>
          <div className="bg-dark-200 border border-white/5 rounded-xl p-6">
            <div className="text-2xl mb-3">↩️</div>
            <h4 className="font-semibold text-white mb-2">Money-Back Guarantee</h4>
            <p className="text-sm text-gray-400">7-day refund policy if not satisfied</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-dark-200 border border-white/5 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Can I cancel my subscription?</h4>
              <p className="text-sm text-gray-400">Yes, you can cancel anytime. Your access continues until the end of the billing period.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-gray-400">We accept all major credit/debit cards, UPI, net banking, and digital wallets through Razorpay.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Is my payment secure?</h4>
              <p className="text-sm text-gray-400">Yes, we use industry-leading encryption and PCI compliance through Razorpay.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
    </div>
  );
}
