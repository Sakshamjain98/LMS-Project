import React from 'react';
import { FaTag, FaClock } from 'react-icons/fa';

const BlogCard = ({ category, title, desc, author, time }) => (
  <div className="bg-dark-200 border border-white/5 rounded-2xl overflow-hidden flex flex-col hover:border-brand-primary/20 transition-all">
    <div className="h-48 bg-dark-300 flex items-center justify-center opacity-40">
      <FaTag className="text-brand-primary text-4xl" />
    </div>
    <div className="p-6">
      <span className="bg-brand-primary/10 text-brand-primary text-[9px] font-bold px-2 py-1 rounded uppercase mb-3 inline-block">{category}</span>
      <h4 className="text-white font-bold text-base mb-3 leading-tight">{title}</h4>
      <p className="text-gray-500 text-xs mb-6 line-clamp-2">{desc}</p>
      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
           <div className="w-5 h-5 rounded-full bg-dark-400 flex items-center justify-center text-[8px] font-bold">DR</div>
           <span>{author}</span>
        </div>
        <div className="flex items-center gap-1"><FaClock /> {time} min</div>
      </div>
    </div>
  </div>
);

export default BlogCard;