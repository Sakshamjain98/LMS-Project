import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Loader2, Lock, Unlock } from "lucide-react";
import { UploadContext } from "./UploadContextProvider";
import CoursePreview from "./CoursePreview";

// ---------- Reusable Components ----------
const InputField = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-white">{label}</label>
    {children}
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

const TagInput = ({ tags, onAdd, onRemove, max = 10 }) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = inputValue.trim();
      if (tag && !tags.includes(tag) && tags.length < max) {
        onAdd(tag);
        setInputValue("");
      }
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onRemove(tags.length - 1);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="bg-dark-100 text-grayCustom-medium px-2.5 py-1 rounded-full text-sm flex items-center gap-1.5"
          >
            {tag}
            <button
              onClick={() => onRemove(idx)}
              className="hover:text-white transition"
              type="button"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a tag"
        className="w-full h-10 px-3 bg-transparent border border-dark-100 rounded-md text-white text-sm placeholder-grayCustom-medium/60 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none transition-all"
      />
      <p className="text-xs text-grayCustom-medium">
        {tags.length}/{max} tags
      </p>
    </div>
  );
};

const ToggleGroup = ({ options, value, onChange }) => (
  <div className="flex gap-3">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          value === opt.value
            ? opt.value
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-green-500/20 text-green-400 border border-green-500/30"
            : "bg-dark-100 text-grayCustom-medium hover:text-white border border-dark-100"
        }`}
      >
        {opt.value ? <Lock size={16} /> : <Unlock size={16} />}
        {opt.label}
      </button>
    ))}
  </div>
);

const UploadBox = ({ preview, onFileChange, onRemove, error }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileChange(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileChange(file);
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-md transition-all ${
        dragActive
          ? "border-brand-primary bg-brand-primary/5"
          : error
          ? "border-red-500/50"
          : "border-dark-100 hover:border-brand-primary/40"
      }`}
    >
      {preview ? (
        <div className="p-3 flex flex-col items-center gap-2">
          <img src={preview} alt="Thumbnail" className="max-h-24 rounded object-cover" />
          <div className="flex gap-3">
            <label className="text-xs text-brand-primary hover:text-brand-dark cursor-pointer">
              Replace
              <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
            </label>
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-grayCustom-medium hover:text-white"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center gap-2">
          <Upload className="w-5 h-5 text-grayCustom-medium" />
          <div className="text-center">
            <p className="text-white text-sm font-medium">
              {dragActive ? "Drop here" : "Click or drag & drop"}
            </p>
            <p className="text-xs text-grayCustom-medium">PNG, JPG, WebP • Max 5MB</p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

// ---------- Main Component ----------
export default function CourseBasics() {
  const navigate = useNavigate();
  const { formData, updateBasics, updatePricing, markBasicsCompleted } = useContext(UploadContext);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const charCount = formData.basics.description?.length || 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateBasics({ [name]: value });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.basics.title.trim()) {
      newErrors.title = "Title is required";
    }
    
    // ✅ FIXED: Only validate price if course is paid
    if (formData.pricing.isPaid && (!formData.pricing.price || formData.pricing.price <= 0)) {
      newErrors.price = "Price must be greater than 0 for paid courses";
    }
    
    return newErrors;
  };

  const handleThumbnailChange = (file) => {
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, thumbnail: "Please upload an image file" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, thumbnail: "File size must be less than 5MB" }));
      return;
    }
    const preview = URL.createObjectURL(file);
    updateBasics({ thumbnail: file, thumbnailPreview: preview });
    setErrors((prev) => ({ ...prev, thumbnail: "" }));
  };

  const handleRemoveThumbnail = () => {
    updateBasics({ thumbnail: null, thumbnailPreview: null });
  };

  const handleAddTag = (tag) => {
    if (formData.basics.tags.length >= 10) {
      setErrors((prev) => ({ ...prev, tags: "Maximum 10 tags" }));
      return;
    }
    updateBasics({ tags: [...formData.basics.tags, tag] });
    setErrors((prev) => ({ ...prev, tags: "" }));
  };

  const handleRemoveTag = (index) => {
    updateBasics({
      tags: formData.basics.tags.filter((_, i) => i !== index),
    });
  };

  const handleIsPaidChange = (isPaid) => {
    // ✅ FIXED: Set price to 0 for free, only require > 0 for paid
    updatePricing({ isPaid, price: isPaid ? 1 : 0 });
  };

  const handleSaveAndContinue = async () => {
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    markBasicsCompleted();
    navigate("/teacher/upload/curriculum");
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-dark-300">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <span className="text-brand-primary font-medium">Step 1</span>
          <span className="text-grayCustom-medium/70">of 3</span>
          <div className="flex-1 h-px bg-dark-100 mx-4" />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Course Basics</h1>
          <p className="text-sm text-grayCustom-medium/70 mt-1">
            Provide essential information about your course
          </p>
        </div>

        {/* 2‑column layout: main form + preview */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Title */}
            <InputField label="Course title" error={errors.title}>
              <input
                type="text"
                name="title"
                value={formData.basics.title}
                onChange={handleChange}
                onBlur={validateForm}
                placeholder="e.g. Master React with Hooks"
                maxLength="100"
                className="w-full h-10 px-3 bg-dark-200/50 border border-dark-100 rounded-md text-white text-sm placeholder-grayCustom-medium/60 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none transition-all"
              />
              <div className="flex justify-end">
                <span className="text-xs text-grayCustom-medium">
                  {formData.basics.title.length}/100
                </span>
              </div>
            </InputField>

            {/* Description */}
            <InputField label="Description">
              <textarea
                name="description"
                value={formData.basics.description}
                onChange={handleChange}
                placeholder="What will students learn?"
                maxLength="500"
                rows={3}
                className="w-full px-3 py-2 bg-dark-200/50 border border-dark-100 rounded-md text-white text-sm placeholder-grayCustom-medium/60 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none resize-none transition-all"
              />
              <div className="flex justify-end">
                <span className="text-xs text-grayCustom-medium">
                  {charCount}/500
                </span>
              </div>
            </InputField>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Tags</label>
              <TagInput
                tags={formData.basics.tags}
                onAdd={handleAddTag}
                onRemove={handleRemoveTag}
                max={10}
              />
              {errors.tags && <p className="text-xs text-red-400 mt-1">{errors.tags}</p>}
            </div>

            {/* Course Type */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">Course Type</label>
              <ToggleGroup
                options={[
                  { value: false, label: "Free" },
                  { value: true, label: "Paid" },
                ]}
                value={formData.pricing.isPaid}
                onChange={handleIsPaidChange}
              />
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Thumbnail</label>
              <UploadBox
                preview={formData.basics.thumbnailPreview}
                onFileChange={handleThumbnailChange}
                onRemove={handleRemoveThumbnail}
                error={errors.thumbnail}
              />
              {errors.thumbnail && <p className="text-xs text-red-400 mt-1">{errors.thumbnail}</p>}
            </div>

            {/* Save & Continue */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={saving}
                className="w-full h-11 bg-brand-primary text-black font-medium rounded-md hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Continue"
                )}
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="hidden lg:block">
            <div className="sticky top-12">
              <p className="text-sm font-medium text-white mb-3">Preview</p>
              <div className="bg-dark-200/50 rounded-lg border border-dark-100 overflow-hidden">
                <CoursePreview 
                  formData={{
                    basics: {
                      title: formData.basics.title,
                      description: formData.basics.description,
                      tags: formData.basics.tags,
                      thumbnailPreview: formData.basics.thumbnailPreview,
                    },
                    curriculum: {
                      modules: [],
                    },
                    pricing: {
                      isPaid: formData.pricing.isPaid,
                      price: formData.pricing.price,
                    },
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}