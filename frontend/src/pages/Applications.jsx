import { useEffect, useState } from "react";
import API from "../api/api";

export default function Applications() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    API.get("/applications")
      .then((res) => setApps(res.data))
      .catch(console.error);
  }, []);

  const updateStatus = (id, status) => {
    API.put(`/applications/${id}/status`, { new_status: status }).then(() =>
      alert("Updated"),
    );
  };

  const hireCandidate = (id) => {
    API.post(`/applications/${id}/hire`, {
      base_salary: 800000,
      bonus: 10,
    }).then(() => {
      alert("Candidate hired");
      window.location.reload();
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Applications
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Review application status and hiring actions.
        </p>
      </div>

      {apps.map((a) => (
        <div
          key={a.application_id}
          className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-slate-700 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
        >
          <p className="font-medium">
            App #{a.application_id} - {a.status}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
              onClick={() => updateStatus(a.application_id, "SCREENING")}
            >
              Move to Screening
            </button>

            <button
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-500"
              onClick={() => hireCandidate(a.application_id)}
            >
              Hire
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
