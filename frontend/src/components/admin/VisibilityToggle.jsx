import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

// Eye / eye-off toggle for the actions column of admin tables. `isVisible`
// defaults to true when undefined so pre-existing rows (before this field
// existed) render as visible. `onToggle(nextValue)` persists the change.
export function VisibilityToggle({ isVisible, onToggle, className = "" }) {
  const [loading, setLoading] = useState(false);
  const visible = isVisible !== false;

  const handleClick = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await onToggle(!visible);
    } catch (err) {
      toast.error(err?.message || "Failed to update visibility");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-lg glass-pill p-2 hover:text-white disabled:opacity-50 ${visible ? "text-white/70" : "text-amber-400"} ${className}`}
      title={visible ? "Visible to students — click to hide" : "Hidden from students — click to make visible"}
    >
      {visible ? <Eye size={14} /> : <EyeOff size={14} />}
    </button>
  );
}
