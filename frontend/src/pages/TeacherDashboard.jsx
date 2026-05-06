import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getTeacherDashboard, startSession, endSession as endSessionApi,
  getStudents, manualAttendance, getSessionAttendance,
} from '../services/api';
import StatsCard from '../components/StatsCard';
import StatusFeed from '../components/StatusFeed';
import ChatbotSidebar from '../components/ChatbotSidebar';
import Navbar from '../components/Navbar';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [gpsStatus, setGpsStatus] = useState('');
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualMsg, setManualMsg] = useState('');
  const [sessionAttendance, setSessionAttendance] = useState([]);

  const facultyId = user?.user?.faculty_id || 'FAC001';

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, stuRes] = await Promise.all([
        getTeacherDashboard(facultyId),
        getStudents(),
      ]);
      setDashboard(dashRes.data);
      setStudents(stuRes.data);

      if (dashRes.data.active_session) {
        const attRes = await getSessionAttendance(dashRes.data.active_session.id);
        setSessionAttendance(attRes.data);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!subjectName.trim()) return;
    setSessionLoading(true);
    setGpsStatus('📍 Getting GPS location...');

    try {
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10000,
        });
      });

      setGpsStatus('✅ Location acquired');

      await startSession({
        subject_name: subjectName,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      setSubjectName('');
      setGpsStatus('');
      loadDashboard();
    } catch (err) {
      setGpsStatus(`❌ ${err.message || 'Failed to get location'}`);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!dashboard?.active_session?.id) return;
    setSessionLoading(true);
    try {
      await endSessionApi(dashboard.active_session.id);
      loadDashboard();
    } catch (err) {
      console.error('End session error:', err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleManualAttendance = async (stuId) => {
    if (!dashboard?.active_session?.id) return;
    try {
      const res = await manualAttendance({
        session_id: dashboard.active_session.id,
        student_id: stuId,
      });
      setManualMsg(res.data.message);
      loadDashboard();
      setTimeout(() => setManualMsg(''), 3000);
    } catch (err) {
      setManualMsg(err.response?.data?.detail || 'Failed');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSession = dashboard?.active_session;

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

  return (
    <>
      <Navbar />
      <div className="animated-bg" />

      <div className="page-container">
        {/* Header */}
        <div className="animate-fade-in-up" style={styles.header}>
          <div>
            <h1 style={styles.title}>
              <span className="text-gradient">{dashboard?.faculty?.name || 'Teacher'}</span>'s Dashboard
            </h1>
            <p style={styles.subtitle}>{dashboard?.faculty?.department}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3 stagger" style={{ marginTop: '24px' }}>
          <StatsCard icon="🎓" value={dashboard?.total_students || 0} label="Total Students" color="blue" />
          <StatsCard icon="📚" value={dashboard?.total_sessions || 0} label="Total Sessions" color="violet" />
          <StatsCard
            icon={activeSession ? '🟢' : '🔴'}
            value={activeSession ? 'Active' : 'Inactive'}
            label="Session Status"
            color={activeSession ? 'emerald' : 'rose'}
          />
        </div>

        {/* Session Control + Live Feed */}
        <div style={styles.twoCol}>
          {/* Session Control */}
          <div className="glass-card animate-fade-in-up" style={{ padding: '24px', flex: 1 }}>
            <h3 style={styles.sectionTitle}>🎯 Session Control</h3>

            {activeSession ? (
              <div>
                <div style={styles.activeInfo}>
                  <div style={styles.activeDot} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>{activeSession.subject_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8b95b3' }}>
                      Started: {new Date(activeSession.session_start).toLocaleTimeString()}
                      {' • '}{activeSession.attendance_count} students scanned
                    </div>
                  </div>
                </div>

                {/* Timer */}
                <SessionTimer startTime={activeSession.session_start} />

                <button
                  className="btn btn-danger w-full"
                  style={{ marginTop: '16px' }}
                  onClick={handleEndSession}
                  disabled={sessionLoading}
                  id="end-session-btn"
                >
                  {sessionLoading ? 'Ending...' : '⏹ End Session'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="input-label">Subject Name</label>
                  <input
                    id="subject-input"
                    className="input-field"
                    placeholder="e.g. Data Structures"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                  />
                </div>

                {gpsStatus && (
                  <div style={{ fontSize: '0.8rem', color: '#8b95b3', marginBottom: '12px' }}>
                    {gpsStatus}
                  </div>
                )}

                <button
                  className="btn btn-success w-full"
                  onClick={handleStartSession}
                  disabled={sessionLoading || !subjectName.trim()}
                  id="start-session-btn"
                >
                  {sessionLoading ? 'Starting...' : '▶ Start Class Session'}
                </button>
              </div>
            )}
          </div>

          {/* Live Feed */}
          <div className="glass-card animate-fade-in-up" style={{ padding: '24px', flex: 1 }}>
            <StatusFeed />
          </div>
        </div>

        {/* Manual Override + Attendance List */}
        {activeSession && (
          <div style={styles.twoCol}>
            {/* Manual Override */}
            <div className="glass-card animate-fade-in-up" style={{ padding: '24px', flex: 1 }}>
              <h3 style={styles.sectionTitle}>✋ Manual Override</h3>
              <input
                className="input-field"
                placeholder="Search student by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ marginBottom: '12px' }}
                id="student-search"
              />

              {manualMsg && (
                <div style={styles.manualMsg}>{manualMsg}</div>
              )}

              <div style={styles.studentList}>
                {filteredStudents.slice(0, 10).map((s) => {
                  const alreadyMarked = sessionAttendance.some(
                    (a) => a.student_id === s.student_id
                  );
                  return (
                    <div key={s.student_id} style={styles.studentRow}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {s.first_name} {s.last_name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#8b95b3' }}>
                          {s.student_id} • {s.department}
                        </div>
                      </div>
                      {alreadyMarked ? (
                        <span className="badge badge-green">✓ Present</span>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleManualAttendance(s.student_id)}
                        >
                          Mark Present
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Session Attendance */}
            <div className="glass-card animate-fade-in-up" style={{ padding: '24px', flex: 1 }}>
              <h3 style={styles.sectionTitle}>📋 Session Attendance ({sessionAttendance.length})</h3>
              <div style={styles.attList}>
                {sessionAttendance.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#8b95b3' }}>
                    No students have scanned yet
                  </div>
                ) : (
                  sessionAttendance.map((a, i) => (
                    <div key={i} style={styles.attItem}>
                      <div style={{ fontSize: '1.1rem' }}>
                        {a.marked_by === 'biometric' ? '🔬' : '✋'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.student_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#8b95b3' }}>
                          {a.student_id} • {a.marked_by}
                          {a.confidence && ` • ${(a.confidence * 100).toFixed(0)}%`}
                        </div>
                      </div>
                      <span className="badge badge-green">Present</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Session History */}
        <div className="glass-card animate-fade-in-up" style={{ padding: '24px', marginTop: '24px' }}>
          <h3 style={styles.sectionTitle}>📚 Session History</h3>
          <div style={styles.historyList}>
            {(dashboard?.session_history || []).map((s, i) => (
              <div key={i} style={styles.historyItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.subject_name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#8b95b3' }}>
                    {s.session_start ? new Date(s.session_start).toLocaleString() : '—'}
                  </div>
                </div>
                <span className="badge badge-blue">{s.attendance_count} students</span>
                <span className={`badge ${s.is_active ? 'badge-green' : 'badge-amber'}`}>
                  {s.is_active ? 'Active' : 'Ended'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ChatbotSidebar />
    </>
  );
}

/* 10-minute countdown timer component */
function SessionTimer({ startTime }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(startTime).getTime();
      const windowEnd = start + 10 * 60 * 1000;
      const now = Date.now();
      const diff = windowEnd - now;

      if (diff <= 0) {
        setRemaining('Window closed');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const isExpired = remaining === 'Window closed';

  return (
    <div style={{
      marginTop: '12px',
      padding: '10px 14px',
      background: isExpired ? 'rgba(244,63,94,0.08)' : 'rgba(0,212,255,0.06)',
      borderRadius: '10px',
      border: `1px solid ${isExpired ? 'rgba(244,63,94,0.15)' : 'rgba(0,212,255,0.1)'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{ fontSize: '0.75rem', color: '#8b95b3' }}>Attendance Window</span>
      <span style={{
        fontSize: '1.1rem',
        fontWeight: 700,
        fontFamily: 'monospace',
        color: isExpired ? '#f43f5e' : '#00d4ff',
      }}>
        {remaining}
      </span>
    </div>
  );
}

const styles = {
  loadingWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '60vh',
  },
  header: { marginBottom: '8px' },
  title: { fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' },
  subtitle: { fontSize: '0.9rem', color: '#8b95b3', marginTop: '4px' },
  twoCol: { display: 'flex', gap: '20px', marginTop: '24px', flexWrap: 'wrap' },
  sectionTitle: { fontSize: '1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: '16px' },
  activeInfo: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px', background: 'rgba(16,185,129,0.06)',
    borderRadius: '10px', border: '1px solid rgba(16,185,129,0.12)',
  },
  activeDot: {
    width: '10px', height: '10px', borderRadius: '50%',
    background: '#10b981', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0,
  },
  manualMsg: {
    padding: '8px 12px', fontSize: '0.8rem', color: '#10b981',
    background: 'rgba(16,185,129,0.06)', borderRadius: '8px', marginBottom: '12px',
  },
  studentList: { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' },
  studentRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  attList: { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' },
  attItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
  },
  historyList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  historyItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
  },
};
