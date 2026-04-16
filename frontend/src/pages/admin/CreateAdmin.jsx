import { useEffect, useMemo, useState } from "react";
import { createAdmin, deleteAdmin, getAdmins, updateAdmin } from "../../services/adminService";
import toast from "react-hot-toast";
import { Loader2, Pencil, Plus, Search, Trash2, UserCog, X } from "lucide-react";

export default function CreateAdmin() {
  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [query, setQuery] = useState({ search: "", page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdmins(query);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchAdmins = async (params) => {
    try {
      setLoading(true);
      const res = await getAdmins(params);
      setAdmins(res.admins || []);
      setPagination(res.pagination || { page: 1, limit: params.limit, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormData({ name: "", email: "", password: "" });
    setShowModal(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({ name: admin.name || "", email: admin.email || "", password: "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setFormData({ name: "", email: "", password: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    if (!editingAdmin && !formData.password) {
      toast.error("Password is required for new admin");
      return;
    }

    try {
      setSubmitting(true);
      if (editingAdmin) {
        const payload = {
          name: formData.name,
          email: formData.email,
          ...(formData.password ? { password: formData.password } : {}),
        };
        const res = await updateAdmin(editingAdmin._id, payload);
        toast.success(res.message || "Admin updated successfully");
      } else {
        const res = await createAdmin(formData);
        toast.success(res.message || "Admin created successfully");
      }

      closeModal();
      fetchAdmins(query);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save admin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm("Delete this admin permanently?")) {
      return;
    }

    try {
      const res = await deleteAdmin(adminId);
      toast.success(res.message || "Admin deleted");

      const shouldGoPrev = admins.length === 1 && pagination.page > 1;
      const nextPage = shouldGoPrev ? pagination.page - 1 : pagination.page;
      setQuery((prev) => ({ ...prev, page: nextPage }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete admin");
    }
  };

  const summaryText = useMemo(() => {
    if (!pagination.total) {
      return "No admins found";
    }

    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `Showing ${start}-${end} of ${pagination.total} admins`;
  }, [pagination]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Management</h1>
          <p className="text-grayCustom-medium mt-1 text-sm font-medium">Create, search, update, and remove platform admins.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 font-bold text-dark-400 transition-all hover:bg-brand-primaryDark shadow-lg shadow-brand-primary/15"
        >
          <Plus size={18} />
          Create Admin
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayCustom-medium" />
          <input
            value={query.search}
            onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, search: e.target.value }))}
            placeholder="Search admins by name or email"
            className="w-full rounded-xl border border-white/10 bg-dark-300/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-grayCustom-medium/70 focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-dark-300/70 text-grayCustom-medium uppercase tracking-wider text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-grayCustom-medium">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Loading admins...
                    </div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-grayCustom-medium">No admins found for this filter.</td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin._id} className="text-white/90 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-semibold">{admin.name}</td>
                    <td className="px-5 py-4">{admin.email}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-4 text-grayCustom-medium">{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(admin)}
                          className="rounded-lg border border-white/10 p-2 text-grayCustom-medium transition-colors hover:text-white"
                          aria-label="Edit admin"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(admin._id)}
                          className="rounded-lg border border-red-500/30 p-2 text-red-300 transition-colors hover:bg-red-500/10"
                          aria-label="Delete admin"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-3 text-sm text-grayCustom-medium md:flex-row md:items-center md:justify-between">
          <span>{summaryText}</span>
          <div className="flex items-center gap-2">
            <select
              value={query.limit}
              onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, limit: Number(e.target.value) }))}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={20}>20 / page</option>
            </select>
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-white/80 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-white/80">Page {pagination.page} / {pagination.totalPages || 1}</span>
            <button
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-white/80 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-dark-400/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-dark-200/95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2 text-white">
                <UserCog size={18} className="text-brand-primary" />
                <h2 className="text-lg font-bold">{editingAdmin ? "Edit Admin" : "Create Admin"}</h2>
              </div>
              <button onClick={closeModal} className="rounded-md p-1.5 text-grayCustom-medium transition-colors hover:text-white" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="space-y-1">
                <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">
                  {editingAdmin ? "New Password (Optional)" : "Password"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                  required={!editingAdmin}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={closeModal} className="rounded-xl px-4 py-2 font-semibold text-grayCustom-medium hover:text-white">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2 font-bold text-dark-400 transition-colors hover:bg-brand-primaryDark disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingAdmin ? "Save Changes" : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}