import { motion } from "framer-motion";

export default function KPICard({ title, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-slate-200/70 bg-white/75 p-5 shadow-sm backdrop-blur-lg transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70"
    >
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>

      <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p>
    </motion.div>
  );
}
