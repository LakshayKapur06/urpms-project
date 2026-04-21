import { useEffect, useState } from "react";
import API from "../api/api";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    API.get("/candidates")
      .then((res) => setCandidates(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Candidates
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Browse the active candidate list.
        </p>
      </div>

      <div className="space-y-3">
        {candidates.map((c) => (
          <div
            key={c.candidate_id}
            className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-slate-700 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
          >
            {c.first_name} {c.last_name} ({c.email})
          </div>
        ))}
      </div>
    </div>
  );
}
