import React from "react";

const StatCard = ({ title = "Stat", value = 0, icon = null, trend = null }) => {
  // Ensure title is a string and handle undefined/null cases
  const displayTitle = String(title || "").replace(/([A-Z])/g, " $1").trim() || "Stat";
  const displayValue = typeof value === "number" ? value : 0;

  return (
    <div className="bg-dark-200 border border-dark-100 rounded-xl p-6 hover:border-brand-primary/30 transition">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-grayCustom-medium">{displayTitle}</span>
        {icon && <span className="text-2xl text-brand-primary">{icon}</span>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{displayValue}</span>
        {trend && (
          <span className={`text-sm font-semibold ${trend > 0 ? "text-green-400" : "text-red-400"}`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;