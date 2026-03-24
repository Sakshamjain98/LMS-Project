// src/components/teacher/tests/TestAnalyticsPanel.jsx
export default function TestAnalyticsPanel({ analytics }) {
    if (!analytics) return null;
  
    return (
      <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Test Analytics</h3>
        <pre className="text-xs text-grayCustom-medium whitespace-pre-wrap overflow-auto">
          {JSON.stringify(analytics, null, 2)}
        </pre>
      </div>
    );
  }