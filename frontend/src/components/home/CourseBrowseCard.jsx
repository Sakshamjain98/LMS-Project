import React from 'react';
import { FaPlay, FaUsers, FaStar, FaClock, FaLock, FaBookOpen } from 'react-icons/fa';

const CourseBrowseCard = ({ title, category, price, lectures, hours, students, rating }) => (
  <div className="bg-dark-200 border border-white/5 rounded-2xl overflow-hidden group hover:border-brand-primary/20 transition-all">
    <div className="h-40 bg-dark-300 flex items-center justify-center relative">
      <FaBookOpen className="text-brand-primary/20 text-5xl" />
      <div className="absolute top-3 right-3 text-gray-600"><FaLock className="text-xs" /></div>
      <div className="absolute bottom-3 left-3 bg-brand-primary/10 text-brand-primary text-[10px] px-2 py-1 rounded font-bold uppercase">{category}</div>
    </div>
    <div className="p-5">
      <h4 className="text-white font-bold text-sm mb-3 group-hover:text-brand-primary transition-colors">{title}</h4>
      <div className="grid grid-cols-2 gap-y-2 mb-4 text-[10px] text-gray-500">
        <div className="flex items-center gap-1"><FaPlay className="text-[8px]" /> {lectures} lectures</div>
        <div className="flex items-center gap-1"><FaClock /> {hours} hrs</div>
        <div className="flex items-center gap-1"><FaUsers /> {students}</div>
        <div className="flex items-center gap-1"><FaStar className="text-yellow-500" /> {rating}</div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-white font-bold text-lg">₹{price}</span>
        <button className="bg-brand-primary text-dark-400 text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-brand-primaryDark transition-all">Enroll Now</button>
      </div>
    </div>
  </div>
);

export default CourseBrowseCard;