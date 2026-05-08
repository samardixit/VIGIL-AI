export default function StatsCard({ icon, value, label, color = 'blue', sub }) {
  const colorMap = {
    blue:   { icon: 'text-blue-400',    bg: 'bg-blue-500/[0.08]',    border: 'border-blue-500/[0.12]' },
    green:  { icon: 'text-emerald-400', bg: 'bg-emerald-500/[0.08]', border: 'border-emerald-500/[0.12]' },
    emerald:{ icon: 'text-emerald-400', bg: 'bg-emerald-500/[0.08]', border: 'border-emerald-500/[0.12]' },
    amber:  { icon: 'text-amber-400',   bg: 'bg-amber-500/[0.08]',   border: 'border-amber-500/[0.12]' },
    rose:   { icon: 'text-red-400',     bg: 'bg-red-500/[0.08]',     border: 'border-red-500/[0.12]' },
    violet: { icon: 'text-violet-400',  bg: 'bg-violet-500/[0.08]',  border: 'border-violet-500/[0.12]' },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="card p-5 flex items-start gap-4 animate-fade-in-up">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${c.bg} ${c.border}`}>
        <span className={`text-lg ${c.icon}`}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-white tracking-tight leading-none mb-1">{value}</div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</div>
        {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
