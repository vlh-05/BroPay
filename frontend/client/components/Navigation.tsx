import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import './Navigation.css';

const Navigation: React.FC = () => {
  const { logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useSelector((state: RootState) => state.notification);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/chat', label: 'Chat' },
    { path: '/payment', label: 'Payment' },
    { path: '/recurring', label: 'Recurring' },
    { path: '/split', label: 'Split' },
    { path: '/friends', label: 'Friends' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard" className="logo">
            BroPay
          </Link>
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <div className="navbar-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar-actions">
            <Link
              to="/notifications"
              className={`nav-link notification-badge ${
                unreadCount > 0 ? 'has-unread' : ''
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              🔔
              {unreadCount > 0 && (
                <span className="badge-count">{unreadCount}</span>
              )}
            </Link>

            <Link
              to="/profile"
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              👤
            </Link>

            <button className="btn btn-danger btn-small" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
