import React from 'react';

const StatCard = ({ icon, count, label }) => (
  <div className="bg-dark-200 p-6 md:p-8 rounded-2xl border border-white/5 flex flex-col items-center transition-transform hover:scale-105">
    <div className="text-brand-primary text-2xl mb-4">{icon}</div>
    <div className="text-3xl font-bold mb-1 text-white">{count}</div>
    <div className="text-gray-500 text-xs uppercase tracking-widest">{label}</div>
  </div>
);

export default StatCard;