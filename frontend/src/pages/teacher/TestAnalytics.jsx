import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Target, Users, Zap, Award, Timer, ChevronDown, BarChart2 } from "lucide-react";
import { getTeacherTestById, getTeacherTestAnalytics, getTeacherQuestionAnalytics } from "../../services/teacherService";

export default function TestAnalytics() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [questionAnalytics, setQuestionAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testRes, analyticsRes] = await Promise.all([
          getTeacherTestById(id),
          getTeacherTestAnalytics(id),
        ]);
        setTest(testRes.test);
        setAnalytics(analyticsRes);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleQuestionSelect = async (questionId) => {
    if(!questionId) return;
    const res = await getTeacherQuestionAnalytics(id, questionId);
    setQuestionAnalytics(res.analytics || res.data);
  };

  if (loading) return <div className="min-h-screen bg-[#090b10] text-white p-12 uppercase font-black tracking-widest animate-pulse">Computing Data...</div>;

  return (
    <div className="min-h-screen bg-[#090b10] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b border-white/5 pb-8">
          <div>
            <p className="text-[#00c885] font-black uppercase text-[10px] tracking-[0.4em] mb-2">Performance Report</p>
            <h1 className="text-4xl font-black">{test?.title}</h1>
          </div>
        </header>

        {/* STATS GRID - Inspired by your image */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={<Users className="text-blue-400"/>} label="Total Attempts" value={analytics?.totalAttempts} />
          <StatCard icon={<Award className="text-[#00c885]"/>} label="Avg Score" value={`${analytics?.averageScore}%`} />
          <StatCard icon={<Zap className="text-orange-400"/>} label="Accuracy" value={`${analytics?.accuracy}%`} />
          <StatCard icon={<Target className="text-purple-400"/>} label="Completion" value={`${analytics?.completionRate}%`} />
        </div>

        {/* QUESTION-WISE DRILL DOWN */}
        <div className="bg-[#121620] border border-white/5 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart2 className="text-[#00c885]" size={20} /> Question Performance
          </h3>
          
          <div className="relative group">
            <select
              onChange={(e) => handleQuestionSelect(e.target.value)}
              className="w-full bg-[#090b10] border border-white/10 rounded-xl px-6 py-4 text-white font-bold appearance-none focus:border-[#00c885] outline-none transition-all cursor-pointer"
            >
              <option value="">Choose a question to analyze...</option>
              {test?.questions?.map((q, idx) => (
                <option key={q._id} value={q._id}>Q{idx + 1}: {q.questionText?.substring(0, 50)}...</option>
              ))}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
          </div>

          {questionAnalytics && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/30">
                  <span>Accuracy Rate</span>
                  <span className="text-[#00c885]">{questionAnalytics.correctPercentage?.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00c885]" style={{ width: `${questionAnalytics.correctPercentage}%` }}></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                   <MiniStat label="Correct" val={questionAnalytics.correctAttempts} color="text-[#00c885]"/>
                   <MiniStat label="Wrong" val={questionAnalytics.incorrectAttempts} color="text-red-400"/>
                   <MiniStat label="Skipped" val={questionAnalytics.skipped} color="text-white/20"/>
                </div>
              </div>
              <div className="bg-[#090b10] rounded-2xl p-6 flex items-center justify-between border border-white/5">
                <div>
                   <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Avg Time Spent</p>
                   <p className="text-3xl font-black mt-1">{questionAnalytics.avgTimeSpent || 0} <span className="text-sm font-normal text-white/40 tracking-normal">sec</span></p>
                </div>
                <Timer size={40} className="text-white/5" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-[#121620] border border-white/5 p-6 rounded-2xl flex items-center gap-5">
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black mt-0.5">{value || 0}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, val, color }) {
    return (
        <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-center">
            <p className={`text-lg font-black ${color}`}>{val || 0}</p>
            <p className="text-[8px] font-black uppercase text-white/20 tracking-tighter">{label}</p>
        </div>
    );
}