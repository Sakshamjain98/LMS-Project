import React from "react";
import { FaCheckCircle } from "react-icons/fa";

const PricingCard = ({
  title,
  subtitle,
  price,
  btnText,
  features,
  isPopular,
}) => {
  return (
    <div
      className={`
        relative p-8 rounded-2xl 
        border border-white/10
        bg-dark-200
        transition-all duration-500
        hover:-translate-y-3
        hover:scale-105
        hover:shadow-2xl
        hover:shadow-brand-primary/20
        group
        ${isPopular ? "scale-105 border-brand-primary" : ""}
      `}
    >
      {/* Popular Badge */}
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-primary text-white text-xs px-4 py-1 rounded-full">
          Most Popular
        </span>
      )}

      {/* Title */}
      <h3 className="text-2xl font-bold mb-2 text-white">
        {title}
      </h3>

      {/* Subtitle */}
      <p className="text-gray-400 text-sm mb-6">
        {subtitle}
      </p>

      {/* Price */}
      <div className="text-4xl font-bold text-brand-primary mb-6">
        ₹{price}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-300 text-sm">
            <FaCheckCircle className="text-brand-primary mr-3" />
            {feature}
          </li>
        ))}
      </ul>

      {/* Button */}
      <button
        className="
        w-full py-3 rounded-lg
        bg-brand-primary
        text-white font-semibold
        transition-all duration-300
        group-hover:bg-white
        group-hover:text-black
        "
      >
        {btnText}
      </button>
    </div>
  );
};

export default PricingCard;