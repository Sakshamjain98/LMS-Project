import { useEffect, useState } from "react";
import { getAllUsers, updateUserRole, deleteUser } from "../../services/adminService";
import { Search, Edit2, Trash2, Filter, User, ChevronLeft, ChevronRight, UsersRound } from "lucide-react";
import toast from "react-hot-toast";

const roleOptions = ["student", "teacher", "admin"];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: "", search: "" });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [filters.role, limit]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.role, debouncedSearch, page, limit]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers({
        role: filters.role,
        search: debouncedSearch,
        page,
        limit,
      });
      setUsers(res.users || []);
      setPagination(res.pagination || pagination);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success("Role updated successfully");
      fetchUsers();
      setEditingRole(null);
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      try {
        await deleteUser(userId);
        toast.success("User deleted successfully");
        fetchUsers();
      } catch {
        toast.error("Failed to delete user");
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <UsersRound size={28} className="text-brand-primary" />
            User Management
          </h1>
          <p className="text-grayCustom-medium mt-1 text-sm font-medium">Paginated and optimized controls for very large user bases.</p>
        </div>
        <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-sm text-gray-300">
          Total Users: <span className="text-white font-bold">{pagination.total || 0}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
        <div className="relative min-w-70 flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-grayCustom-medium w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full bg-dark-300 border border-dark-100 text-white pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-grayCustom-medium/50"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Filter className="text-brand-primary w-4 h-4" />
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="bg-dark-300 border border-dark-100 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer text-sm font-medium"
          >
            <option value="">All Roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role} className="bg-dark-300">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Users Table Container */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-300/50 border-b border-dark-100">
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">User Details</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">Account Role</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-grayCustom-medium uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                      <span className="text-grayCustom-medium text-sm">Fetching user records...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-grayCustom-medium">
                    No users match your current filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-dark-100/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-dark-300 flex items-center justify-center text-brand-primary border border-dark-100">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-xs text-grayCustom-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {editingRole === user._id ? (
                        <select
                          defaultValue={user.role}
                          onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                          className="bg-dark-400 border border-brand-primary text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none"
                          autoFocus
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-tighter rounded-full ${
                          user.role === "admin" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                          user.role === "teacher" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.isApproved ? "bg-brand-primary shadow-[0_0_8px_#00BA7C]" : "bg-yellow-500 shadow-[0_0_8px_#EAB308]"}`}></div>
                        <span className="text-xs font-medium text-gray-300">
                          {user.isApproved ? "Verified" : "Pending"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingRole(user._id)}
                          className="p-2 text-grayCustom-medium hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                          title="Edit Role"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          className="p-2 text-grayCustom-medium hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/10 px-4 py-3 flex flex-col gap-3 bg-dark-300/30 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-400">
            Showing <span className="text-white font-semibold">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total || 0)}</span>
            -<span className="text-white font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total || 0)}</span> of <span className="text-white font-semibold">{pagination.total}</span>
          </p>

          <div className="flex items-center justify-end gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={20}>20 / page</option>
            </select>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPrevPage}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs text-white/80">{pagination.page}/{pagination.totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!pagination.hasNextPage}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}