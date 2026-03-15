import React from 'react';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';

const TestimonialCard = ({ name, role, text, avatarColor, tag }) => (
  <div className="bg-dark-200 border border-white/5 p-6 rounded-2xl flex flex-col h-full">
    <FaQuoteLeft className="text-brand-primary/30 text-3xl mb-4" />
    <p className="text-gray-400 text-sm leading-relaxed mb-6 italic">"{text}"</p>
    <div className="mt-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-dark-400 ${avatarColor}`}>
          {name.charAt(0)}
        </div>
        <div>
          <h5 className="text-white text-sm font-bold">{name}</h5>
          <p className="text-gray-500 text-[10px]">{role}</p>
        </div>
      </div>
      <div className="flex text-yellow-500 text-[10px]"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div>
    </div>
    <div className="mt-4 inline-block bg-brand-primary/10 text-brand-primary text-[9px] px-2 py-1 rounded w-fit">
      {tag}
    </div>
  </div>
);

export default TestimonialCard;