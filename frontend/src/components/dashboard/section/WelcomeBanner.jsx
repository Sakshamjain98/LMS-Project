import { motion } from "framer-motion";

export default function WelcomeBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-200 rounded-xl p-6 mb-6 border border-dark-100"
    >
      <p className="text-brand-primary text-sm mb-2">
        Educator Panel
      </p>

      <h1 className="text-3xl font-bold">
        Welcome back, <span className="text-brand-primary">Dr. Sharma</span>
      </h1>

      <p className="text-grayCustom-medium mt-2">
        You have 3 upcoming live classes and 12 pending test reviews.
      </p>
    </motion.div>
  );
}