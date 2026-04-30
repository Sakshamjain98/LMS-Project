import { useEffect, useState } from "react";
import { getAllPlans, createPlan, updatePlan, deletePlan } from "../../services/adminService";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationDays: 30,
    features: [],
  });
  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await getAllPlans();
      setPlans(res.plans);
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await updatePlan(editingPlan._id, formData);
        toast.success("Plan updated successfully");
      } else {
        await createPlan(formData);
        toast.success("Plan created successfully");
      }
      setShowModal(false);
      setEditingPlan(null);
      setFormData({ name: "", description: "", price: "", durationDays: 30, features: [] });
      fetchPlans();
    } catch {
      toast.error(editingPlan ? "Failed to update plan" : "Failed to create plan");
    }
  };

  const handleDelete = async (planId, planName) => {
    if (window.confirm(`Are you sure you want to delete ${planName} plan?`)) {
      try {
        await deletePlan(planId);
        toast.success("Plan deleted successfully");
        fetchPlans();
      } catch {
        toast.error("Failed to delete plan");
      }
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({ ...formData, features: [...formData.features, featureInput.trim()] });
      setFeatureInput("");
    }
  };

  const removeFeature = (index) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Subscription Plans</h1>
        <button
          onClick={() => {
            setEditingPlan(null);
            setFormData({ name: "", description: "", price: "", durationDays: 30, features: [] });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Plan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No subscription plans found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-3xl font-bold mt-2">₹{plan.price}<span className="text-sm font-normal text-gray-500">/{plan.durationDays} days</span></p>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-600">✓ {feature}</li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setFormData({
                        name: plan.name,
                        description: plan.description || "",
                        price: plan.price,
                        durationDays: plan.durationDays,
                        features: plan.features || [],
                      });
                      setShowModal(true);
                    }}
                    className="flex-1 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50"
                  >
                    <Edit2 size={16} className="inline mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id, plan.name)}
                    className="flex-1 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={16} className="inline mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">{editingPlan ? "Edit Plan" : "Create Plan"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    placeholder="Enter a feature"
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={addFeature} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.features.map((feature, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                      {feature}
                      <button type="button" onClick={() => removeFeature(idx)} className="text-red-500 hover:text-red-700">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  {editingPlan ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}