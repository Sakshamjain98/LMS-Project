import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: "bg-brand-primary hover:bg-brand-primaryDark text-dark-400",
    outline: "border border-white/10 hover:bg-dark-100 text-white",
    ghost: "text-brand-primary hover:bg-brand-primary/10"
  };

  return (
    <button 
      className={`px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;