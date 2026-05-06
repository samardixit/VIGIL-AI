import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginStudent, loginFaculty } from '../services/api';

export default function LoginPage() {
  const [role, setRole] = useState('student');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Animated background orbs */}
      <div className="animated-bg" />

      {/* Floating particles */}
      <div style={styles.particles}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.particle,
              width: `${40 + i * 20}px`,
              height: `${40 + i * 20}px`,
              top: `${10 + i * 15}%`,
              left: `${5 + i * 16}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${15 + i * 3}s`,
            }}
          />
        ))}
      </div>

      <div style={styles.container}>
        {/* Left branding */}
        <div style={styles.brandSide} className="animate-fade-in-up">
          <div style={styles.logoLarge}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="url(#loginGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 style={styles.brandTitle}>
            <span className="text-gradient">VIGIL-AI</span>
          </h1>
          <p style={styles.brandSub}>High-Security Student Attendance System</p>
          <div style={styles.features}>
            <FeatureItem icon="📍" text="GPS Geofencing (20m radius)" />
            <FeatureItem icon="🔬" text="Face Recognition with Liveness" />
            <FeatureItem icon="🤖" text="AI-Powered Chatbot" />
            <FeatureItem icon="📊" text="Real-time Analytics Dashboard" />
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-card animate-scale-in" style={styles.card}>
          <h2 style={styles.cardTitle}>Welcome Back</h2>
          <p style={styles.cardSub}>Sign in to continue</p>

          {/* Role Toggle */}
          <div style={styles.toggle}>
            <button
              onClick={() => setRole('student')}
              style={{
                ...styles.toggleBtn,
                ...(role === 'student' ? styles.toggleActive : {}),
              }}
            >
              🎓 Student
            </button>
            <button
              onClick={() => setRole('faculty')}
              style={{
                ...styles.toggleBtn,
                ...(role === 'faculty' ? styles.toggleActive : {}),
              }}
            >
              👨‍🏫 Faculty
            </button>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {role === 'student' ? (
              <div>
                <label className="input-label">Student ID</label>
                <input
                  id="student-id-input"
                  className="input-field"
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
                    className="input-field"
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
                    className="input-field"
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
              <div style={styles.error}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              ) : (
                `Sign In as ${role === 'student' ? 'Student' : 'Faculty'}`
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={styles.demo}>
            <div style={styles.demoTitle}>Demo Credentials</div>
            {role === 'student' ? (
              <div style={styles.demoText}>Student ID: <strong>STU001</strong></div>
            ) : (
              <>
                <div style={styles.demoText}>Email: <strong>arjun.mehta@vigil.edu</strong></div>
                <div style={styles.demoText}>Password: <strong>teacher123</strong></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }) {
  return (
    <div style={styles.featureItem}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={styles.featureText}>{text}</span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '20px',
  },
  particles: {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)',
    animation: 'floatOrb 20s ease-in-out infinite',
  },
  container: {
    display: 'flex',
    gap: '60px',
    alignItems: 'center',
    maxWidth: '900px',
    width: '100%',
    zIndex: 1,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  brandSide: {
    flex: '1 1 320px',
    maxWidth: '400px',
  },
  logoLarge: { marginBottom: '16px' },
  brandTitle: {
    fontSize: '3rem',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    marginBottom: '8px',
  },
  brandSub: {
    fontSize: '1rem',
    color: '#8b95b3',
    marginBottom: '32px',
    fontWeight: 400,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  featureText: {
    fontSize: '0.9rem',
    color: '#b0b8d0',
    fontWeight: 400,
  },
  card: {
    flex: '1 1 360px',
    maxWidth: '420px',
    padding: '40px',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#f0f4ff',
    marginBottom: '4px',
  },
  cardSub: {
    fontSize: '0.875rem',
    color: '#8b95b3',
    marginBottom: '24px',
  },
  toggle: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '24px',
  },
  toggleBtn: {
    flex: 1,
    padding: '10px',
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'transparent',
    color: '#8b95b3',
    transition: 'all 0.2s',
  },
  toggleActive: {
    background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))',
    color: '#00d4ff',
    boxShadow: '0 2px 10px rgba(0,212,255,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    fontSize: '0.8rem',
    color: '#f43f5e',
    background: 'rgba(244, 63, 94, 0.08)',
    borderRadius: '8px',
    border: '1px solid rgba(244, 63, 94, 0.15)',
  },
  demo: {
    marginTop: '20px',
    padding: '14px',
    background: 'rgba(0,212,255,0.04)',
    borderRadius: '10px',
    border: '1px solid rgba(0,212,255,0.08)',
  },
  demoTitle: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#00d4ff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  demoText: {
    fontSize: '0.8rem',
    color: '#8b95b3',
    marginBottom: '2px',
  },
};
