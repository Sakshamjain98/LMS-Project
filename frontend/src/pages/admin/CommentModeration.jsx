import { useEffect, useState } from "react";
import { getPendingComments, approveComment, deleteComment, getAllComments } from "../../services/adminService";
import { CheckCircle, Trash2, RefreshCw, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function CommentModeration() {
  const [pendingComments, setPendingComments] = useState([]);
  const [allComments, setAllComments] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [activeTab]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      if (activeTab === "pending") {
        const res = await getPendingComments();
        setPendingComments(res.comments);
      } else {
        const res = await getAllComments({ approved: true });
        setAllComments(res.comments);
      }
    } catch (error) {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (commentId) => {
    try {
      await approveComment(commentId);
      toast.success("Comment approved");
      fetchComments();
    } catch (error) {
      toast.error("Failed to approve comment");
    }
  };

  const handleDelete = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteComment(commentId);
        toast.success("Comment deleted");
        fetchComments();
      } catch (error) {
        toast.error("Failed to delete comment");
      }
    }
  };

  const comments = activeTab === "pending" ? pendingComments : allComments;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Comment Moderation</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === "pending" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
        >
          Pending ({pendingComments.length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === "approved" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
        >
          Approved Comments
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No {activeTab} comments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{comment.user?.name || "Unknown User"}</span>
                    <span className="text-sm text-gray-500">{comment.user?.email}</span>
                    <span className="text-xs text-gray-400">on</span>
                    <span className="text-sm text-indigo-600">{comment.blog?.title || "Blog"}</span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(comment.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  {activeTab === "pending" && (
                    <button onClick={() => handleApprove(comment._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(comment._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}