import React from 'react';
import { FaBolt } from 'react-icons/fa';

const FacultyCard = ({ name, role, dept, xp, initial }) => (
  <div className="bg-dark-200 border border-white/5 p-8 rounded-2xl text-center group hover:border-brand-primary/30 transition-all">
    <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-primary/20">
      <span className="text-brand-primary font-bold text-xl uppercase">{initial}</span>
    </div>
    <h4 className="text-white font-bold mb-1">{name}</h4>
    <p className="text-brand-primary text-[11px] font-medium mb-1">{role}</p>
    <p className="text-gray-500 text-[10px] mb-4">{dept}</p>
    <div className="inline-flex items-center gap-1 bg-dark-300 px-3 py-1 rounded-full text-brand-primary text-[10px] font-bold">
      <FaBolt className="text-[8px]" /> {xp} XP
    </div>
  </div>
);

export default FacultyCard;