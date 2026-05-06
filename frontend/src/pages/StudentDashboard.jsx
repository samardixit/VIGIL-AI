import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentDashboard, getActiveSessions } from '../services/api';
import StatsCard from '../components/StatsCard';
import HealthBar from '../components/HealthBar';
import AttendanceHeatmap from '../components/AttendanceHeatmap';
import StatusFeed from '../components/StatusFeed';
import ChatbotSidebar from '../components/ChatbotSidebar';
import Navbar from '../components/Navbar';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentId = user?.user?.student_id || 'STU001';

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, sessRes] = await Promise.all([
        getStudentDashboard(studentId),
        getActiveSessions(),
      ]);
      setDashboard(dashRes.data);
      setActiveSessions(sessRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.loadingWrap}>
          <div className="spinner" />
          <p style={{ color: '#8b95b3', marginTop: '16px' }}>Loading dashboard...</p>
        </div>
      </>
    );
  }

  const stats = dashboard?.stats || { total_sessions: 0, attended: 0, missed: 0, percentage: 0 };

  return (
    <>
      <Navbar />
      <div className="animated-bg" />

      <div className="page-container">
        {/* Welcome Header */}
        <div className="animate-fade-in-up" style={styles.welcomeSection}>
          <div>
            <h1 style={styles.welcomeTitle}>
              Welcome back, <span className="text-gradient">{dashboard?.student?.name || 'Student'}</span>
            </h1>
            <p style={styles.welcomeSub}>
              {dashboard?.student?.department} • Semester {dashboard?.student?.semester}
            </p>
          </div>

          {activeSessions.length > 0 && (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/scan')}
              id="mark-attendance-btn"
            >
              📷 Mark Attendance
            </button>
          )}
        </div>

        {/* Active Session Alert */}
        {activeSessions.length > 0 && (
          <div className="animate-fade-in-up" style={styles.activeAlert}>
            <div style={styles.alertPulse} />
            <div>
              <div style={styles.alertTitle}>🟢 Active Session Available</div>
              <div style={styles.alertText}>
                {activeSessions[0].subject_name} — {activeSessions[0].faculty_name}
              </div>
            </div>
            <button className="btn btn-success btn-sm" onClick={() => navigate('/scan')}>
              Scan Now →
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid-4 stagger" style={{ marginTop: '24px' }}>
          <StatsCard icon="📚" value={stats.total_sessions} label="Total Classes" color="blue" />
          <StatsCard icon="✅" value={stats.attended} label="Attended" color="emerald" />
          <StatsCard icon="❌" value={stats.missed} label="Missed" color="rose" />
          <StatsCard
            icon="📊"
            value={`${stats.percentage}%`}
            label="Attendance Rate"
            color={stats.percentage >= 75 ? 'emerald' : stats.percentage >= 60 ? 'amber' : 'rose'}
          />
        </div>

        {/* Health Bar */}
        <div className="glass-card animate-fade-in-up" style={{ padding: '24px', marginTop: '24px' }}>
          <HealthBar percentage={stats.percentage} threshold={75} />
        </div>

        {/* Heatmap + Live Feed */}
        <div style={styles.twoCol}>
          <div className="glass-card animate-fade-in-up" style={{ padding: '24px', flex: 2 }}>
            <AttendanceHeatmap data={dashboard?.heatmap || {}} />
          </div>
          <div className="glass-card animate-fade-in-up" style={{ padding: '24px', flex: 1 }}>
            <StatusFeed />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card animate-fade-in-up" style={{ padding: '24px', marginTop: '24px' }}>
          <h3 style={styles.sectionTitle}>📋 Recent Activity</h3>
          <div style={styles.activityList}>
            {(dashboard?.recent_activity || []).length === 0 ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: '2rem' }}>📭</span>
                <p style={{ color: '#8b95b3' }}>No attendance records yet</p>
              </div>
            ) : (
              dashboard.recent_activity.map((item, i) => (
                <div key={i} style={styles.activityItem}>
                  <div style={styles.activityIcon}>
                    {item.marked_by === 'biometric' ? '🔬' : '✋'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.activitySubject}>{item.subject}</div>
                    <div style={styles.activityMeta}>
                      {item.faculty} • {item.marked_by}
                      {item.confidence && ` • ${(item.confidence * 100).toFixed(0)}% match`}
                    </div>
                  </div>
                  <div style={styles.activityTime}>
                    {item.timestamp
                      ? new Date(item.timestamp).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ChatbotSidebar />
    </>
  );
}

const styles = {
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  welcomeSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  welcomeTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  welcomeSub: {
    fontSize: '0.9rem',
    color: '#8b95b3',
    marginTop: '4px',
  },
  activeAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    marginTop: '20px',
    background: 'rgba(16, 185, 129, 0.06)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '12px',
  },
  alertPulse: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#10b981',
    animation: 'pulse 1.5s ease-in-out infinite',
    flexShrink: 0,
  },
  alertTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#10b981',
  },
  alertText: {
    fontSize: '0.8rem',
    color: '#8b95b3',
  },
  twoCol: {
    display: 'flex',
    gap: '20px',
    marginTop: '24px',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#f0f4ff',
    marginBottom: '16px',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  activityIcon: { fontSize: '1.25rem' },
  activitySubject: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#f0f4ff',
  },
  activityMeta: {
    fontSize: '0.7rem',
    color: '#8b95b3',
    marginTop: '2px',
  },
  activityTime: {
    fontSize: '0.7rem',
    color: '#8b95b3',
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
};
