import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('vigil_token');
    const savedUser = localStorage.getItem('vigil_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (tokenValue, userData) => {
    localStorage.setItem('vigil_token', tokenValue);
    localStorage.setItem('vigil_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('vigil_token');
    localStorage.removeItem('vigil_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;
  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, isAuthenticated, isStudent, isFaculty }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
