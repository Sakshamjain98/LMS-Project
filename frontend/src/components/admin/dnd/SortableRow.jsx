import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Wraps a <tr> with drag-and-drop behavior. `children` is a render prop that
// receives { attributes, listeners } to pass to a DragHandle wherever the row
// layout wants it (usually inside the first cell, next to the title).
export function SortableRow({ id, className = "", children }) {
  const sortable = useSortable({ id });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <tr ref={setNodeRef} style={style} className={className}>
      {children({ attributes, listeners })}
    </tr>
  );
}
