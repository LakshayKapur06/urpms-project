import { useEffect, useState } from "react";
import API from "../api/api";

const initialForm = {
  employee_id: "",
  month: "",
  year: "",
};

export default function Payroll() {
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [notice, setNotice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const employeeMap = new Map(
    employees.map((employee) => [employee.employee_id, employee]),
  );

  const loadPayrollData = async () => {
    try {
      setIsLoading(true);
      const [paymentsRes, employeesRes] = await Promise.all([
        API.get("/payroll/payments"),
        API.get("/employees"),
      ]);
      setPayments(paymentsRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.error || "Failed to load payroll data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollData();
  }, []);

  const generatePayroll = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setNotice(null);
      const res = await API.post("/payroll/generate", form);
      setNotice({ type: "success", message: res.data.message });
      setForm(initialForm);
      await loadPayrollData();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.error || "Failed to generate payroll.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completePayment = async (id) => {
    try {
      setBusyId(id);
      const res = await API.put(`/payroll/payment/${id}`, { status: "COMPLETED" });
      setNotice({ type: "success", message: res.data.message });
      setPayments((current) =>
        current.map((payment) =>
          payment.payroll_id === id ? { ...payment, payment_status: "COMPLETED" } : payment,
        ),
      );
    } catch (error) {
      setNotice({
        type: "error",
        message: error.response?.data?.error || "Failed to update payment status.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Payroll</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Generate payroll cycles and track payment completion.
        </p>
      </div>

      <form
        onSubmit={generatePayroll}
        className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <select
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            value={form.employee_id}
            onChange={(e) => setForm((current) => ({ ...current, employee_id: e.target.value }))}
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                #{employee.employee_id} {employee.first_name || "Unknown"} {employee.last_name || ""}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            max="12"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Payroll Month"
            value={form.month}
            onChange={(e) => setForm((current) => ({ ...current, month: e.target.value }))}
          />

          <input
            type="number"
            min="2024"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Payroll Year"
            value={form.year}
            onChange={(e) => setForm((current) => ({ ...current, year: e.target.value }))}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSubmitting ? "Generating..." : "Generate Payroll"}
        </button>
      </form>

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

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          Loading payroll records...
        </div>
      ) : null}

      {!isLoading &&
        payments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            No payroll records found yet.
          </div>
        ) : null}

      {!isLoading &&
        payments.map((p) => (
          (() => {
            const employee = employeeMap.get(p.employee_id);

            return (
              <div
                key={p.payroll_id}
                className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-slate-700 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <p className="font-medium">Payroll #{p.payroll_id}</p>
                <div className="mt-2 grid gap-2 text-sm text-slate-500 dark:text-slate-400 md:grid-cols-2 xl:grid-cols-4">
                  <p>
                    Employee: #
                    {p.employee_id} {employee ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim() : "Unknown"}
                  </p>
                  <p>Department: {employee?.department || "N/A"}</p>
                  <p>Month/Year: {p.payroll_month}/{p.payroll_year}</p>
                  <p>Gross Salary: {p.gross_salary}</p>
                </div>

                <div className="mt-2 grid gap-2 text-sm text-slate-500 dark:text-slate-400 md:grid-cols-2 xl:grid-cols-4">
                  <p>Email: {employee?.email || "N/A"}</p>
                  <p>Joining Date: {employee?.joining_date ? new Date(employee.joining_date).toLocaleDateString() : "N/A"}</p>
                  <p>Status: {p.payment_status}</p>
                </div>

                {p.payment_status === "PENDING" ? (
                  <button
                    className="mt-3 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-green-300"
                    onClick={() => completePayment(p.payroll_id)}
                    disabled={busyId === p.payroll_id}
                  >
                    {busyId === p.payroll_id ? "Updating..." : "Mark Completed"}
                  </button>
                ) : null}
              </div>
            );
          })()
        ))}
    </div>
  );
}
