export default function HealthBar({ percentage = 0, threshold = 75 }) {
  const clamped = Math.min(100, Math.max(0, percentage));

  const getScheme = (pct) => {
    if (pct >= threshold) return { bar: 'from-emerald-500 to-emerald-400', text: 'text-emerald-400', label: 'Healthy', labelColor: 'text-emerald-400' };
    if (pct >= 60)        return { bar: 'from-amber-500 to-amber-400',   text: 'text-amber-400',   label: 'At Risk',  labelColor: 'text-amber-400'  };
    return                       { bar: 'from-red-500 to-red-400',        text: 'text-red-400',     label: 'Critical', labelColor: 'text-red-400'    };
  };

  const scheme = getScheme(clamped);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-gray-200">Attendance Health</span>
          <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${
            clamped >= threshold
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : clamped >= 60
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>{scheme.label}</span>
        </div>
        <span className={`text-xl font-bold tracking-tight ${scheme.text}`}>
          {clamped.toFixed(1)}%
        </span>
      </div>

      {/* Progress track */}
      <div className="relative w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/20 z-10"
          style={{ left: `${threshold}%` }}
        />
        {/* Fill */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${scheme.bar} transition-all duration-1000 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-xs text-red-400/70">Danger &lt;60%</span>
        <span className="text-xs text-gray-600">Threshold: {threshold}%</span>
        <span className="text-xs text-emerald-400/70">Safe &gt;{threshold}%</span>
      </div>
    </div>
  );
}
