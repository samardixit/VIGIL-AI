import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginStudent, loginFaculty } from '../services/api';

export default function LoginPage() {
  const [role, setRole]           = useState('student');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (role === 'student') {
        res = await loginStudent(studentId);
      } else {
        res = await loginFaculty(email, password);
      }
      const { access_token, role: userRole, user: userData } = res.data;
      login(access_token, { role: userRole, user: userData, name: `${userData.first_name} ${userData.last_name}` });
      navigate(userRole === 'faculty' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0B1020' }}>

      {/* Subtle bg gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #3B82F6, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col lg:flex-row items-center gap-16">

        {/* ── Left: Branding ─────────────────────────────── */}
        <div className="flex-1 max-w-sm animate-fade-in-up">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <ShieldIcon />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">VIGIL-AI</span>
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight leading-snug mb-3">
            Secure attendance<br />for modern classrooms
          </h1>
          <p className="text-sm text-gray-500 mb-10 leading-relaxed">
            GPS geofencing and biometric face verification in one seamless flow.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-4">
            {[
              { icon: <MapPinIcon />, label: 'GPS Geofencing', desc: '20m radius classroom boundary' },
              { icon: <FaceIcon />,   label: 'Face Verification', desc: 'DeepFace biometric matching' },
              { icon: <BoltIcon />,   label: 'Real-time Feed',  desc: 'Live WebSocket attendance events' },
              { icon: <BotIcon />,    label: 'AI Assistant',    desc: 'Gemini-powered classroom chatbot' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-300">{label}</div>
                  <div className="text-xs text-gray-600">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Auth Card ────────────────────────────── */}
        <div className="flex-1 w-full max-w-sm animate-scale-in">
          <div className="card-static rounded-2xl p-8">

            <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
            <p className="text-xs text-gray-500 mb-6">Select your role to continue</p>

            {/* Role Toggle */}
            <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {[
                { value: 'student', label: 'Student' },
                { value: 'faculty', label: 'Faculty' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setRole(value); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    role === value
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {role === 'student' ? (
                <div>
                  <label className="input-label">Student ID</label>
                  <input
                    id="student-id-input"
                    className="input"
                    type="text"
                    placeholder="e.g. STU001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="input-label">Email</label>
                    <input
                      id="email-input"
                      className="input"
                      type="email"
                      placeholder="faculty@vigil.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Password</label>
                    <input
                      id="password-input"
                      className="input"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-red-400 bg-red-500/[0.08] border border-red-500/20">
                  <WarningIcon />
                  <span>{error}</span>
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                className="btn-primary btn-lg w-full mt-1 rounded-xl"
                disabled={loading}
              >
                {loading
                  ? <span className="spinner" />
                  : `Continue as ${role === 'student' ? 'Student' : 'Faculty'}`}
              </button>
            </form>

            {/* Demo hint */}
            <div className="mt-5 pt-5 border-t border-white/[0.06]">
              <div className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wider">Demo credentials</div>
              {role === 'student' ? (
                <div className="text-xs text-gray-500">
                  Student ID: <span className="text-gray-300 font-mono">STU001</span>
                </div>
              ) : (
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Email: <span className="text-gray-300 font-mono">arjun.mehta@vigil.edu</span></div>
                  <div>Password: <span className="text-gray-300 font-mono">teacher123</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────── */
function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function FaceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function BotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M12 11V3" /><circle cx="12" cy="3" r="1" />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
