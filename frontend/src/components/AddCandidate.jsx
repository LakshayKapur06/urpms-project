import { useState } from "react";
import API from "../api/api";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  college_name: "",
  degree: "",
  specialization: "",
  cgpa: "",
  experience_years: "",
  skills: "",
};

export default function AddCandidate({ onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);

    try {
      setIsSubmitting(true);
      const res = await API.post("/candidates", form);
      setForm(initialForm);
      setNotice({ type: "success", message: "Candidate added successfully." });
      onCreated?.(res.data);
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.error || "Failed to add candidate.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70"
    >
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Add Candidate</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Capture academic background and experience in one place.
      </p>

      {notice ? (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder="First Name"
          value={form.first_name}
          onChange={(e) => updateField("first_name", e.target.value)}
        />
        <input
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Last Name"
          value={form.last_name}
          onChange={(e) => updateField("last_name", e.target.value)}
        />
        <input
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
        />
        <input
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
        />
        <input
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 md:col-span-2"
          placeholder="College Name"
          value={form.college_name}
          onChange={(e) => updateField("college_name", e.target.value)}
        />
        <input
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Degree"
          value={form.degree}
          onChange={(e) => updateField("degree", e.target.value)}
        />
        <input
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Specialization"
          value={form.specialization}
          onChange={(e) => updateField("specialization", e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          min="0"
          max="10"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder="CGPA"
          value={form.cgpa}
          onChange={(e) => updateField("cgpa", e.target.value)}
        />
        <input
          type="number"
          min="0"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Experience Years"
          value={form.experience_years}
          onChange={(e) => updateField("experience_years", e.target.value)}
        />
        <textarea
          className="min-h-28 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 md:col-span-2"
          placeholder="Skills"
          value={form.skills}
          onChange={(e) => updateField("skills", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {isSubmitting ? "Saving..." : "Create Candidate"}
      </button>
    </form>
  );
}
