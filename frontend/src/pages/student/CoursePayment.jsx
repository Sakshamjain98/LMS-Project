import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createOrder, verifyPayment } from "../../services/paymentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { Check, Zap, Loader } from "lucide-react";

export default function CoursePayment() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan") || "QUARTERLY";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const planDetails = {
    QUARTERLY: { name: "Pro", price: 999, duration: "3 months", days: 90 },
    YEARLY: { name: "Ultimate", price: 4999, duration: "Lifetime", days: 365 },
  };

  const plan = planDetails[planId] || planDetails.QUARTERLY;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");

      // Create order
      const orderRes = await createOrder(planId);
      const { orderId, amountInPaise, razorpayKeyId } = orderRes.order;

      // Initialize Razorpay
      const options = {
        key: razorpayKeyId,
        amount: amountInPaise,
        currency: "INR",
        order_id: orderId,
        name: "PharmaQuest",
        description: `${plan.name} Plan - ${plan.duration}`,
        handler: async (response) => {
          try {
            // Verify payment
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            alert(
              "Payment successful! Your subscription is pending admin approval. You can continue with your learning once approved."
            );
            navigate("/student/dashboard");
          } catch (err) {
            setError("Payment verification failed: " + err.message);
          }
        },
        prefill: {
          email: localStorage.getItem("userEmail") || "",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError("Error creating order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen bg-dark-400 p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Upgrade to <span className="text-brand-primary">{plan.name}</span>
            </h1>
            <p className="text-gray-400">Get access to all premium courses, tests, and resources</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">
              {error}
            </div>
          )}

          {/* Plan Card */}
          <div className="bg-dark-200 border-2 border-brand-primary rounded-2xl p-8 space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{plan.name} Plan</h2>
              <p className="text-gray-400">{plan.duration} access</p>
            </div>

            {/* Price */}
            <div className="py-6 border-t border-b border-dark-100">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-brand-primary">₹{plan.price}</span>
                <span className="text-gray-400">one-time payment</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                ₹{(plan.price / 30).toFixed(0)}/month equivalent
              </p>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">What you get:</h3>
              <ul className="space-y-3">
                {[
                  "Unlimited access to all courses",
                  "Unlimited test attempts",
                  "Full video library",
                  "Live Q&A sessions",
                  "Advanced performance analytics",
                  "Priority email support",
                  "Certificate of completion",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check size={18} className="text-brand-primary shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-4 bg-brand-primary text-dark-400 rounded-lg font-bold text-lg hover:opacity-90 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Pay ₹{plan.price} & Get Access
                </>
              )}
            </button>

            {/* Trust Badge */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t border-dark-100">
              <p>✓ Secure payment powered by Razorpay</p>
              <p>✓ 7-day money-back guarantee</p>
            </div>
          </div>

          {/* Continue Shopping */}
          <div className="text-center">
            <button
              onClick={() => navigate("/student/courses")}
              className="text-brand-primary hover:text-brand-primaryDark transition"
            >
              ← Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
