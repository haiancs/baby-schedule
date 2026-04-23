import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DailyPage from './pages/DailyPage'
import WeeklyPage from './pages/WeeklyPage'
import './App.css'

function AnimatedRoutes() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/daily" replace /> : <LoginPage />} />
        <Route path="/register" element={isLoggedIn ? <Navigate to="/daily" replace /> : <RegisterPage />} />
        <Route path="/daily" element={isLoggedIn ? <DailyPage /> : <Navigate to="/login" replace />} />
        <Route path="/weekly" element={isLoggedIn ? <WeeklyPage /> : <Navigate to="/login" replace />} />
        <Route path="/" element={<Navigate to={isLoggedIn ? '/daily' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={isLoggedIn ? '/daily' : '/login'} replace />} />
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
