import React from 'react';
import { Link, useHistory } from 'react-router-dom';

const Header = () => {
  const history = useHistory();

  const user = JSON.parse(localStorage.getItem('user'));

  const navStyle = {
    display: 'flex',
    gap: '22px',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  const buttonStyle = {
    color: '#0f2f6b',
    backgroundColor: 'white',
    border: '2px solid #2563eb',
    textDecoration: 'none',
    padding: '11px 18px',
    borderRadius: '6px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    fontSize: '16px',
    cursor: 'pointer',
  };

  const dashboardStyle = {
    ...buttonStyle,
    backgroundColor: '#1554c0',
    color: 'white',
    border: '2px solid #1554c0',
  };

  const iconStyle = {
    width: '20px',
    height: '20px',
    flexShrink: 0,
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    history.push('/auth');

    window.location.reload();
  };

  return (
    <header
      style={{
        textAlign: 'center',
        padding: '30px 0 28px 0',
        borderBottom: '1px solid #d9dee8',
        marginBottom: '30px',
      }}
    >
      <h1
        style={{
          color: '#071a45',
          fontSize: '36px',
          fontWeight: '700',
          margin: '0 0 24px 0',
        }}
      >
        OpsPilot
      </h1>

      <nav style={navStyle}>
        {/* Dashboard */}
        <Link to="/" style={dashboardStyle}>
          <svg
            style={iconStyle}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M3 10.8L12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5v-9.7z" />
          </svg>

          Dashboard
        </Link>

        {/* New Incident */}
        <Link to="/incidents/new" style={buttonStyle}>
          <svg
            style={iconStyle}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>

          New Incident
        </Link>

        {user ? (
          <>
            {/* Logged-in User */}
            <div
              style={{
                ...buttonStyle,
                cursor: 'default',
                borderColor: '#cbd5e1',
                color: '#1f2937',
              }}
            >
              <svg
                style={iconStyle}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4.5 21c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" />
              </svg>

              {user.name}
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                ...buttonStyle,
                color: '#dc2626',
                borderColor: '#dc2626',
              }}
            >
              <svg
                style={iconStyle}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M14 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6" />
              </svg>

              Logout
            </button>
          </>
        ) : (
          /* Login */
          <Link to="/auth" style={buttonStyle}>
            <svg
              style={iconStyle}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4.5 21c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" />
            </svg>

            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;