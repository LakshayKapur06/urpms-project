import { useState, useEffect } from "react";

export default function Topbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
        Dashboard
      </h1>

      <button
        onClick={() => setDark(!dark)}
        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
      >
        {dark ? "Light" : "Dark"}
      </button>
    </div>
  );
}