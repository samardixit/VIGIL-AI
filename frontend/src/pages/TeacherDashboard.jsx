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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!subjectName.trim()) return;
    setSessionLoading(true);
    setGpsStatus('Getting GPS location…');
    try {
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      setGpsStatus('Location acquired');
      await startSession({ subject_name: subjectName, latitude: position.coords.latitude, longitude: position.coords.longitude });
      setSubjectName('');
      setGpsStatus('');
      loadDashboard();
    } catch (err) {
      setGpsStatus(`Error: ${err.message || 'Failed to get location'}`);
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
      console.error(err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleManualAttendance = async (stuId) => {
    if (!dashboard?.active_session?.id) return;
    try {
      const res = await manualAttendance({ session_id: dashboard.active_session.id, student_id: stuId });
      setManualMsg(res.data.message);
      loadDashboard();
      setTimeout(() => setManualMsg(''), 3000);
    } catch (err) {
      setManualMsg(err.response?.data?.detail || 'Failed');
    }
  };

  const filteredStudents = students.filter((s) =>
    s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSession = dashboard?.active_session;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="spinner w-6 h-6" />
          <p className="text-sm text-gray-600">Loading dashboard…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Faculty Portal</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {dashboard?.faculty?.name || 'Teacher Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{dashboard?.faculty?.department}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 stagger">
          <StatsCard
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            value={dashboard?.total_students || 0} label="Total Students" color="blue" />
          <StatsCard
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            value={dashboard?.total_sessions || 0} label="Sessions Run" color="violet" />
          <StatsCard
            icon={activeSession
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
            value={activeSession ? 'Active' : 'Inactive'}
            label="Session Status"
            color={activeSession ? 'green' : 'rose'} />
        </div>

        {/* Session Control + Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Session Control */}
          <div className="card-static rounded-xl p-5 animate-fade-in-up">
            <h2 className="text-sm font-semibold text-gray-200 mb-4">Session Control</h2>

            {activeSession ? (
              <div className="flex flex-col gap-4">
                {/* Active state */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"
                    style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-400 truncate">{activeSession.subject_name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Started {new Date(activeSession.session_start).toLocaleTimeString()} ·{' '}
                      {activeSession.attendance_count ?? sessionAttendance.length} scanned
                    </p>
                  </div>
                </div>
                <SessionTimer startTime={activeSession.session_start} />
                <button id="end-session-btn"
                  className="btn-danger w-full rounded-xl justify-center py-2.5"
                  onClick={handleEndSession} disabled={sessionLoading}>
                  {sessionLoading
                    ? <span className="spinner" />
                    : <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                        </svg>
                        End Session
                      </>}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="input-label">Subject Name</label>
                  <input id="subject-input" className="input" placeholder="e.g. Data Structures"
                    value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
                </div>
                {gpsStatus && (
                  <p className={`text-xs px-3 py-2 rounded-lg border ${
                    gpsStatus.startsWith('Error')
                      ? 'text-red-400 bg-red-500/[0.08] border-red-500/20'
                      : 'text-blue-400 bg-blue-500/[0.08] border-blue-500/20'
                  }`}>{gpsStatus}</p>
                )}
                <button id="start-session-btn"
                  className="btn-success w-full rounded-xl justify-center py-2.5"
                  onClick={handleStartSession} disabled={sessionLoading || !subjectName.trim()}>
                  {sessionLoading
                    ? <span className="spinner" />
                    : <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Start Class Session
                      </>}
                </button>
                {/* No-session empty state */}
                <div className="flex flex-col items-center text-center py-4 gap-2">
                  <p className="text-xs text-gray-600">No active session. Enter a subject name and start when ready.</p>
                </div>
              </div>
            )}
          </div>

          {/* Live Feed */}
          <div className="card-static rounded-xl p-5 animate-fade-in-up">
            <StatusFeed />
          </div>
        </div>

        {/* Manual Override + Attendance List (only when session active) */}
        {activeSession && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Manual Override */}
            <div className="card-static rounded-xl p-5 animate-fade-in-up">
              <h2 className="text-sm font-semibold text-gray-200 mb-4">Manual Override</h2>
              <input id="student-search" className="input mb-3"
                placeholder="Search by name or student ID…"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              {manualMsg && (
                <p className="text-xs text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/20 px-3 py-2 rounded-lg mb-3">
                  {manualMsg}
                </p>
              )}
              <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                {filteredStudents.slice(0, 12).map((s) => {
                  const marked = sessionAttendance.some((a) => a.student_id === s.student_id);
                  return (
                    <div key={s.student_id}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-200 truncate">
                          {s.first_name} {s.last_name}
                        </p>
                        <p className="text-xs text-gray-600">{s.student_id} · {s.department}</p>
                      </div>
                      {marked
                        ? <span className="badge badge-green">Present</span>
                        : <button className="btn-ghost btn-sm rounded-lg text-xs"
                            onClick={() => handleManualAttendance(s.student_id)}>
                            Mark Present
                          </button>}
                    </div>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-6">No students found</p>
                )}
              </div>
            </div>

            {/* Session Attendance Log */}
            <div className="card-static rounded-xl p-5 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-200">Session Attendance</h2>
                <span className="badge badge-blue">{sessionAttendance.length}</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                {sessionAttendance.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    <p className="text-sm text-gray-500">No students scanned yet</p>
                    <p className="text-xs text-gray-600">Waiting for attendance events…</p>
                  </div>
                ) : (
                  sessionAttendance.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                        a.marked_by === 'biometric'
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                          : 'bg-violet-500/10 border border-violet-500/20 text-violet-400'
                      }`}>
                        {a.marked_by === 'biometric' ? '◉' : '✋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-200">{a.student_name}</p>
                        <p className="text-xs text-gray-600">
                          {a.student_id} · {a.marked_by}
                          {a.confidence && ` · ${(a.confidence * 100).toFixed(0)}%`}
                        </p>
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
        <div className="card-static rounded-xl p-5 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Session History</h2>
          {(dashboard?.session_history || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <p className="text-sm text-gray-500">No sessions yet</p>
              <p className="text-xs text-gray-600">Start your first class session above</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {dashboard.session_history.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200">{s.subject_name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {s.session_start ? new Date(s.session_start).toLocaleString() : '—'}
                    </p>
                  </div>
                  <span className="badge badge-blue">{s.attendance_count ?? 0} students</span>
                  <span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>
                    {s.is_active ? 'Active' : 'Ended'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ChatbotSidebar />
    </>
  );
}

/* ── Session Timer ─────────────────────────────────────── */
function SessionTimer({ startTime }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = (new Date(startTime).getTime() + 10 * 60 * 1000) - Date.now();
      if (diff <= 0) {
        setRemaining('expired');
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemaining(`${m}:${String(s).padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const expired = remaining === 'expired';

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${
      expired
        ? 'bg-red-500/[0.08] border-red-500/20'
        : 'bg-white/[0.04] border-white/[0.06]'
    }`}>
      <span className="text-xs text-gray-500">Attendance Window</span>
      <span className={`text-base font-bold font-mono ${expired ? 'text-red-400' : 'text-blue-400'}`}>
        {expired ? 'Closed' : remaining}
      </span>
    </div>
  );
}
