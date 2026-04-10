import { useState } from "react";
import { uploadTestCSV } from "../../services/teacherService";
import toast from "react-hot-toast";
import { Upload, Loader2, ChevronLeft, FileSpreadsheet, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UploadTestCSV() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a CSV file");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await uploadTestCSV(formData);
      toast.success(res.message || "Test created successfully!");
      setFile(null);
      setTimeout(() => navigate("/teacher/tests"), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-300 text-white">
      <div className="max-w-2xl mx-auto px-4 pb-12 space-y-8 pt-8">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/teacher/tests")}
            className="flex items-center gap-2 text-grayCustom-medium hover:text-white transition-colors font-medium text-sm group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Tests
          </button>
        </div>

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Upload Test CSV
          </h1>
          <p className="text-grayCustom-medium text-sm font-medium">
            Bulk create assessments using a formatted CSV file.
          </p>
        </div>

        {/* Main Form Container */}
        <div className="bg-dark-200 border border-dark-100 rounded-2xl p-8 shadow-2xl space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-[0.2em] ml-1">
              Select Assessment File
            </label>
            
            <div className={`relative border-2 border-dashed rounded-2xl p-12 transition-all flex flex-col items-center justify-center gap-4 ${
              file ? 'border-brand-primary/40 bg-brand-primary/5' : 'border-dark-100 hover:border-brand-primary/20 bg-dark-400'
            }`}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              <div className={`p-4 rounded-2xl ${file ? 'bg-brand-primary text-dark-300' : 'bg-dark-300 text-grayCustom-medium'} transition-colors shadow-xl`}>
                <FileSpreadsheet size={40} />
              </div>
              
              <div className="text-center">
                <p className="text-base font-bold text-white tracking-tight">
                  {file ? file.name : "Click to select or drag CSV"}
                </p>
                <p className="text-grayCustom-medium text-[11px] font-bold uppercase tracking-wider mt-1">
                  Maximum size: 10MB
                </p>
              </div>

              {file && (
                <div className="flex items-center gap-2 text-brand-primary text-[10px] font-black bg-brand-primary/10 px-4 py-1.5 rounded-full border border-brand-primary/20 animate-in fade-in zoom-in">
                  <CheckCircle2 size={12} />
                  FILE READY
                </div>
              )}
            </div>
          </div>

          {/* Template Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 flex gap-4">
            <div className="p-2 bg-blue-500/20 rounded-lg h-fit">
              <Info size={18} className="text-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="text-blue-300 text-xs font-bold uppercase tracking-widest">
                CSV Data Structure
              </p>
              <p className="text-blue-300/80 text-[11px] font-medium leading-relaxed font-mono">
                question, optionA, optionB, optionC, optionD, answer, marks
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-dark-100 gap-4">
             <button
              onClick={() => navigate("/teacher/tests")}
              className="px-6 py-3 bg-dark-100 text-white rounded-xl font-bold hover:bg-dark-400 transition-all text-sm"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className="flex-1 bg-brand-primary hover:bg-brand-primaryDark text-dark-400 font-extrabold py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 disabled:opacity-20 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <Upload size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                  Upload & Create
                </>
              )}
            </button>
          </div>
        </div>

        {/* Critical Note Section */}
        <div className="bg-dark-200 border border-dark-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2 bg-dark-100 rounded-lg">
            <AlertCircle size={18} className="text-brand-primary" />
          </div>
          <p className="text-grayCustom-medium text-[11px] font-semibold leading-relaxed">
            Please ensure your CSV is encoded in <span className="text-white">UTF-8</span>. Using symbols like emojis or special math characters may fail if the encoding is incorrect.
          </p>
        </div>
      </div>
    </div>
  );
}