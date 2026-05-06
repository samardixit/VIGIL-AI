export default function StatsCard({ icon, value, label, trend, color = 'blue' }) {
  const colorMap = {
    blue: { accent: '#00d4ff', glow: 'rgba(0,212,255,0.1)', bg: 'rgba(0,212,255,0.08)' },
    violet: { accent: '#7c3aed', glow: 'rgba(124,58,237,0.1)', bg: 'rgba(124,58,237,0.08)' },
    emerald: { accent: '#10b981', glow: 'rgba(16,185,129,0.1)', bg: 'rgba(16,185,129,0.08)' },
    amber: { accent: '#f59e0b', glow: 'rgba(245,158,11,0.1)', bg: 'rgba(245,158,11,0.08)' },
    rose: { accent: '#f43f5e', glow: 'rgba(244,63,94,0.1)', bg: 'rgba(244,63,94,0.08)' },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="glass-card animate-fade-in-up" style={styles.card}>
      <div style={{ ...styles.iconWrap, background: c.bg, boxShadow: `0 0 20px ${c.glow}` }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      <div style={styles.content}>
        <div style={{ ...styles.value, color: c.accent }}>{value}</div>
        <div style={styles.label}>{label}</div>
        {trend !== undefined && (
          <div style={{ ...styles.trend, color: trend >= 0 ? '#10b981' : '#f43f5e' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  iconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1 },
  value: {
    fontSize: '1.75rem',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#8b95b3',
    marginTop: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  trend: {
    fontSize: '0.75rem',
    fontWeight: 600,
    marginTop: '4px',
  },
};
