import { Outlet } from "react-router-dom";
import StudentSidebar from "../../components/layout/StudentSidebar";

export default function StudentLayout() {
  return (
    <div className="flex h-screen bg-dark-300 text-white overflow-hidden">
      <StudentSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
