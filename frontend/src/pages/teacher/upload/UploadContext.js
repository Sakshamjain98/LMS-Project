import { createContext } from "react";

export const UploadContext = createContext(null);

export const defaultState = {
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
        lectures: [
          {
            id: `lecture-${Date.now()}`,
            type: "video",
            title: "",
            videoUrl: "",
            notes: null,
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
