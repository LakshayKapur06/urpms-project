import { LayoutDashboard, Users, Briefcase } from "lucide-react";

export default function Sidebar({ setPage }) {
  const menu = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
    { key: "candidates", label: "Candidates", icon: <Users /> },
    { key: "applications", label: "Applications", icon: <Briefcase /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-5 shadow-sm">
      <h1 className="text-2xl font-bold mb-8">URPMS</h1>

      {menu.map(item => (
        <div
          key={item.key}
          onClick={() => setPage(item.key)}
          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-100 transition"
        >
          {item.icon}
          {item.label}
        </div>
      ))}
    </div>
  );
}