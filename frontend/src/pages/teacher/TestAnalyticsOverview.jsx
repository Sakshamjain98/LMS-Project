import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Calendar, FileText } from "lucide-react";
import { getTeacherTests } from "../../services/teacherService";

export default function TestAnalyticsOverview() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await getTeacherTests();
        setTests(res.tests || []);
      } catch {
        setTests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b10] flex items-center justify-center text-white/50 font-bold uppercase tracking-widest">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <header>
          <h1 className="text-4xl font-black tracking-tighter">ANALYTICS ENGINE</h1>
          <p className="text-white/40 font-bold uppercase text-xs tracking-[0.3em] mt-2">Global Assessment Performance</p>
        </header>

        {tests.length === 0 ? (
          <div className="bg-[#121620] border border-white/5 rounded-3xl p-20 text-center">
            <p className="text-white/20 font-bold uppercase tracking-widest">No Data Available</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tests.map((test) => (
              <Link
                key={test._id}
                to={`/teacher/tests/${test._id}/analytics`}
                className="group bg-[#121620] border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:border-[#00c885]/50 transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center text-[#00c885] group-hover:bg-[#00c885] group-hover:text-black transition-all">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold group-hover:text-[#00c885] transition-colors">{test.title}</h3>
                    <div className="flex gap-4 mt-1 text-xs font-bold uppercase tracking-wider text-white/30">
                      <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(test.createdAt).toLocaleDateString()}</span>
                      <span className="px-2 bg-white/5 rounded text-[#00c885]">{test.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">Inspect Data</span>
                  <ChevronRight size={20} className="text-white/10 group-hover:text-[#00c885] transition-all transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}