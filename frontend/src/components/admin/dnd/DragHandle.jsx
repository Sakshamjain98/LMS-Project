import { GripVertical } from "lucide-react";

export function DragHandle({ attributes, listeners, className = "" }) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className={`cursor-grab touch-none rounded p-1 text-white/30 hover:text-white/70 ${className}`}
      title="Drag to reorder"
    >
      <GripVertical size={14} />
    </button>
  );
}
