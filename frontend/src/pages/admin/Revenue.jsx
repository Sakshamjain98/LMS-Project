import { useEffect, useState } from "react";
import { getRevenueAnalytics } from "../../services/adminService";
import { DollarSign, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

export default function Revenue() {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchData = async () => {
    try {
      const res = await getRevenueAnalytics(period);
      setData(res.data);
    } catch {
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.total, 0);
  const totalTransactions = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Revenue Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold">{totalTransactions.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Revenue Breakdown</h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : data.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No revenue data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 font-medium">{item._id}</td>
                    <td className="px-6 py-4 text-right">₹{item.total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">{item.count}</td>
                    <td className="px-6 py-4 text-right">₹{Math.round(item.total / item.count).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}