import { useEffect, useState } from "react";
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

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get("/dashboard/metrics")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!data) return <div className="text-slate-700 dark:text-slate-200">Loading...</div>;

  const totalApplications = data.candidatesByStage.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const hired =
    data.candidatesByStage.find((s) => s.status === "HIRED")?.count || 0;

  const screening =
    data.candidatesByStage.find((s) => s.status === "SCREENING")?.count || 0;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Total Applications" value={totalApplications} color="text-blue-600" />
        <KPICard title="Hired" value={hired} color="text-green-600" />
        <KPICard title="In Screening" value={screening} color="text-yellow-500" />
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
          className="rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
            Pipeline
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.candidatesByStage}>
              <XAxis dataKey="status" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70"
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
          className="col-span-full rounded-2xl border border-slate-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-md transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70"
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
                label
              >
                {data.employeesPerDept.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
