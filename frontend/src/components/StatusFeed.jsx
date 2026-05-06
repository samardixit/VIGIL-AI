import { useState, useEffect } from 'react';
import wsService from '../services/websocket';

/**
 * Real-time WebSocket feed showing students scanning in.
 */
export default function StatusFeed() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsub = wsService.subscribe((data) => {
      if (data.type === 'attendance_marked') {
        setEvents((prev) => [data, ...prev].slice(0, 50)); // Keep last 50
      }
    });
    wsService.connect('global');

    return () => {
      unsub();
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>⚡ Live Feed</span>
        <div style={styles.liveIndicator}>
          <div style={styles.liveDot} />
          <span style={styles.liveText}>LIVE</span>
        </div>
      </div>

      <div style={styles.feed}>
        {events.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: '2rem' }}>📡</span>
            <p style={styles.emptyText}>Waiting for attendance events...</p>
          </div>
        ) : (
          events.map((event, i) => (
            <div key={i} className="animate-slide-right" style={styles.event}>
              <div style={styles.eventIcon}>
                {event.method === 'biometric' ? '🔬' : '✋'}
              </div>
              <div style={styles.eventInfo}>
                <div style={styles.eventName}>{event.student_name}</div>
                <div style={styles.eventMeta}>
                  <span>{event.student_id}</span>
                  <span>•</span>
                  <span>{event.method === 'biometric' ? 'Face Scan' : 'Manual'}</span>
                  {event.confidence && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#10b981' }}>
                        {(event.confidence * 100).toFixed(0)}% match
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div style={styles.eventTime}>
                {event.timestamp
                  ? new Date(event.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'now'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { width: '100%' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#f0f4ff',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    background: 'rgba(244, 63, 94, 0.12)',
    borderRadius: '999px',
    border: '1px solid rgba(244, 63, 94, 0.2)',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#f43f5e',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  liveText: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#f43f5e',
    letterSpacing: '0.05em',
  },
  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  emptyText: {
    color: '#8b95b3',
    fontSize: '0.8rem',
  },
  event: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  eventIcon: {
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  eventInfo: { flex: 1, minWidth: 0 },
  eventName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#f0f4ff',
  },
  eventMeta: {
    display: 'flex',
    gap: '6px',
    fontSize: '0.7rem',
    color: '#8b95b3',
    marginTop: '2px',
  },
  eventTime: {
    fontSize: '0.7rem',
    color: '#8b95b3',
    flexShrink: 0,
  },
};
