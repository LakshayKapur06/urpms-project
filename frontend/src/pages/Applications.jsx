import { useEffect, useState } from "react";
import API from "../api/api";

const nextStatusMap = {
  APPLIED: "SCREENING",
  SCREENING: "SHORTLISTED",
  SHORTLISTED: "INTERVIEWED",
  INTERVIEWED: "OFFERED",
  OFFERED: "HIRED",
};

const initialFilters = {
  minCgpa: "",
  minExp: "",
  maxSalary: "",
  minScore: "",
};

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeView, setActiveView] = useState("all");

  const loadApplications = async (scoreFilter = "") => {
    try {
      setIsLoading(true);
      setNotice(null);
      const res = await API.get("/applications", {
        params: {
          minScore: scoreFilter || undefined,
        },
      });
      setApps(res.data);
      setActiveView("all");
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.error || "Could not load applications.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      setBusyId(id);
      const res = await API.put(`/applications/${id}/status`, { new_status: status });

      setApps((current) =>
        current.map((app) =>
          app.application_id === id ? { ...app, status: res.data.to } : app,
        ),
      );
      setNotice({ type: "success", message: `Application moved to ${res.data.to}.` });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.error || "Could not update the application status.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const hireCandidate = async (id) => {
    try {
      setBusyId(id);
      const res = await API.post(`/applications/${id}/hire`, {
        department: "Engineering",
        base_salary: 800000,
        bonus_percentage: 10,
      });

      setApps((current) =>
        current.map((app) =>
          app.application_id === id ? { ...app, status: res.data.status || "HIRED" } : app,
        ),
      );
      setNotice({ type: "success", message: "Candidate hired successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.error || "Could not hire the candidate.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const removeApplication = async (id) => {
    try {
      setBusyId(id);
      const res = await API.delete(`/applications/${id}`);
      setApps((current) => current.filter((app) => app.application_id !== id));
      setNotice({ type: "success", message: res.data.message || "Application removed." });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.error || "Could not remove the application.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const applyFilters = async () => {
    try {
      setIsFiltering(true);
      setNotice(null);
      const res = await API.get("/applications/filter", {
        params: {
          minCgpa: filters.minCgpa || 0,
          minExp: filters.minExp || 0,
          maxSalary: filters.maxSalary || 999999999,
          minScore: filters.minScore || undefined,
        },
      });
      setApps(res.data);
      setActiveView("filtered");
      if (res.data.length === 0) {
        setNotice({ type: "info", message: "No applications matched the selected filters." });
      }
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.error || "Could not apply filters.",
      });
    } finally {
      setIsFiltering(false);
    }
  };

  const clearFilters = () => {
    const reset = initialFilters;
    setFilters(reset);
    loadApplications();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Applications
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Review every application with candidate details, interview scores, stage actions, and pipeline controls.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="number"
            step="0.01"
            min="0"
            max="10"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Min CGPA"
            value={filters.minCgpa}
            onChange={(e) => setFilters((current) => ({ ...current, minCgpa: e.target.value }))}
          />
          <input
            type="number"
            min="0"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Min Experience"
            value={filters.minExp}
            onChange={(e) => setFilters((current) => ({ ...current, minExp: e.target.value }))}
          />
          <input
            type="number"
            min="0"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Max Salary"
            value={filters.maxSalary}
            onChange={(e) => setFilters((current) => ({ ...current, maxSalary: e.target.value }))}
          />
          <input
            type="number"
            min="0"
            max="100"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Min Interview Score"
            value={filters.minScore}
            onChange={(e) => setFilters((current) => ({ ...current, minScore: e.target.value }))}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
            onClick={applyFilters}
            disabled={isFiltering}
          >
            {isFiltering ? "Applying..." : "Apply Filters"}
          </button>
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={clearFilters}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {notice ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
              : notice.type === "info"
                ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200"
                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          Loading applications...
        </div>
      ) : null}

      {!isLoading && apps.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          {activeView === "filtered"
            ? "No applications matched your filters."
            : "No applications found yet."}
        </div>
      ) : null}

      {!isLoading &&
        apps.map((a) => (
          <div
            key={a.application_id}
            className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-slate-700 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  Application #{a.application_id} - {a.first_name} {a.last_name}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{a.email}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {a.job_role} · {a.application_source || "Unknown source"}
                </p>
              </div>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {a.status}
              </span>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2 xl:grid-cols-4">
              <p>Expected Salary: {a.expected_salary ?? "N/A"}</p>
              <p>Notice Period: {a.notice_period ?? "N/A"} days</p>
              <p>CGPA: {a.cgpa ?? "N/A"}</p>
              <p>Experience: {a.experience_years ?? 0} years</p>
            </div>

            <div className="mt-2 grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2 xl:grid-cols-4">
              <p>Technical Score: {a.technical_score ?? "N/A"}</p>
              <p>Communication Score: {a.communication_score ?? "N/A"}</p>
              <p>Overall Score: {a.overall_score ?? "N/A"}</p>
              <p>Specialization: {a.specialization || "N/A"}</p>
            </div>

            {a.remarks ? (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Interview feedback: {a.remarks}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {nextStatusMap[a.status] && a.status !== "OFFERED" ? (
                <button
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                  onClick={() => updateStatus(a.application_id, nextStatusMap[a.status])}
                  disabled={busyId === a.application_id}
                >
                  {busyId === a.application_id
                    ? "Updating..."
                    : `Move to ${nextStatusMap[a.status]}`}
                </button>
              ) : null}

              <button
                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-green-300"
                onClick={() => hireCandidate(a.application_id)}
                disabled={busyId === a.application_id || a.status !== "OFFERED"}
              >
                {busyId === a.application_id && a.status === "OFFERED" ? "Hiring..." : "Hire"}
              </button>

              <button
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-300"
                onClick={() => removeApplication(a.application_id)}
                disabled={busyId === a.application_id}
              >
                {busyId === a.application_id ? "Removing..." : "Remove from Pipeline"}
              </button>
            </div>

            {a.status !== "OFFERED" && a.status !== "HIRED" ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Hiring is enabled after the application reaches OFFERED.
              </p>
            ) : null}
          </div>
        ))}
    </div>
  );
}
