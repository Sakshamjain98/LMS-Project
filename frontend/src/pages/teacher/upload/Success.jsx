import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const courseId = location.state?.courseId;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle size={40} className="text-green-400" />
          </div>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Course Published Successfully!
          </h1>
          <p className="text-grayCustom-medium">
            Your course is now live and students can enroll. You can manage it from your dashboard.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={() => navigate("/teacher/dashboard")}
            className="w-full py-4 bg-brand-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRight size={18} />
          </button>

          {courseId && (
            <button
              onClick={() => navigate(`/teacher/course/${courseId}`)}
              className="w-full py-3 border border-brand-primary text-brand-primary font-medium rounded-xl hover:bg-brand-primary/10 transition-colors"
            >
              View Course
            </button>
          )}

          <button
            onClick={() => navigate("/teacher/upload/basics")}
            className="w-full py-3 border border-dark-100 text-white rounded-xl hover:bg-dark-100 transition-colors"
          >
            Create Another Course
          </button>
        </div>
      </div>
    </div>
  );
}
