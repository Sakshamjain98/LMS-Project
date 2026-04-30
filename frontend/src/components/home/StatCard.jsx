export default function StatCard({ title, value, icon }) {
  return (
    <div
      className="bg-dark-200 p-5 rounded-xl border border-dark-100 flex items-center justify-between"
    >
      <div>
        <p className="text-grayCustom-medium text-sm">{title}</p>
        <h2 className="text-2xl font-bold mt-1">{value}</h2>
      </div>

      <div className="text-brand-primary text-2xl">
        {icon}
      </div>
    </div>
  );
}