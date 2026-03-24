export default function TestStatCard({ icon, title, value }) {
  return (
    <div className="bg-dark-200 border border-dark-100 rounded-xl p-5 flex items-center gap-4">
      <div className="p-3 bg-dark-100 rounded-lg text-brand-primary">{icon}</div>
      <div>
        <p className="text-sm text-grayCustom-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}