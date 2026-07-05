import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

// Shared drag-and-drop reorder logic for admin tables — same sensor config
// and index-mapping the Course Chapters table established. `onReorder`
// receives the full reordered array; the caller applies optimistic state and
// persists it (see CourseManager's handleChapterDragEnd for the pattern).
export function useDragReorder({ items, getId = (item) => item._id, onReorder }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => getId(item) === active.id);
    const newIndex = items.findIndex((item) => getId(item) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return { sensors, handleDragEnd };
}
