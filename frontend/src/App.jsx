import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import Applications from "./pages/Applications";

const [token, setToken] = useState(localStorage.getItem("token"));

if (!token) return <Login setToken={setToken} />;

export default function App() {
  const [page, setPage] = useState("dashboard");

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
    <div className="flex">
      <Sidebar setPage={setPage} />

      <div className="flex-1 p-6 bg-gray-100 min-h-screen">
        {renderPage()}
      </div>
    </div>
  );
}