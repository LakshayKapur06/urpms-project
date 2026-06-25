import { useEffect, useState, useMemo, useCallback } from "react";
import API from "../api/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import KPICard from "../components/KPICard";
import { motion } from "framer-motion";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "12px",
  color: "#f8fafc",
};
const tooltipLabelStyle = {
  color: "#f8fafc",
  fontWeight: 600,
};
const tooltipItemStyle = {
  color: "#e2e8f0",
};

function formatStatusLabel(value) {
  if (value === "INTERVIEW_SCHEDULED") return "Scheduled";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const loadMetrics = useCallback(() => {
    API.get("/dashboard/metrics")
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.error || "Failed to load dashboard metrics.");
      });
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const { totalApplications, hired, shortlisted } = useMemo(() => {
    if (!data) return { totalApplications: 0, hired: 0, shortlisted: 0 };

    return {
      totalApplications: data.candidatesByStage.reduce((sum, item) => sum + item.count, 0),
      hired: data.candidatesByStage.find((s) => s.status === "HIRED")?.count || 0,
      shortlisted: data.candidatesByStage.find((s) => s.status === "SHORTLISTED")?.count || 0,
    };
  }, [data]);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
        {error}
      </div>
    );
  }

  if (!data) return <div className="text-slate-700 dark:text-slate-200">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Total Applications" value={totalApplications} color="text-blue-600" />
        <KPICard title="Hired" value={hired} color="text-green-600" />
        <KPICard title="Shortlisted" value={shortlisted} color="text-yellow-500" />
        <KPICard
          title="Conversion Rate"
          value={`${Number(data.conversionRate.conversion_rate || 0).toFixed(1)}%`}
          color="text-purple-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition duration-300 hover:shadow-lg dark:border-neutral-800/80 dark:bg-neutral-900/60"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
            Pipeline
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.candidatesByStage}>
              <XAxis
                dataKey="status"
                stroke="#94a3b8"
                tickFormatter={formatStatusLabel}
              />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                cursor={{ fill: "rgba(59, 130, 246, 0.14)" }}
                labelFormatter={formatStatusLabel}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition duration-300 hover:shadow-lg dark:border-neutral-800/80 dark:bg-neutral-900/60"
        >
          <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            Conversion Rate
          </h2>

          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {Number(data.conversionRate.conversion_rate || 0).toFixed(2)}%
          </p>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Candidates to Hired
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-full rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/60"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
            Employees by Department
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.employeesPerDept}
                dataKey="total"
                nameKey="department"
                outerRadius={120}
              >
                {data.employeesPerDept.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
