import { motion, type Variants } from "framer-motion";

export default function Dashboard() {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.12, duration: 0.45, type: "spring", stiffness: 140, damping: 18 },
    }),
  };

  const gradients = [
    "from-indigo-500 to-blue-500",
    "from-fuchsia-500 to-pink-500",
    "from-emerald-500 to-teal-500",
  ];

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="text-2xl font-bold"
      >
        Dashboard
      </motion.h2>

      <div className="grid gap-6 md:grid-cols-3">
        {["Tổng quan 1", "Tổng quan 2", "Tổng quan 3"].map((label, i) => (
          <motion.div
            key={label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ translateY: -4 }}
            className={`rounded-2xl bg-gradient-to-r p-6 text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,.35)] ${gradients[i % gradients.length]}`}
          >
            <div className="text-sm/6 opacity-90">Widget</div>
            <div className="text-xl font-semibold">{label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
