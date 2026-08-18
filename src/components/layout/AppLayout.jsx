import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "../../contexts/AuthContext";

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-surface-panel">
      <Header />
      <div className="flex">
        <Sidebar role={user?.role} />
        <main className="flex-1 p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
