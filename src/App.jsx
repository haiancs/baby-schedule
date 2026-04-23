import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import DailyPage from './pages/DailyPage'
import WeeklyPage from './pages/WeeklyPage'
import './App.css'

const SKIP_AUTH = false;

function AnimatedRoutes() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const needsAuth = !SKIP_AUTH;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={needsAuth && isLoggedIn ? <Navigate to="/daily" replace /> : <LoginPage />} />
        <Route path="/daily" element={needsAuth && !isLoggedIn ? <Navigate to="/login" replace /> : <DailyPage />} />
        <Route path="/weekly" element={needsAuth && !isLoggedIn ? <Navigate to="/login" replace /> : <WeeklyPage />} />
        <Route path="/" element={<Navigate to={needsAuth && !isLoggedIn ? '/login' : '/daily'} replace />} />
        <Route path="*" element={<Navigate to={needsAuth && !isLoggedIn ? '/login' : '/daily'} replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen font-sans">
          <main className="flex-grow">
            <AnimatedRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
