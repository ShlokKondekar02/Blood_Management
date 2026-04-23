/**
 * 404 Not Found Page
 */

import { useNavigate } from 'react-router-dom';
import { MdBloodtype } from 'react-icons/md';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-page" style={{ flexDirection: 'column', gap: '16px' }}>
      <MdBloodtype style={{ fontSize: '4rem', color: 'var(--primary)', opacity: 0.5 }} />
      <h1 style={{ fontSize: 'var(--font-2xl)', color: 'var(--text-secondary)' }}>404</h1>
      <p style={{ color: 'var(--text-muted)' }}>Page not found</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        Go Home
      </button>
    </div>
  );
};

export default NotFoundPage;
