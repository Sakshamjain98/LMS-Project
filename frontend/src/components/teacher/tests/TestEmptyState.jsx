import { FileText } from "lucide-react";

export default function TestEmptyState({ title, subtitle }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex p-4 bg-dark-100 rounded-full mb-4">
        <FileText size={32} className="text-grayCustom-medium" />
      </div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="text-grayCustom-medium mt-1">{subtitle}</p>
    </div>
  );
}