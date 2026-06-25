import { LayoutDashboard, Users, Briefcase, Wallet, Trash2, Building2 } from "lucide-react";

export default function Sidebar({ setPage, activePage }) {
  const menu = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { key: "candidates", label: "Candidates", icon: <Users className="w-5 h-5" /> },
    { key: "applications", label: "Applications", icon: <Briefcase className="w-5 h-5" /> },
    { key: "payroll", label: "Payroll", icon: <Wallet className="w-5 h-5" /> },
    { key: "removed", label: "Removed", icon: <Trash2 className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col w-64 border-r border-slate-200/60 bg-white/50 p-5 shadow-sm backdrop-blur-xl dark:border-neutral-800/60 dark:bg-black/30 select-none">
      {/* Corporate Brand Section */}
      <div className="mb-10 flex items-center gap-3">
        {/* Minimal Corporate Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 shadow-md dark:bg-slate-100 border border-slate-700/50 dark:border-slate-300/50">
          <Building2 className="h-6 w-6 text-white dark:text-slate-900" strokeWidth={1.5} />
        </div>

        {/* Corporate Typography */}
        <div className="flex flex-col ml-1">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            URPMS
          </span>
          <span className="text-[10px] font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase -mt-0.5">
            Enterprise
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1">
        {menu.map((item) => {
          const isActive = activePage === item.key;
          return (
            <div
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-200"
              }`}
            >
              {item.icon}
              {item.label}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
