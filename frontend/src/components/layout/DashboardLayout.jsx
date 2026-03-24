import Sidebar from "../layout/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-dark-300 text-white overflow-hidden">

      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar (NOT PUBLIC NAVBAR) */}
     
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>
    </div>
  );
}