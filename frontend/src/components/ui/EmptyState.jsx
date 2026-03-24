import { FaBoxOpen } from "react-icons/fa";

export default function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-grayCustom-medium">
      <FaBoxOpen className="text-3xl mb-3" />
      <p>{text}</p>
    </div>
  );
}