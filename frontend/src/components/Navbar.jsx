import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user, logout, isStudent, isFaculty } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <div style={styles.logoArea} onClick={() => navigate(isStudent ? '/student' : '/teacher')}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#navGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span style={styles.logoText}>VIGIL-AI</span>
        </div>

        {/* Nav Links */}
        <div style={styles.links}>
          {isStudent && (
            <>
              <NavLink to="/student" current={location.pathname} label="Dashboard" />
              <NavLink to="/scan" current={location.pathname} label="Scan" />
            </>
          )}
          {isFaculty && (
            <NavLink to="/teacher" current={location.pathname} label="Dashboard" />
          )}
        </div>

        {/* User info */}
        <div style={styles.userArea}>
          <span className={`badge ${isFaculty ? 'badge-violet' : 'badge-blue'}`}>
            {isFaculty ? '👨‍🏫 Faculty' : '🎓 Student'}
          </span>
          <span style={styles.userName}>{user.user?.first_name || user.name || 'User'}</span>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, current, label }) {
  const isActive = current === to;
  return (
    <a
      href={to}
      onClick={(e) => { e.preventDefault(); window.location.href = to; }}
      style={{
        ...styles.navLink,
        color: isActive ? '#00d4ff' : '#8b95b3',
        borderBottom: isActive ? '2px solid #00d4ff' : '2px solid transparent',
      }}
    >
      {label}
    </a>
  );
}

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(6, 9, 24, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  inner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  logoIcon: { display: 'flex', alignItems: 'center' },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  links: {
    display: 'flex',
    gap: '8px',
  },
  navLink: {
    padding: '8px 16px',
    fontSize: '0.875rem',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#f0f4ff',
  },
};
