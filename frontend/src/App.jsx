/**
 * App Component
 * Main application with routing and context providers
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import useAuth from './hooks/useAuth';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import BloodBanksPage from './pages/BloodBanksPage';
import NotFoundPage from './pages/NotFoundPage';

// Styles
import './styles/index.css';
import './styles/components.css';
import './styles/chat.css';
import './styles/community.css';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="logo">🩸 BloodConnect</div>
        <div className="loader" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

/**
 * Public Route Component
 * Redirects to home if user is already logged in
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="logo">🩸 BloodConnect</div>
        <div className="loader" />
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/" />;
};

/**
 * App Routes
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/blood-banks" element={<ProtectedRoute><BloodBanksPage /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

/**
 * Main App Component
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1a2e',
                color: '#e8e8f0',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif'
              },
              success: {
                iconTheme: { primary: '#00c853', secondary: '#1a1a2e' }
              },
              error: {
                iconTheme: { primary: '#ff1744', secondary: '#1a1a2e' }
              }
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
