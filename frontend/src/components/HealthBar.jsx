export default function HealthBar({ percentage = 0, threshold = 75 }) {
  const getColor = (pct) => {
    if (pct >= threshold) return { bar: 'linear-gradient(90deg, #10b981, #06b6d4)', text: '#10b981' };
    if (pct >= 60) return { bar: 'linear-gradient(90deg, #f59e0b, #f97316)', text: '#f59e0b' };
    return { bar: 'linear-gradient(90deg, #f43f5e, #ef4444)', text: '#f43f5e' };
  };

  const colorScheme = getColor(percentage);
  const clampedPct = Math.min(100, Math.max(0, percentage));

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.title}>Attendance Health</span>
        <span style={{ ...styles.pct, color: colorScheme.text }}>{clampedPct.toFixed(1)}%</span>
      </div>

      <div style={styles.trackOuter}>
        {/* Threshold marker */}
        <div style={{ ...styles.threshold, left: `${threshold}%` }}>
          <div style={styles.thresholdLine} />
          <span style={styles.thresholdLabel}>{threshold}%</span>
        </div>

        {/* Fill bar */}
        <div
          style={{
            ...styles.fill,
            width: `${clampedPct}%`,
            background: colorScheme.bar,
            boxShadow: `0 0 15px ${colorScheme.text}40`,
          }}
        />
      </div>

      <div style={styles.footer}>
        <span style={{ color: '#f43f5e', fontSize: '0.7rem', fontWeight: 500 }}>Danger &lt;60%</span>
        <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 500 }}>Warning 60-75%</span>
        <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 500 }}>Safe &gt;75%</span>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { width: '100%' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#f0f4ff',
  },
  pct: {
    fontSize: '1.25rem',
    fontWeight: 800,
  },
  trackOuter: {
    position: 'relative',
    width: '100%',
    height: '12px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '999px',
    overflow: 'visible',
  },
  fill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    zIndex: 1,
  },
  threshold: {
    position: 'absolute',
    top: '-6px',
    transform: 'translateX(-50%)',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  thresholdLine: {
    width: '2px',
    height: '24px',
    background: 'rgba(255,255,255,0.3)',
    borderRadius: '1px',
  },
  thresholdLabel: {
    fontSize: '0.65rem',
    color: '#8b95b3',
    marginTop: '2px',
    fontWeight: 600,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
  },
};
