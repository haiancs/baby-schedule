import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '../cloudContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loginState = await auth.getLoginState();
        setUser(loginState ? (auth.currentUser || true) : null);
      } catch {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const loginState = await auth.getLoginState();
      setUser(loginState ? (auth.currentUser || true) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await auth.signOut();
    } catch (e) {
      // ignore
    }
    setUser(null);
  }, []);

  if (user === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">👶</span>
          <div className="loading loading-spinner loading-md text-gray-400"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
