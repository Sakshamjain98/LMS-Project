export default function Card({ children, className }) {
    return (
      <div
        className={`bg-dark-200 border border-dark-100 rounded-xl p-6 shadow-lg ${className}`}
      >
        {children}
      </div>
    );
  }