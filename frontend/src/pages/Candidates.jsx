import { useEffect, useState } from "react";
import API from "../api/api";
import AddCandidate from "../components/AddCandidate";

const initialPipelineForm = {
  candidate_id: null,
  job_role: "",
  expected_salary: "",
  notice_period: "",
  application_source: "",
};

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ minCgpa: "", minExperience: "" });
  const [notice, setNotice] = useState(null);
  const [pipelineForm, setPipelineForm] = useState(initialPipelineForm);
  const [isSubmittingPipeline, setIsSubmittingPipeline] = useState(false);

  const loadCandidates = async (appliedFilters = filters) => {
    try {
      setIsLoading(true);
      setError("");
      const res = await API.get("/candidates", {
        params: {
          minCgpa: appliedFilters.minCgpa || undefined,
          minExperience: appliedFilters.minExperience || undefined,
        },
      });
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load candidates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const createApplication = async (event) => {
    event.preventDefault();

    try {
      setIsSubmittingPipeline(true);
      const res = await API.post("/applications", pipelineForm);
      setNotice({
        type: "success",
        message: `Candidate moved into the pipeline as application #${res.data.application_id}.`,
      });
      setPipelineForm(initialPipelineForm);
    } catch (err) {
      setNotice({
        type: "error",
        message: err.response?.data?.error || "Failed to move candidate into the hiring pipeline.",
      });
    } finally {
      setIsSubmittingPipeline(false);
    }
  };

  return (
    <div className="space-y-4">
      <AddCandidate onCreated={() => loadCandidates()} />

      <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Candidates
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Browse candidates, filter by academic fit, and move specific people into the hiring pipeline.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="grid gap-4 md:grid-cols-2">
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
            value={filters.minExperience}
            onChange={(e) => setFilters((current) => ({ ...current, minExperience: e.target.value }))}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500"
            onClick={() => loadCandidates()}
          >
            Apply Filters
          </button>
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => {
              const reset = { minCgpa: "", minExperience: "" };
              setFilters(reset);
              loadCandidates(reset);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {notice ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          Loading candidates...
        </div>
      ) : null}

      {!isLoading && !error && candidates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          No candidates matched the selected filters.
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="space-y-3">
          {candidates.map((c) => {
            const isOpen = pipelineForm.candidate_id === c.candidate_id;

            return (
              <div
                key={c.candidate_id}
                className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-slate-700 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{c.email}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {c.phone || "No phone number available"}
                    </p>
                  </div>

                  <button
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                    onClick={() =>
                      setPipelineForm((current) =>
                        current.candidate_id === c.candidate_id
                          ? initialPipelineForm
                          : {
                              candidate_id: c.candidate_id,
                              job_role: "",
                              expected_salary: "",
                              notice_period: "",
                              application_source: "",
                            },
                      )
                    }
                  >
                    {isOpen ? "Close Pipeline Form" : "Move to Pipeline"}
                  </button>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2 xl:grid-cols-4">
                  <p>Degree: {c.degree || "N/A"}</p>
                  <p>Specialization: {c.specialization || "N/A"}</p>
                  <p>CGPA: {c.cgpa ?? "N/A"}</p>
                  <p>Experience: {c.experience_years ?? 0} years</p>
                </div>

                {isOpen ? (
                  <form onSubmit={createApplication} className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Job Role"
                      value={pipelineForm.job_role}
                      onChange={(e) => setPipelineForm((current) => ({ ...current, job_role: e.target.value }))}
                    />
                    <input
                      type="number"
                      min="0"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Expected Salary"
                      value={pipelineForm.expected_salary}
                      onChange={(e) =>
                        setPipelineForm((current) => ({ ...current, expected_salary: e.target.value }))
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Notice Period (days)"
                      value={pipelineForm.notice_period}
                      onChange={(e) =>
                        setPipelineForm((current) => ({ ...current, notice_period: e.target.value }))
                      }
                    />
                    <input
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Application Source"
                      value={pipelineForm.application_source}
                      onChange={(e) =>
                        setPipelineForm((current) => ({ ...current, application_source: e.target.value }))
                      }
                    />

                    <button
                      type="submit"
                      disabled={isSubmittingPipeline}
                      className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300 md:col-span-2"
                    >
                      {isSubmittingPipeline ? "Creating Application..." : "Create Application"}
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
