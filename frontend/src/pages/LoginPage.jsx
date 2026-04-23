/**
 * Login Page
 * Handles user authentication with premium UI
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn, FiArrowRight, FiShield } from 'react-icons/fi';
import { MdBloodtype } from 'react-icons/md';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import '../styles/auth.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 🩸');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob" />
      
      <div className="auth-container">
        {/* Left Panel: Hero Section */}
        <div className="auth-hero">
          <div className="hero-content">
            <span className="hero-tag">Community Platform</span>
            <h1 className="hero-title">Every Drop Counts.</h1>
            <p className="hero-subtitle">
              Join thousands of donors and help save lives in your community. 
              Our smart network connects donors with urgent needs instantly.
            </p>
            
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">10k+</span>
                <span className="stat-label">Active Donors</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">2.5k+</span>
                <span className="stat-label">Lives Saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="auth-form-panel">
          <div className="auth-header">
            <div className="auth-logo">
              <MdBloodtype className="logo-icon" />
              <h2>BloodConnect</h2>
            </div>
            <p>Welcome back! Please enter your details.</p>
          </div>

          {error && (
            <div className="auth-error">
              <FiShield /> {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <FiMail className="icon" />
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <FiLock className="icon" />
                <input
                  id="password"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="loader-dots">
                  <span></span><span></span><span></span>
                </div>
              ) : (
                <>
                  Sign In <FiLogIn />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? 
            <Link to="/register">
              Create Account <FiArrowRight size={14} style={{ marginLeft: '4px' }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
