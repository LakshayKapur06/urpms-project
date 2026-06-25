import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import Applications from "./pages/Applications";
import Payroll from "./pages/Payroll";
import Removed from "./pages/Removed";
import Login from "./pages/Login";

const pageTitles = {
  dashboard: "Dashboard",
  candidates: "Candidates",
  applications: "Applications",
  payroll: "Payroll",
  removed: "Removed",
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [page, setPage] = useState("dashboard");

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) return <Login setToken={setToken} />;

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard setPage={setPage} />;
      case "candidates":
        return <Candidates />;
      case "applications":
        return <Applications />;
      case "payroll":
        return <Payroll />;
      case "removed":
        return <Removed />;
      default:
        return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar setPage={setPage} activePage={page} />

      <div className="flex-1 p-6 transition-colors duration-300">
        <Topbar title={pageTitles[page] || "Dashboard"} onLogout={handleLogout} />
        {renderPage()}
      </div>
    </div>
  );
}
