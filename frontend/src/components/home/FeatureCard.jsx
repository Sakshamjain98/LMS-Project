import React from 'react';

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-dark-100 p-8 rounded-2xl border border-white/5 hover:border-brand-primary/30 transition-all group">
    <div className="bg-dark-400 w-12 h-12 rounded-lg flex items-center justify-center text-xl mb-6 border border-white/10 group-hover:bg-brand-primary/10 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default FeatureCard;