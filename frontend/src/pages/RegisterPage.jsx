/**
 * Register Page
 * New user registration with premium UI
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiMapPin, FiUserPlus, FiArrowRight, FiShield } from 'react-icons/fi';
import { MdBloodtype } from 'react-icons/md';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { BLOOD_GROUPS } from '../utils/constants';
import '../styles/auth.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bloodGroup: 'O+',
    phone: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData);
      toast.success('Account created successfully! Please sign in. 🎉');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
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
            <span className="hero-tag">Join the Mission</span>
            <h1 className="hero-title">Start Saving Lives Today.</h1>
            <p className="hero-subtitle">
              Become part of a network of heroes. Register as a donor or 
              request emergency blood support within minutes.
            </p>
            
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">Instant</span>
                <span className="stat-label">Alerts</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">Secure</span>
                <span className="stat-label">Community</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Register Form */}
        <div className="auth-form-panel">
          <div className="auth-header">
            <div className="auth-logo">
              <MdBloodtype className="logo-icon" />
              <h2>BloodConnect</h2>
            </div>
            <p>Create your account to join the community.</p>
          </div>

          {error && (
            <div className="auth-error">
              <FiShield /> {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="name">Full Name *</label>
              <div className="input-wrapper">
                <FiUser className="icon" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="auth-input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="reg-email">Email Address *</label>
              <div className="input-wrapper">
                <FiMail className="icon" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className="auth-input"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label htmlFor="reg-password">Password *</label>
                <div className="input-wrapper">
                  <FiLock className="icon" />
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    className="auth-input"
                    placeholder="Min 6 chars"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="input-wrapper">
                  <FiLock className="icon" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="auth-input"
                    placeholder="Repeat"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label htmlFor="bloodGroup">Blood Group</label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  className="auth-select"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="input-wrapper">
                  <FiPhone className="icon" />
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    className="auth-input"
                    placeholder="+91..."
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="location">Location / City</label>
              <div className="input-wrapper">
                <FiMapPin className="icon" />
                <input
                  id="location"
                  name="location"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={formData.location}
                  onChange={handleChange}
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
                  Register Now <FiUserPlus />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? 
            <Link to="/login">
              Sign In <FiArrowRight size={14} style={{ marginLeft: '4px' }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
