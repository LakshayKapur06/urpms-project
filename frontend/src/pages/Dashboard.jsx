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
import Topbar from "../components/Topbar";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get("/dashboard/metrics")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!data) return <div className="text-gray-700 dark:text-gray-200">Loading...</div>;

  const totalApplications = data.candidatesByStage.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const hired =
    data.candidatesByStage.find((s) => s.status === "HIRED")?.count || 0;

  const screening =
    data.candidatesByStage.find((s) => s.status === "SCREENING")?.count || 0;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-8">
      <Topbar />

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-6">
        <KPICard title="Total Applications" value={totalApplications} color="text-blue-600" />
        <KPICard title="Hired" value={hired} color="text-green-600" />
        <KPICard title="In Screening" value={screening} color="text-yellow-500" />
        <KPICard
          title="Conversion Rate"
          value={`${Number(data.conversionRate.conversion_rate || 0).toFixed(1)}%`}
          color="text-purple-600"
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-2 gap-6">

        {/* Pipeline Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition duration-300"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Pipeline
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.candidatesByStage}>
              <XAxis dataKey="status" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Conversion Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center hover:shadow-lg transition duration-300"
        >
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
            Conversion Rate
          </h2>

          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {Number(data.conversionRate.conversion_rate || 0).toFixed(2)}%
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Candidates → Hired
          </p>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition col-span-2"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
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