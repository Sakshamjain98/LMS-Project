export const DEFAULT_TEACHER_UI_SETTINGS = {
  teacherVisibility: {
    notesEnabled: false,
    uploadEnabled: false,
    testsEnabled: true,
  },
  teacherDashboardStats: {
    totalCourses: false,
    pendingApproval: false,
    publishedCourses: false,
    totalNotes: false,
    totalTests: true,
    draftTests: true,
    publishedTests: true,
    quickActions: true,
  },
};

export const mergeTeacherUiSettings = (settings = {}) => ({
  teacherVisibility: {
    ...DEFAULT_TEACHER_UI_SETTINGS.teacherVisibility,
    ...(settings.teacherVisibility || {}),
  },
  teacherDashboardStats: {
    ...DEFAULT_TEACHER_UI_SETTINGS.teacherDashboardStats,
    ...(settings.teacherDashboardStats || {}),
  },
});
