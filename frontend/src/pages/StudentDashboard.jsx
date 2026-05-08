import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentDashboard, getActiveSessions } from '../services/api';
import StatsCard from '../components/StatsCard';
import HealthBar from '../components/HealthBar';
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

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, sessRes] = await Promise.all([
        getStudentDashboard(studentId),
        getActiveSessions(),
      ]);
      setDashboard(dashRes.data);
      setActiveSessions(sessRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const stats = dashboard?.stats || { total_sessions: 0, attended: 0, missed: 0, percentage: 0 };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8 animate-fade-in-up">
          <div>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Student Portal</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {dashboard?.student?.name || 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {dashboard?.student?.department}
              {dashboard?.student?.semester && ` · Semester ${dashboard.student.semester}`}
            </p>
          </div>
          {activeSessions.length > 0 && (
            <button id="mark-attendance-btn" onClick={() => navigate('/scan')}
              className="btn-primary btn-lg rounded-xl flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Mark Attendance
            </button>
          )}
        </div>

        {/* Active session banner */}
        {activeSessions.length > 0 && (
          <div className="mb-6 animate-fade-in-up flex items-center gap-4 px-5 py-3.5 rounded-xl border"
            style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.15)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"
                style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              <span className="text-sm font-semibold text-emerald-400">Active Session</span>
            </div>
            <p className="text-sm text-gray-500 flex-1 truncate">
              {activeSessions[0].subject_name}
              {activeSessions[0].faculty_name && ` · ${activeSessions[0].faculty_name}`}
            </p>
            <button onClick={() => navigate('/scan')}
              className="btn-success btn-sm rounded-lg text-xs flex-shrink-0">
              Scan Now →
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
          <StatsCard
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
            value={stats.total_sessions} label="Total Classes" color="blue" />
          <StatsCard
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            value={stats.attended} label="Attended" color="green" />
          <StatsCard
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
            value={stats.missed} label="Missed" color="rose" />
          <StatsCard
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>}
            value={`${stats.percentage}%`} label="Attendance Rate"
            color={stats.percentage >= 75 ? 'green' : stats.percentage >= 60 ? 'amber' : 'rose'} />
        </div>

        {/* Health bar */}
        <div className="card-static rounded-xl p-5 mb-6 animate-fade-in-up">
          <HealthBar percentage={stats.percentage} threshold={75} />
        </div>

        {/* Activity + Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent activity */}
          <div className="lg:col-span-2 card-static rounded-xl p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-200">Recent Activity</h2>
              <span className="text-xs text-gray-600">
                {(dashboard?.recent_activity || []).length} records
              </span>
            </div>

            {(dashboard?.recent_activity || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">No attendance records yet</p>
                <p className="text-xs text-gray-600">Scan into a class to see your records here</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/[0.04]">
                {dashboard.recent_activity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                      item.marked_by === 'biometric'
                        ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                        : 'bg-violet-500/10 border border-violet-500/20 text-violet-400'
                    }`}>
                      {item.marked_by === 'biometric' ? '◉' : '✋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{item.subject}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {item.faculty && `${item.faculty} · `}
                        {item.marked_by === 'biometric' ? 'Biometric' : 'Manual'}
                        {item.confidence && ` · ${(item.confidence * 100).toFixed(0)}%`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="badge badge-green">Present</span>
                      <span className="text-xs text-gray-600">
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Feed */}
          <div className="card-static rounded-xl p-5 animate-fade-in-up">
            <StatusFeed />
          </div>
        </div>
      </div>

      <ChatbotSidebar />
    </>
  );
}
