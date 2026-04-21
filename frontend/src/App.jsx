import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import Applications from "./pages/Applications";
import Login from "./pages/Login";

const pageTitles = {
  dashboard: "Dashboard",
  candidates: "Candidates",
  applications: "Applications",
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
      case "candidates":
        return <Candidates />;
      case "applications":
        return <Applications />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar setPage={setPage} />

      <div className="flex-1 p-6 transition-colors duration-300">
        <Topbar title={pageTitles[page] || "Dashboard"} onLogout={handleLogout} />
        {renderPage()}
      </div>
    </div>
  );
}
