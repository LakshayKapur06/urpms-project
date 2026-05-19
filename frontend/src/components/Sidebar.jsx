import { LayoutDashboard, Users, Briefcase, Wallet } from "lucide-react";

export default function Sidebar({ setPage, activePage }) {
  const menu = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
    { key: "candidates", label: "Candidates", icon: <Users /> },
    { key: "applications", label: "Applications", icon: <Briefcase /> },
    { key: "payroll", label: "Payroll", icon: <Wallet /> },
  ];

  return (
    <div className="min-h-screen w-64 border-r border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-950/70">
      <h1 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
        URPMS
      </h1>

      {menu.map((item) => {
        const isActive = activePage === item.key;

        return (
          <div
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`mb-2 flex cursor-pointer items-center gap-3 rounded-xl p-3 transition ${
              isActive
                ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            }`}
          >
            {item.icon}
            {item.label}
          </div>
        );
      })}
    </div>
  );
}
