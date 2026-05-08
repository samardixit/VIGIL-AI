import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = {
  student: [
    { label: 'Dashboard', path: '/student', icon: GridIcon },
    { label: 'Scan',      path: '/scan',    icon: CameraIcon },
  ],
  faculty: [
    { label: 'Dashboard', path: '/teacher', icon: GridIcon },
  ],
};

export default function Navbar() {
  const { user, logout, isStudent, isFaculty } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const role = isFaculty ? 'faculty' : 'student';
  const navItems = NAV_ITEMS[role] || [];
  const homePath = isFaculty ? '/teacher' : '/student';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="sticky top-0 z-50" style={{
      background: 'rgba(11,16,32,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-8">

        {/* Logo */}
        <button
          onClick={() => navigate(homePath)}
          className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <ShieldIcon />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">VIGIL-AI</span>
        </button>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-white/[0.08] text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={14} className={active ? 'text-blue-400' : ''} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Right: system status + user */}
        <div className="flex items-center gap-3">
          {/* System status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            <span className="text-xs text-emerald-400 font-medium">System Online</span>
          </div>

          {/* Role badge */}
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border hidden sm:block ${
            isFaculty
              ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
            {isFaculty ? 'Faculty' : 'Student'}
          </div>

          {/* User name */}
          <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-300">
              {(user.user?.first_name || user.name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ── Icons ──────────────────────────────────────────────── */
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function GridIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function CameraIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
