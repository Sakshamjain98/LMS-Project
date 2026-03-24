import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getQuestionAnalytics } from "../../services/teacherService";
import { Activity, Percent, Clock } from "lucide-react";

export default function QuestionAnalytics() {
  const { questionId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getQuestionAnalytics(questionId);
        setAnalytics(res.analytics);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [questionId]);

  if (loading) return <div className="min-h-screen bg-[#090b10]"></div>;

  return (
    <div className="min-h-screen bg-[#090b10] text-white p-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#121620] border border-white/5 rounded-[40px] p-12 shadow-2xl overflow-hidden relative">
          {/* Decorative Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00c885]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          
          <h1 className="text-3xl font-black mb-10 border-b border-white/5 pb-6">Question Deep-Dive</h1>
          
          {analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DetailCard icon={<Activity className="text-blue-400"/>} label="Total Attempts" val={analytics.totalAttempts} />
              <DetailCard icon={<Percent className="text-[#00c885]"/>} label="Success Rate" val={`${analytics.accuracy}%`} />
              <DetailCard icon={<Clock className="text-purple-400"/>} label="Avg Duration" val={`${analytics.averageTime}s`} />
            </div>
          ) : (
            <div className="py-20 text-center text-white/10 font-bold uppercase tracking-widest">No Metric Data</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon, label, val }) {
    return (
        <div className="bg-[#090b10] p-8 rounded-3xl border border-white/5">
            <div className="mb-4">{icon}</div>
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{label}</p>
            <p className="text-4xl font-black mt-2">{val}</p>
        </div>
    );
}