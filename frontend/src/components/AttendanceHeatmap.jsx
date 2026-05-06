import { useMemo } from 'react';

/**
 * GitHub-style attendance heatmap.
 * Shows a grid of 7 rows (days) × ~52 columns (weeks) for the past year.
 */
export default function AttendanceHeatmap({ data = {} }) {
  const { weeks, months } = useMemo(() => {
    const today = new Date();
    const oneDay = 86400000;
    const totalDays = 364;
    const startDate = new Date(today.getTime() - totalDays * oneDay);

    // Adjust to start on Sunday
    const startDow = startDate.getDay();
    const adjustedStart = new Date(startDate.getTime() - startDow * oneDay);

    const weeks = [];
    let currentWeek = [];
    const monthLabels = [];
    let lastMonth = -1;

    for (let i = 0; i <= totalDays + startDow; i++) {
      const d = new Date(adjustedStart.getTime() + i * oneDay);
      const key = d.toISOString().split('T')[0];
      const count = data[key] || 0;

      // Track month labels
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        monthLabels.push({
          label: d.toLocaleString('default', { month: 'short' }),
          week: weeks.length,
        });
      }

      currentWeek.push({ date: key, count, day: d.getDay() });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { weeks, months: monthLabels };
  }, [data]);

  const getColor = (count) => {
    if (count === 0) return 'rgba(255,255,255,0.04)';
    if (count === 1) return 'rgba(0, 212, 255, 0.25)';
    if (count === 2) return 'rgba(0, 212, 255, 0.45)';
    if (count === 3) return 'rgba(0, 212, 255, 0.65)';
    return 'rgba(0, 212, 255, 0.85)';
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>📅 Attendance Heatmap</span>
        <div style={styles.legend}>
          <span style={styles.legendText}>Less</span>
          {[0, 1, 2, 3, 4].map((n) => (
            <div key={n} style={{ ...styles.legendCell, background: getColor(n) }} />
          ))}
          <span style={styles.legendText}>More</span>
        </div>
      </div>

      {/* Month labels */}
      <div style={styles.monthRow}>
        <div style={{ width: '30px' }} />
        {months.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.monthLabel,
              gridColumnStart: m.week + 1,
            }}
          >
            {m.label}
          </div>
        ))}
      </div>

      <div style={styles.gridWrapper}>
        {/* Day labels */}
        <div style={styles.dayLabels}>
          {dayLabels.map((label, i) => (
            <div key={i} style={styles.dayLabel}>{label}</div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div style={styles.grid}>
          {weeks.map((week, wi) => (
            <div key={wi} style={styles.column}>
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${day.date}: ${day.count} class${day.count !== 1 ? 'es' : ''}`}
                  style={{
                    ...styles.cell,
                    background: getColor(day.count),
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    overflowX: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#f0f4ff',
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  legendText: {
    fontSize: '0.65rem',
    color: '#8b95b3',
    marginRight: '4px',
  },
  legendCell: {
    width: '10px',
    height: '10px',
    borderRadius: '2px',
  },
  monthRow: {
    display: 'flex',
    marginBottom: '4px',
    position: 'relative',
  },
  monthLabel: {
    fontSize: '0.65rem',
    color: '#8b95b3',
    position: 'absolute',
  },
  gridWrapper: {
    display: 'flex',
    gap: '4px',
    marginTop: '16px',
  },
  dayLabels: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    width: '30px',
    flexShrink: 0,
  },
  dayLabel: {
    height: '12px',
    fontSize: '0.6rem',
    color: '#8b95b3',
    display: 'flex',
    alignItems: 'center',
  },
  grid: {
    display: 'flex',
    gap: '2px',
    flex: 1,
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  cell: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
};
