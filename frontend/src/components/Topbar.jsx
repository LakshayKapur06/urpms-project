import { useEffect, useState } from "react";

export default function Topbar({ title, onLogout }) {
  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/75 px-5 py-4 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDark(!dark)}
          className="rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          {dark ? "Light mode" : "Dark mode"}
        </button>

        <button
          onClick={onLogout}
          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200 dark:hover:bg-rose-900/60"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
