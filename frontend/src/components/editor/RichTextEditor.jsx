import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export const richTextModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    [{ align: [] }],
    ["clean"],
  ],
};

export const richTextFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "link",
  "image",
  "align",
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing…",
  className = "",
}) {
  return (
    <div className={`quill-dark rounded-xl border border-white/10 bg-dark-300 overflow-hidden ${className}`.trim()}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={richTextModules}
        formats={richTextFormats}
        placeholder={placeholder}
      />
    </div>
  );
}
