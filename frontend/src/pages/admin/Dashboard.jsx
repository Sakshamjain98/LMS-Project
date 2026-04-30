import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  getAdminDashboard, 
  getRevenueAnalytics, 
  getUserAnalytics, 
  getPendingTeachers, 
  getPendingContent, 
  getPendingComments, 
  getAllPayments, 
  getAllUsers 
} from "../../services/adminService";
import { 
  Users, UserCheck, BookOpen, DollarSign, 
  Clock, Shield, MessageSquare, Newspaper, TrendingUp,
  RefreshCw, Calendar, CheckCircle, XCircle, AlertCircle,
  UserPlus, CreditCard, GraduationCap, FileText, BarChart3
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import toast from "react-hot-toast";

// ================== LOADING SKELETON ==================
const StatCardSkeleton = () => (
  <div className="bg-dark-200 border border-dark-100 rounded-xl p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-dark-100 rounded"></div>
        <div className="h-8 w-20 bg-dark-100 rounded"></div>
      </div>
      <div className="h-12 w-12 bg-dark-100 rounded-lg"></div>
    </div>
  </div>
);

// ================== STAT CARD ==================
const StatCard = ({ title, value, color, link, trend }) => (
  <Link to={link || "#"} className={`block ${link ? 'cursor-pointer' : 'cursor-default'}`}>
    <div className="bg-dark-200 border border-dark-100 rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-dark-100 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-grayCustom-medium text-sm font-medium uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold mt-2 text-white italic">
            {typeof value === 'number' ? value?.toLocaleString() || 0 : value || 0}
          </p>
          {trend !== undefined && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`p-4 rounded-lg bg-dark-300 group-hover:bg-brand-primary/10 transition-colors`}>
          <BarChart3 className={`w-7 h-7 ${color}`} />
        </div>
      </div>
    </div>
  </Link>
);

// ================== PENDING ITEM ==================
const PendingItem = ({ label, count, link }) => (
  <Link to={link || "#"} className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-300 transition-colors cursor-pointer group">
    <div className="flex items-center gap-3">
        <div className="p-2 bg-dark-400 rounded group-hover:text-brand-primary">
          <Clock className="w-5 h-5" />
        </div>
      <span className="text-gray-300">{label}</span>
    </div>
    <span className="bg-brand-primary/20 text-brand-primary px-2 py-1 rounded text-xs font-bold">
      {count || 0}
    </span>
  </Link>
);

// ================== RECENT USER ITEM ==================
const RecentUserItem = ({ user }) => (
  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-300 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-dark-400 flex items-center justify-center text-brand-primary font-bold">
        {user.name?.charAt(0) || 'U'}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{user.name}</p>
        <p className="text-xs text-grayCustom-medium">{user.email}</p>
      </div>
    </div>
    <span className={`text-xs px-2 py-1 rounded-full ${
      user.role === 'student' ? 'bg-blue-400/20 text-blue-400' : 
      user.role === 'teacher' ? 'bg-green-400/20 text-green-400' : 
      'bg-purple-400/20 text-purple-400'
    }`}>
      {user.role}
    </span>
  </div>
);

// ================== RECENT PAYMENT ITEM ==================
const RecentPaymentItem = ({ payment }) => (
  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-300 transition-colors">
    <div className="flex items-center gap-3">
      <CreditCard className="w-5 h-5 text-brand-primary" />
      <div>
        <p className="text-sm font-medium text-white">₹{payment.amount?.toLocaleString() || 0}</p>
        <p className="text-xs text-grayCustom-medium">
          {payment.plan || 'N/A'} • {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'Unknown'}
        </p>
      </div>
    </div>
    <span className={`text-xs px-2 py-1 rounded-full ${
      payment.status === 'SUCCESS' || payment.status === 'COMPLETED' ? 'bg-green-400/20 text-green-400' : 
      payment.status === 'PENDING' ? 'bg-yellow-400/20 text-yellow-400' : 
      'bg-red-400/20 text-red-400'
    }`}>
      {payment.status || 'UNKNOWN'}
    </span>
  </div>
);

// ================== MAIN DASHBOARD ==================
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [_revenueData, setRevenueData] = useState([]);
  const [_userGrowthData, setUserGrowthData] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [pendingContent, setPendingContent] = useState([]);
  const [pendingComments, setPendingComments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [courseStats, setCourseStats] = useState({ totalCourses: 0, activeCourses: 0, totalEnrollments: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("monthly");

  // Helper to safely transform revenue data
  const transformRevenueData = (data) => {
    if (!data) return [];
    // If it's already an array of { month, amount } or { name, amount }
    if (Array.isArray(data)) {
      return data.map(item => ({
        month: item.month || item.name || 'Unknown',
        amount: item.amount || 0
      }));
    }
    // If it's an object with keys as months
    if (typeof data === 'object') {
      return Object.entries(data).map(([month, amount]) => ({ month, amount }));
    }
    return [];
  };

  // Helper to safely transform user growth data
  const transformUserGrowthData = (analytics) => {
    if (!analytics) return [];
    const monthly = analytics.monthlyGrowth || analytics;
    if (Array.isArray(monthly)) {
      return monthly.map(item => ({
        month: item._id || item.month || 'Unknown',
        users: item.count || item.users || 0,
        students: item.students || 0,
        teachers: item.teachers || 0
      }));
    }
    return [];
  };

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [
        dashRes,
        revenueRes,
        userAnalyticsRes,
        pendingTeachersRes,
        pendingContentRes,
        pendingCommentsRes,
        paymentsRes,
        usersRes,
      ] = await Promise.allSettled([
        getAdminDashboard(),
        getRevenueAnalytics(period),
        getUserAnalytics(),
        getPendingTeachers(),
        getPendingContent(),
        getPendingComments(),
        getAllPayments(),
        getAllUsers({ limit: 5, sort: "-createdAt" }),
      ]);

      // Dashboard stats
      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setStats(dashRes.value.data);
        setCourseStats({
          totalCourses: dashRes.value.data.totalCourses || 0,
          activeCourses: dashRes.value.data.activeCourses || 0,
          totalEnrollments: dashRes.value.data.totalEnrollments || 0
        });
      } else {
        // Fallback empty stats
        setStats({ totalRevenue: 0, totalUsers: 0, totalStudents: 0, totalTeachers: 0 });
      }

      // Revenue data
      if (revenueRes.status === 'fulfilled') {
        const rawData = revenueRes.value?.data || revenueRes.value || [];
        setRevenueData(transformRevenueData(rawData));
      } else {
        // Fallback demo data to show chart
        setRevenueData([
          { month: 'Jan', amount: 4000 },
          { month: 'Feb', amount: 3000 },
          { month: 'Mar', amount: 5000 },
          { month: 'Apr', amount: 7000 },
          { month: 'May', amount: 6000 },
          { month: 'Jun', amount: 8000 },
        ]);
      }

      // User analytics
      if (userAnalyticsRes.status === 'fulfilled') {
        setUserGrowthData(transformUserGrowthData(userAnalyticsRes.value?.data || userAnalyticsRes.value));
      } else {
        // Fallback demo data
        setUserGrowthData([
          { month: 'Jan', users: 20, students: 15, teachers: 5 },
          { month: 'Feb', users: 35, students: 25, teachers: 10 },
          { month: 'Mar', users: 50, students: 35, teachers: 15 },
          { month: 'Apr', users: 65, students: 45, teachers: 20 },
          { month: 'May', users: 80, students: 55, teachers: 25 },
          { month: 'Jun', users: 100, students: 70, teachers: 30 },
        ]);
      }

      // Pending teachers
      if (pendingTeachersRes.status === 'fulfilled') {
        setPendingTeachers(pendingTeachersRes.value?.teachers || []);
      }

      // Pending content
      if (pendingContentRes.status === 'fulfilled') {
        const content = pendingContentRes.value?.content?.courses || pendingContentRes.value?.courses || [];
        setPendingContent(content);
      }

      // Pending comments
      if (pendingCommentsRes.status === 'fulfilled') {
        setPendingComments(pendingCommentsRes.value?.comments || []);
      }

      // Payments
      if (paymentsRes.status === 'fulfilled') {
        const payments = paymentsRes.value?.payments || [];
        const pending = payments.filter(p => p.status === 'PENDING' || p.adminApproved === false);
        setPendingPayments(pending);
        setRecentPayments(payments.slice(0, 5));
      }

      // Recent users
      if (usersRes.status === 'fulfilled') {
        setRecentUsers(usersRes.value?.users || []);
      }

    } catch (error) {
      console.error("Dashboard load error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
    toast.success("Dashboard refreshed");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-400 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="h-8 w-48 bg-dark-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-dark-200 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-dark-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(8)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-dark-200 rounded-xl p-6 h-96 animate-pulse"></div>
          <div className="bg-dark-200 rounded-xl p-6 h-96 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Prepare stat cards
  const cards = [
    { title: "Total Revenue", value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`, icon: DollarSign, color: "text-brand-primary", trend: stats?.revenueGrowth },
    { title: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-400", link: "/admin/users", trend: stats?.userGrowth },
    { title: "Active Students", value: stats?.totalStudents || 0, icon: UserCheck, color: "text-green-400", link: "/admin/users?role=student" },
    { title: "Total Teachers", value: stats?.totalTeachers || 0, icon: GraduationCap, color: "text-purple-400", link: "/admin/users?role=teacher" },
    { title: "Pending Approvals", value: (pendingTeachers.length + pendingContent.length + pendingComments.length + pendingPayments.length), icon: Clock, color: "text-yellow-400" },
    { title: "Pending Teachers", value: pendingTeachers.length, icon: Shield, color: "text-orange-400", link: "/admin/teachers" },
    { title: "Pending Content", value: pendingContent.length, icon: BookOpen, color: "text-cyan-400", link: "/admin/pending-content" },
    { title: "Pending Comments", value: pendingComments.length, icon: MessageSquare, color: "text-pink-400", link: "/admin/blogs" },
  ];

  const pendingTasks = [
    { icon: Clock, label: "Teacher Approvals", count: pendingTeachers.length, link: "/admin/teachers" },
    { icon: BookOpen, label: "Content for Review", count: pendingContent.length, link: "/admin/pending-content" },
    { icon: MessageSquare, label: "Comments to Moderate", count: pendingComments.length, link: "/admin/blogs" },
    { icon: CreditCard, label: "Pending Payments", count: pendingPayments.length, link: "/admin/payments" },
    { icon: Newspaper, label: "News Drafts", count: stats?.totalNews || 0, link: "/admin/news" },
  ];

  return (
    <div className="min-h-screen bg-dark-400 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Insights Dashboard</h1>
          <p className="text-grayCustom-medium mt-1">Complete overview of your platform's performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-dark-200 rounded-lg p-1">
            {['weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-sm transition-all ${
                  period === p ? 'bg-brand-primary text-dark-400 font-bold' : 'text-grayCustom-medium hover:text-white'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-brand-primary hover:bg-brand-primaryDark text-dark-400 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
     
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>



      {/* Course Stats Cards (moved above recent activities) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-brand-primary/10 to-transparent border border-brand-primary/20 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-dark-300 rounded-xl">
              <BookOpen className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <p className="text-grayCustom-medium text-sm">Total Courses</p>
              <p className="text-2xl font-bold text-white">{courseStats.totalCourses}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-400/10 to-transparent border border-blue-400/20 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-dark-300 rounded-xl">
              <CheckCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-grayCustom-medium text-sm">Active Courses</p>
              <p className="text-2xl font-bold text-white">{courseStats.activeCourses}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-400/10 to-transparent border border-purple-400/20 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-dark-300 rounded-xl">
              <UserCheck className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-grayCustom-medium text-sm">Total Enrollments</p>
              <p className="text-2xl font-bold text-white">{courseStats.totalEnrollments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Users */}
        <div className="bg-dark-200 border border-dark-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Users</h3>
            <Link to="/admin/users" className="text-brand-primary text-sm hover:underline">View All →</Link>
          </div>
          <div className="space-y-2">
            {recentUsers.length > 0 ? (
              recentUsers.map(user => <RecentUserItem key={user._id} user={user} />)
            ) : (
              <p className="text-grayCustom-medium text-center py-8">No recent users</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-dark-200 border border-dark-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <Link to="/admin/payments" className="text-brand-primary text-sm hover:underline">View All →</Link>
          </div>
          <div className="space-y-2">
            {recentPayments.length > 0 ? (
              recentPayments.map(payment => <RecentPaymentItem key={payment._id} payment={payment} />)
            ) : (
              <p className="text-grayCustom-medium text-center py-8">No recent transactions</p>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-dark-200 border border-dark-100 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Pending Tasks Overview</h3>
          <div className="space-y-2">
            {pendingTasks.map((task, index) => (
              <PendingItem key={index} {...task} />
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-dark-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-grayCustom-medium">Total Pending</span>
              <span className="font-bold text-brand-primary">
                {pendingTasks.reduce((sum, task) => sum + task.count, 0)}
              </span>
            </div>
          </div>
          <Link 
            to="/admin/pending-content"
            className="w-full mt-4 py-3 border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-dark-400 rounded-lg transition-all font-medium text-center block"
          >
            View All Tasks
          </Link>
        </div>
      </div>
    </div>
  );
}