import { useEffect, useMemo, useState } from "react";
import { createAdmin, deleteAdmin, getAdmins, updateAdmin, resetAdminPassword } from "../../services/adminService";
import toast from "react-hot-toast";
import { KeyRound, Loader2, Pencil, Plus, Search, Trash2, UserCog, X } from "lucide-react";

// Mirrors backend/src/constants/permissions.js — a static 16-key list, not
// worth an API round trip. Keep both lists in sync manually if this changes.
const PERMISSION_GROUPS = [
  { label: "User Management", perms: [
    { key: "users.view", label: "View Users" },
    { key: "users.edit", label: "Edit Users" },
    { key: "users.suspend", label: "Suspend Users" },
  ] },
  { label: "Course Management", perms: [
    { key: "courses.view", label: "View" },
    { key: "courses.create", label: "Create" },
    { key: "courses.edit", label: "Edit" },
    { key: "courses.publish", label: "Publish" },
    { key: "courses.delete", label: "Delete" },
  ] },
  { label: "Test Series", perms: [
    { key: "testseries.view", label: "View" },
    { key: "testseries.create", label: "Create" },
    { key: "testseries.edit", label: "Edit" },
  ] },
  { label: "Chapters", perms: [
    { key: "chapters.view", label: "View" },
    { key: "chapters.edit", label: "Edit" },
  ] },
  { label: "Analytics", perms: [
    { key: "analytics.view", label: "View" },
  ] },
  { label: "Settings", perms: [
    { key: "settings.view", label: "View" },
    { key: "settings.edit", label: "Edit" },
  ] },
];

const emptyForm = { name: "", email: "", password: "", permissions: [], isActive: true };

export default function CreateAdmin() {
  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [query, setQuery] = useState({ search: "", page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

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
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name || "",
      email: admin.email || "",
      password: "",
      permissions: admin.permissions || [],
      isActive: admin.isActive !== false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setFormData(emptyForm);
  };

  const togglePermission = (key) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
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
          permissions: formData.permissions,
          isActive: formData.isActive,
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword || resetPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    try {
      setResetting(true);
      const res = await resetAdminPassword(resetTarget._id, resetPassword);
      toast.success(res.message || "Password reset successfully");
      setResetTarget(null);
      setResetPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setResetting(false);
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
                <th className="px-5 py-3 text-left">Permissions</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-grayCustom-medium">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Loading admins...
                    </div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-grayCustom-medium">No admins found for this filter.</td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin._id} className="text-white/90 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-semibold">{admin.name}</td>
                    <td className="px-5 py-4">{admin.email}</td>
                    <td className="px-5 py-4 text-xs text-grayCustom-medium">
                      {(admin.permissions || []).length ? `${admin.permissions.length} granted` : "None"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        admin.isActive === false ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300"
                      }`}>
                        {admin.isActive === false ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-grayCustom-medium">{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setResetTarget(admin)}
                          className="rounded-lg border border-white/10 p-2 text-grayCustom-medium transition-colors hover:text-white"
                          aria-label="Reset password"
                          title="Reset password"
                        >
                          <KeyRound size={15} />
                        </button>
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-dark-400/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-dark-200/95 shadow-2xl my-8">
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
              <div className="grid gap-4 sm:grid-cols-2">
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

              {editingAdmin && (
                <label className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-white/20 bg-dark-300 accent-brand-primary"
                  />
                  Account active (uncheck to disable login)
                </label>
              )}

              <div className="space-y-3">
                <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-grayCustom-medium">Permissions</label>
                <p className="ml-1 text-[11px] text-grayCustom-medium/80">
                  Payments and account deletion are Super Admin-only and can't be granted here.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="mb-2 text-xs font-bold text-white/70">{group.label}</p>
                      <div className="space-y-1.5">
                        {group.perms.map((perm) => (
                          <label key={perm.key} className="flex items-center gap-2 text-sm text-white/80">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm.key)}
                              onChange={() => togglePermission(perm.key)}
                              className="h-4 w-4 rounded border-white/20 bg-dark-300 accent-brand-primary"
                            />
                            {perm.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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

      {resetTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-dark-400/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-dark-200/95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2 text-white">
                <KeyRound size={18} className="text-brand-primary" />
                <h2 className="text-lg font-bold">Reset Password</h2>
              </div>
              <button onClick={() => { setResetTarget(null); setResetPassword(""); }} className="rounded-md p-1.5 text-grayCustom-medium transition-colors hover:text-white" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4 p-5">
              <p className="text-sm text-white/70">Set a new password for <span className="font-semibold text-white">{resetTarget.email}</span>. They'll be signed out of any existing session.</p>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="New password (min. 6 characters)"
                className="w-full rounded-xl border border-white/10 bg-dark-300 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setResetTarget(null); setResetPassword(""); }} className="rounded-xl px-4 py-2 font-semibold text-grayCustom-medium hover:text-white">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2 font-bold text-dark-400 transition-colors hover:bg-brand-primaryDark disabled:opacity-60"
                >
                  {resetting && <Loader2 size={16} className="animate-spin" />}
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
