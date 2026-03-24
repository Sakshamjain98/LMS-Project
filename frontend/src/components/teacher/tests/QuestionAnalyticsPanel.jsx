// src/components/teacher/tests/QuestionAnalyticsPanel.jsx
export default function QuestionAnalyticsPanel({ analytics }) {
    if (!analytics) return null;
  
    return (
      <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Question Analytics
        </h3>
  
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-dark-100 rounded-xl p-4">
            <p className="text-xs text-grayCustom-medium">Attempts</p>
            <p className="text-white text-lg font-semibold">{analytics.totalAttempts}</p>
          </div>
          <div className="bg-dark-100 rounded-xl p-4">
            <p className="text-xs text-grayCustom-medium">Correct</p>
            <p className="text-white text-lg font-semibold">{analytics.correctAttempts}</p>
          </div>
          <div className="bg-dark-100 rounded-xl p-4">
            <p className="text-xs text-grayCustom-medium">Incorrect</p>
            <p className="text-white text-lg font-semibold">{analytics.incorrectAttempts}</p>
          </div>
          <div className="bg-dark-100 rounded-xl p-4">
            <p className="text-xs text-grayCustom-medium">Skipped</p>
            <p className="text-white text-lg font-semibold">{analytics.skipped}</p>
          </div>
          <div className="bg-dark-100 rounded-xl p-4">
            <p className="text-xs text-grayCustom-medium">Avg Time</p>
            <p className="text-white text-lg font-semibold">{analytics.avgTimeSpent}s</p>
          </div>
        </div>
      </div>
    );
  }