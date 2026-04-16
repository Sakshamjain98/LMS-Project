import { useState } from "react";
import { uploadTestCSV } from "../../services/teacherService";
import toast from "react-hot-toast";
import { Upload, Loader2, ChevronLeft, FileSpreadsheet, Info, CheckCircle2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UploadTestCSV() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: 60,
    passingMarks: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a CSV file");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", form.title.trim() || "CSV Imported Test");
    formData.append("description", form.description.trim());
    formData.append("duration", String(form.duration || 60));
    formData.append("passingMarks", String(form.passingMarks || 0));

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
    <div className="bg-dark-300 text-white">
      <div className="mx-auto max-w-4xl px-4 pb-6 space-y-5 pt-6">
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
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Upload Test CSV
          </h1>
          <p className="text-grayCustom-medium text-sm font-medium">
            Bulk create assessments using a formatted CSV file.
          </p>
        </div>

        {/* Main Form Container */}
        <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-[0.2em] ml-1 mb-2 block">
                Test Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Physics Unit Test"
                className="w-full px-4 py-3 rounded-xl bg-dark-300 border border-dark-100 text-white focus:border-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-[0.2em] ml-1 mb-2 block">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={form.duration}
                onChange={(e) => setForm((prev) => ({ ...prev, duration: Number(e.target.value) || 60 }))}
                className="w-full px-4 py-3 rounded-xl bg-dark-300 border border-dark-100 text-white focus:border-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-[0.2em] ml-1 mb-2 block">
                Passing Marks
              </label>
              <input
                type="number"
                min="0"
                value={form.passingMarks}
                onChange={(e) => setForm((prev) => ({ ...prev, passingMarks: Number(e.target.value) || 0 }))}
                className="w-full px-4 py-3 rounded-xl bg-dark-300 border border-dark-100 text-white focus:border-brand-primary outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-[0.2em] ml-1 mb-2 block">
                Description (optional)
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-dark-300 border border-dark-100 text-white focus:border-brand-primary outline-none resize-none"
                placeholder="A short summary for this test"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-[0.2em] ml-1">
              Select Assessment File
            </label>
            
            <div className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 ${
              file ? 'border-brand-primary/40 bg-brand-primary/5' : 'border-dark-100 hover:border-brand-primary/20 bg-dark-400'
            }`}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              <div className={`p-4 rounded-2xl ${file ? 'bg-brand-primary text-dark-300' : 'bg-dark-300 text-grayCustom-medium'} transition-colors shadow-xl`}>
                <FileSpreadsheet size={32} />
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
                question, optionA, optionB, optionC, optionD, answer, marks, explanation, tags, difficulty, negativeMarks
              </p>
              <a
                href="/sample-test-upload.csv"
                download
                className="inline-flex items-center gap-2 mt-2 text-xs font-bold text-blue-200 hover:text-white"
              >
                <Download size={14} />
                Download Sample CSV
              </a>
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

      </div>
    </div>
  );
}