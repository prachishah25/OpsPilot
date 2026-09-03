import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setMessage('');

      const response = await fetch(
        'http://localhost:5001/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      );

      console.log('Logged in user:', data.user);

      setMessage('Login successful.');
      setPassword('');

      window.location.href = '/';
    } catch (error) {
      console.error('Login error:', error);
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '7px',
    fontSize: '15px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '16px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#1f2937',
  };

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '0 30px 40px',
        boxSizing: 'border-box',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          color: '#111827',
          fontSize: '26px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          marginBottom: '24px',
        }}
      >
        Login to OpsPilot
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          border: '1px solid #d9dee8',
          borderRadius: '10px',
          padding: '28px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Password</label>

          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) =>
                setShowPassword(e.target.checked)
              }
            />

            Show password
          </label>

          <Link
            to="/forgot-password"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            backgroundColor: isSubmitting
              ? '#93c5fd'
              : '#2563eb',
            color: 'white',
            border: 'none',
            padding: '13px 18px',
            borderRadius: '7px',
            cursor: isSubmitting
              ? 'not-allowed'
              : 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>

        {message && (
          <p
            style={{
              textAlign: 'center',
              marginTop: '16px',
              marginBottom: '0',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: '14px',
              fontWeight: '600',
              color:
                message === 'Login successful.'
                  ? '#16a34a'
                  : '#dc2626',
            }}
          >
            {message}
          </p>
        )}

        <p
          style={{
            textAlign: 'center',
            marginTop: '22px',
            marginBottom: '0',
            color: '#64748b',
            fontSize: '14px',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;