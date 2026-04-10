import { useEffect, useState } from "react";
import { getPendingTeachers, approveTeacher } from "../../services/adminService";
import { CheckCircle, UserCheck, Calendar, Mail, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function TeacherApproval() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await getPendingTeachers();
      setTeachers(res.teachers || []);
    } catch (error) {
      toast.error("Failed to load pending teachers");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (teacherId) => {
    setProcessingId(teacherId);
    try {
      await approveTeacher(teacherId);
      toast.success("Teacher account verified");
      fetchTeachers();
    } catch (error) {
      toast.error("Failed to approve teacher");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
        <span className="text-grayCustom-medium font-medium">Verifying credentials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="text-brand-primary w-5 h-5" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Onboarding Requests</h1>
          </div>
          <p className="text-grayCustom-medium text-sm font-medium">Review and verify professional teacher credentials.</p>
        </div>
        <div className="bg-dark-200 border border-dark-100 px-4 py-2 rounded-xl">
          <span className="text-brand-primary font-bold text-xl">{teachers.length}</span>
          <span className="text-grayCustom-medium text-xs font-bold uppercase tracking-widest ml-2">Pending</span>
        </div>
      </div>

      {/* Teacher List */}
      {teachers.length === 0 ? (
        <div className="bg-dark-200 border border-dark-100 border-dashed rounded-2xl p-20 text-center">
          <div className="w-16 h-16 bg-dark-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-100">
            <UserCheck className="text-grayCustom-medium w-8 h-8" />
          </div>
          <p className="text-grayCustom-medium font-medium">Your verification queue is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {teachers.map((teacher) => (
            <div 
              key={teacher._id} 
              className="bg-dark-200 border border-dark-100 rounded-2xl p-6 hover:border-brand-primary/30 transition-all duration-300 group"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="flex gap-4">
                  {/* Avatar Placeholder */}
                  <div className="w-14 h-14 rounded-2xl bg-dark-300 border border-dark-100 flex items-center justify-center text-brand-primary text-xl font-bold group-hover:bg-brand-primary/10 transition-colors">
                    {teacher.name?.charAt(0)}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white leading-none">{teacher.name}</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-grayCustom-medium font-medium">
                        <Mail size={12} className="text-brand-primary" />
                        {teacher.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-grayCustom-medium font-medium">
                        <Calendar size={12} className="text-brand-primary" />
                        Applied: {new Date(teacher.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApprove(teacher._id)}
                  disabled={processingId === teacher._id}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-dark-400 font-bold rounded-xl hover:bg-brand-primaryDark transition-all shadow-lg shadow-brand-primary/5 disabled:opacity-50"
                >
                  {processingId === teacher._id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  Verify Teacher
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}