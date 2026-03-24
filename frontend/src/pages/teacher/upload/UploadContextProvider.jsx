import { createContext, useCallback, useEffect, useState } from "react";

export const UploadContext = createContext(null);

const defaultState = {
  courseId: null,
  courseStatus: {
    basicsCompleted: false,
    curriculumCompleted: false,
  },
  basics: {
    title: "",
    description: "",
    tags: [],
    thumbnail: null,
    thumbnailPreview: null,
  },
  curriculum: {
    modules: [
      {
        id: `module-${Date.now()}`,
        title: "",
        description: "",
        lessons: [
          {
            id: `lesson-${Date.now()}`,
            type: "video",
            title: "",
            videoUrl: "",
            resources: [],
          },
        ],
      },
    ],
  },
  pricing: {
    isPaid: false,
    price: 0,
    category: "",
    language: "en",
  },
};

export default function UploadContextProvider({ children }) {
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem("uploadFormData");
      if (!saved) return defaultState;

      const parsed = JSON.parse(saved);
      return {
        ...defaultState,
        ...parsed,
        courseStatus: { ...defaultState.courseStatus, ...(parsed.courseStatus || {}) },
        basics: { ...defaultState.basics, ...(parsed.basics || {}) },
        curriculum: { ...defaultState.curriculum, ...(parsed.curriculum || {}) },
        pricing: { ...defaultState.pricing, ...(parsed.pricing || {}) },
      };
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("uploadFormData", JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timer);
  }, [formData]);

  const updateBasics = useCallback((basics) => {
    setFormData((prev) => ({ ...prev, basics: { ...prev.basics, ...basics } }));
  }, []);

  const updateCurriculum = useCallback((curriculum) => {
    setFormData((prev) => ({ ...prev, curriculum }));
  }, []);

  const updatePricing = useCallback((pricing) => {
    setFormData((prev) => ({ ...prev, pricing: { ...prev.pricing, ...pricing } }));
  }, []);

  const setCourseId = useCallback((courseId) => {
    setFormData((prev) => ({ ...prev, courseId }));
  }, []);

  const markBasicsCompleted = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      courseStatus: { ...prev.courseStatus, basicsCompleted: true },
    }));
  }, []);

  const markCurriculumCompleted = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      courseStatus: { ...prev.courseStatus, curriculumCompleted: true },
    }));
  }, []);

  const clearFormData = useCallback(() => {
    localStorage.removeItem("uploadFormData");
    setFormData(defaultState);
  }, []);

  return (
    <UploadContext.Provider
      value={{
        formData,
        updateBasics,
        updateCurriculum,
        updatePricing,
        setCourseId,
        markBasicsCompleted,
        markCurriculumCompleted,
        clearFormData,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}
