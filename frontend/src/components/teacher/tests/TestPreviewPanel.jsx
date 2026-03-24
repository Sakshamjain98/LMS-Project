// src/components/teacher/tests/TestPreviewPanel.jsx
export default function TestPreviewPanel({ preview }) {
    if (!preview) return null;
  
    const test = preview.test;
    const questions = preview.questions || [];
  
    return (
      <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Test Preview</h3>
  
        <div className="bg-dark-100 rounded-xl p-4">
          <h4 className="text-white font-semibold">{test?.title}</h4>
          <p className="text-sm text-grayCustom-medium mt-1">{test?.description}</p>
          <div className="text-xs text-grayCustom-medium mt-3">
            Duration: {test?.duration} mins • Total Questions: {questions.length}
          </div>
        </div>
  
        <div className="space-y-3">
          {questions.map((q, index) => (
            <div key={q._id} className="bg-dark-100 rounded-xl p-4">
              <p className="text-white font-medium">
                Q{index + 1}. {q.questionText}
              </p>
  
              <div className="mt-3 space-y-2">
                {q.options?.map((opt, idx) => (
                  <div key={idx} className="text-sm text-grayCustom-medium">
                    {String.fromCharCode(65 + idx)}. {opt.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }