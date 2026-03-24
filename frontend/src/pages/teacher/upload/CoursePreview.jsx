import { Info, FileText, Layers, Lock, Unlock } from "lucide-react";

export default function CoursePreview({ formData }) {
  // ✅ FIX: Add safe fallbacks for all undefined properties
  const basics = formData?.basics || {};
  const curriculum = formData?.curriculum || {};
  const pricing = formData?.pricing || {};
  
  // ✅ FIX: Safely handle modules array
  const modules = Array.isArray(curriculum.modules) ? curriculum.modules : [];
  const totalVideos = modules.reduce((sum, m) => sum + ((m?.videos?.length) || 0), 0);
  const totalNotes = modules.reduce((sum, m) => sum + ((m?.notes?.length) || 0), 0);
  const tags = Array.isArray(basics.tags) ? basics.tags : [];
  const thumbnailPreview = basics.thumbnailPreview || null;
  const title = basics.title || "Untitled Course";
  const description = basics.description || "No description provided yet.";
  const isPaid = pricing.isPaid || false;

  return (
    <div className="sticky top-6 space-y-4">
      <div className="bg-dark-200 border border-white/5 rounded-2xl overflow-hidden">
        {/* Thumbnail Preview */}
        <div className="h-44 bg-dark-300 flex items-center justify-center border-b border-white/5 overflow-hidden">
          {thumbnailPreview ? (
            <img 
              src={thumbnailPreview} 
              alt="Thumbnail" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <Info className="text-white/5" size={48} />
          )}
        </div>

        {/* Course Info */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-white truncate" title={title}>
            {title}
          </h3>
          <p className="text-xs text-white/50 mt-1 line-clamp-2">
            {description}
          </p>

          {/* Tags Preview */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.slice(0, 4).map((tag, i) => (
                <span 
                  key={i} 
                  className="text-[10px] bg-dark-300 text-white/60 px-2 py-1 rounded-full truncate"
                >
                  {String(tag).trim()}
                </span>
              ))}
              {tags.length > 4 && (
                <span className="text-[10px] text-white/40">+{tags.length - 4}</span>
              )}
            </div>
          )}

          {/* Free/Paid Badge - No Amount */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              {isPaid ? (
                <>
                  <Lock size={14} className="text-red-400" />
                  <span className="text-sm font-medium text-red-400">Paid Course</span>
                </>
              ) : (
                <>
                  <Unlock size={14} className="text-green-400" />
                  <span className="text-sm font-medium text-green-400">Free Access</span>
                </>
              )}
            </div>
          </div>

          {/* Curriculum Preview */}
          <div className="mt-6 space-y-3">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} /> Curriculum ({modules.length} modules)
            </p>
            {modules.length > 0 ? (
              modules.slice(0, 3).map((m, i) => (
                <div key={i} className="text-xs p-3 bg-dark-100 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white/80 truncate">
                      {m?.title || `Module ${i + 1}`}
                    </span>
                    <span className="text-white/40 text-[10px] flex-shrink-0 ml-2">
                      {(m?.videos?.length || 0)}v • {(m?.notes?.length || 0)}n
                    </span>
                  </div>
                  {m?.description && (
                    <p className="text-white/50 text-[10px] mt-1 line-clamp-1">
                      {m.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-white/30 italic">Add modules to see preview</p>
            )}
            {modules.length > 3 && (
              <p className="text-xs text-white/30">+{modules.length - 3} more sections</p>
            )}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-xs text-white/50">
            <div className="flex justify-between">
              <span>Total Videos:</span>
              <span className="text-white font-medium">{totalVideos}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Notes:</span>
              <span className="text-white font-medium">{totalNotes}</span>
            </div>
            <div className="flex justify-between">
              <span>Sections:</span>
              <span className="text-white font-medium">{modules.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-white/30 text-center uppercase tracking-widest">
        Live Preview • Ready to Continue
      </p>
    </div>
  );
}
