import { useEffect, useState, useCallback } from "react";
import API from "../api/api";

export default function Removed() {
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const [activeTab, setActiveTab] = useState("applications");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [positionFilter, setPositionFilter] = useState("ALL");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const [candRes, appRes] = await Promise.all([
        API.get("/archive/candidates"),
        API.get("/archive/applications"),
      ]);
      setCandidates(candRes.data);
      setApplications(appRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load archived data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRestoreCandidate = async (id) => {
    if (!window.confirm("Restore this candidate to the active candidate pool?")) return;
    try {
      setIsLoading(true);
      await API.post(`/archive/candidates/${id}/restore`);
      setNotice({ type: "success", message: "Candidate restored successfully." });
      loadData();
    } catch (e) {
      setNotice({ type: "error", message: "Failed to restore candidate." });
      setIsLoading(false);
    }
  };

  const handleRestoreApplication = async (id) => {
    if (!window.confirm("WARNING: This will wipe previous interview feedback and place the candidate back into the APPLIED stage. Proceed?")) return;
    try {
      setIsLoading(true);
      await API.post(`/archive/applications/${id}/restore`);
      setNotice({ type: "success", message: "Application restored to APPLIED stage." });
      loadData();
    } catch (e) {
      setNotice({ type: "error", message: "Failed to restore application." });
      setIsLoading(false);
    }
  };

  const uniquePositions = ["ALL", ...new Set(applications.map((a) => a.job_role))];
  const uniqueStages = ["ALL", ...new Set(applications.map((a) => a.archived_stage).filter(Boolean))];

  const displayedApplications = applications.filter((a) => {
    if (stageFilter !== "ALL" && a.archived_stage !== stageFilter) return false;
    if (positionFilter !== "ALL" && a.job_role !== positionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/60">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Removed Records (Archive)
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          View all removed candidates and applications. Data is securely retained for auditibility.
        </p>

        <div className="mt-6 flex border-b border-slate-200 dark:border-neutral-700">
          <button
            className={`px-4 py-2 font-medium transition ${
              activeTab === "applications"
                ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("applications")}
          >
            Removed Applications
          </button>
          <button
            className={`px-4 py-2 font-medium transition ${
              activeTab === "candidates"
                ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("candidates")}
          >
            Removed Candidates
          </button>
        </div>

        {activeTab === "applications" && (
          <div className="mt-4 flex gap-3">
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            >
              <option value="ALL">All Positions</option>
              {uniquePositions.filter(p => p !== "ALL").map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="ALL">All Stages</option>
              {uniqueStages.filter(s => s !== "ALL").map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {notice ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"}`}>
          {notice.message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/50 dark:text-slate-300">
          Loading archive...
        </div>
      ) : null}

      {!isLoading && activeTab === "applications" && (
        <div className="space-y-3">
          {displayedApplications.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/50 dark:text-slate-300">
              No archived applications found.
            </div>
          ) : (
            displayedApplications.map((a) => (
              <div key={a.application_id} className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-slate-700 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/50 dark:text-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{a.first_name} {a.last_name}</p>
                    <p className="mt-1 text-sm text-slate-500">{a.email}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {a.job_role}
                      </span>
                      <span className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                        Removed at: {a.archived_stage || "UNKNOWN"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreApplication(a.application_id)}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    Restore Application
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!isLoading && activeTab === "candidates" && (
        <div className="space-y-3">
          {candidates.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/50 dark:text-slate-300">
              No archived candidates found.
            </div>
          ) : (
            candidates.map((c) => (
              <div key={c.candidate_id} className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-slate-700 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/50 dark:text-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{c.first_name} {c.last_name}</p>
                    <p className="mt-1 text-sm text-slate-500">{c.email}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {c.degree} - {c.specialization}
                      </span>
                      <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        {c.job_role || "No Role"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreCandidate(c.candidate_id)}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    Restore Candidate
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
