import React from 'react';
import { FaBullhorn } from 'react-icons/fa';

const NewsItem = ({ category, title, date, desc, isUrgent }) => (
  <div className="bg-dark-200 border border-white/5 p-5 rounded-xl hover:bg-dark-100 transition-colors flex items-start gap-4">
    <div className={`p-3 rounded-lg ${isUrgent ? 'bg-red-500/10 text-red-500' : 'bg-brand-primary/10 text-brand-primary'}`}>
      <FaBullhorn />
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-bold uppercase text-brand-primary">{category}</span>
          {isUrgent && <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded animate-pulse">URGENT</span>}
        </div>
        <span className="text-gray-600 text-[10px]">{date}</span>
      </div>
      <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
      <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default NewsItem;