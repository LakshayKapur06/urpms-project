import { motion } from "framer-motion";

export default function KPICard({ title, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
      className="backdrop-blur-lg bg-white/70 border border-gray-200 p-5 rounded-2xl shadow-sm"
    >
      <p className="text-sm text-gray-500">{title}</p>

      <p className={`text-3xl font-semibold mt-2 ${color}`}>
        {value}
      </p>
    </motion.div>
  );
}